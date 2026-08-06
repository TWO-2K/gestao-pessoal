import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { parseCSV, baixarCSV } from "@/lib/csv";
import { gerarTemplateCSV, baixarTemplateXLSX, TIPOS_VALIDOS, STATUS_VALIDOS } from "@/lib/midiaImportTemplate";
import { semAcento, normalizarCabecalho } from "@/lib/text";
import { useViewAs } from "@/lib/ViewAsContext";
import { Upload, Download, CheckCircle2, AlertTriangle, History, X } from "lucide-react";

const LOG_KEY_PREFIX = "midia_import_log_";

function lerUltimoLog(userId) {
  if (!userId) return null;
  try {
    const bruto = localStorage.getItem(LOG_KEY_PREFIX + userId);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

function salvarLog(userId, log) {
  if (!userId) return;
  try {
    localStorage.setItem(LOG_KEY_PREFIX + userId, JSON.stringify(log));
  } catch {
    // localStorage indisponível, ignora
  }
}

function normalizarChave(titulo) {
  return semAcento(titulo.trim().toLowerCase());
}

function normalizarLinhas(linhasBrutas) {
  return linhasBrutas.map((linha) => {
    const normalizada = {};
    for (const [chave, valor] of Object.entries(linha)) {
      normalizada[normalizarCabecalho(chave)] = valor == null ? "" : String(valor).trim();
    }
    return normalizada;
  });
}

async function lerArquivo(file) {
  const nome = file.name.toLowerCase();
  if (nome.endsWith(".csv")) {
    const texto = await file.text();
    return parseCSV(texto);
  }
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const planilha = workbook.Sheets[workbook.SheetNames[0]];
  const registros = XLSX.utils.sheet_to_json(planilha, { defval: "" });
  return normalizarLinhas(registros);
}

export default function MidiaImportDialog({ open, onOpenChange, midias, createOrUpdateMidia }) {
  const { viewedUserId } = useViewAs();
  const [linhas, setLinhas] = useState([]);
  const [erros, setErros] = useState([]);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [status, setStatus] = useState("idle"); // idle | pronto | importando | concluido
  const [resultado, setResultado] = useState(null);
  const [progresso, setProgresso] = useState({ feito: 0, total: 0 });
  const [ultimoLog, setUltimoLog] = useState(null);

  useEffect(() => {
    if (open) setUltimoLog(lerUltimoLog(viewedUserId));
  }, [open, viewedUserId]);

  const limparLog = () => {
    if (viewedUserId) localStorage.removeItem(LOG_KEY_PREFIX + viewedUserId);
    setUltimoLog(null);
  };

  const reset = () => {
    setLinhas([]);
    setErros([]);
    setNomeArquivo("");
    setStatus("idle");
    setResultado(null);
    setProgresso({ feito: 0, total: 0 });
  };

  const handleClose = (v) => {
    if (!v && status === "importando") return;
    if (!v) reset();
    onOpenChange(v);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNomeArquivo(file.name);
    const registros = await lerArquivo(file);

    const errosEncontrados = [];
    const validas = registros.map((r, idx) => {
      const linhaNum = idx + 2;
      const titulo = (r.titulo || "").trim();
      if (!titulo) {
        errosEncontrados.push(`Linha ${linhaNum}: título vazio, ignorada.`);
        return null;
      }
      let tipo = semAcento((r.tipo || "anime").trim().toLowerCase());
      if (!TIPOS_VALIDOS.includes(tipo)) {
        errosEncontrados.push(`Linha ${linhaNum}: tipo "${r.tipo}" inválido, usando "anime".`);
        tipo = "anime";
      }
      let status = semAcento((r.status || "planejado").trim().toLowerCase());
      if (!STATUS_VALIDOS.includes(status)) {
        errosEncontrados.push(`Linha ${linhaNum}: status "${r.status}" inválido, usando "planejado".`);
        status = "planejado";
      }
      const genero = (r.genero || "").split(";").map((g) => g.trim()).filter(Boolean).join(", ");
      return {
        titulo,
        tipo,
        status,
        episodio_atual: r.episodio_atual?.trim() || "",
        ano: r.ano?.trim() || "",
        genero,
        observacoes: r.observacoes?.trim() || "",
        midia_pai: (r.midia_pai || "").trim(),
      };
    }).filter(Boolean);

    setLinhas(validas);
    setErros(errosEncontrados);
    setStatus(validas.length > 0 ? "pronto" : "idle");
  };

  const handleImportar = async () => {
    setStatus("importando");
    const totalEtapas = linhas.length + linhas.filter((l) => l.midia_pai).length;
    setProgresso({ feito: 0, total: totalEtapas });

    const mapaTitulos = new Map();
    const registrarTitulo = (titulo, id, tipo) => {
      const chave = normalizarChave(titulo);
      if (!mapaTitulos.has(chave)) mapaTitulos.set(chave, []);
      mapaTitulos.get(chave).push({ id, tipo });
    };
    midias.forEach((m) => registrarTitulo(m.titulo, m.id, m.tipo));

    const resolverPai = (tituloPai) => {
      const candidatos = mapaTitulos.get(normalizarChave(tituloPai));
      if (!candidatos || candidatos.length === 0) return { id: null, ambiguo: false };
      if (candidatos.length === 1) return { id: candidatos[0].id, ambiguo: false };
      const anime = candidatos.find((c) => c.tipo === "anime");
      return { id: (anime || candidatos[0]).id, ambiguo: true };
    };

    const idsCriados = [];
    const falhas = [];
    let feito = 0;

    for (const linha of linhas) {
      try {
        const salvo = await createOrUpdateMidia({
          titulo: linha.titulo,
          tipo: linha.tipo,
          status: linha.status,
          episodio_atual: linha.episodio_atual,
          ano: linha.ano,
          genero: linha.genero,
          observacoes: linha.observacoes,
          franquia_id: "",
          midia_pai_id: "",
        });
        if (salvo?.id) {
          registrarTitulo(linha.titulo, salvo.id, linha.tipo);
          idsCriados.push({ ...linha, id: salvo.id });
        }
      } catch (err) {
        falhas.push(`"${linha.titulo}": ${err.message}`);
      }
      feito++;
      setProgresso({ feito, total: totalEtapas });
    }

    const semPaiEncontrado = [];
    for (const item of idsCriados) {
      if (!item.midia_pai) continue;
      const { id: paiId, ambiguo } = resolverPai(item.midia_pai);
      if (!paiId || paiId === item.id) {
        semPaiEncontrado.push(`"${item.titulo}" → pai "${item.midia_pai}" não encontrado.`);
        continue;
      }
      if (ambiguo) {
        semPaiEncontrado.push(`"${item.titulo}" → havia mais de um item chamado "${item.midia_pai}"; vinculado ao do tipo Anime, confira.`);
      }
      try {
        await createOrUpdateMidia({
          id: item.id,
          titulo: item.titulo,
          tipo: item.tipo,
          status: item.status,
          episodio_atual: item.episodio_atual,
          ano: item.ano,
          genero: item.genero,
          observacoes: item.observacoes,
          franquia_id: "",
          midia_pai_id: paiId,
        });
      } catch (err) {
        falhas.push(`Vincular "${item.titulo}" ao pai: ${err.message}`);
      }
      feito++;
      setProgresso({ feito, total: totalEtapas });
    }

    const resultadoFinal = {
      total: linhas.length,
      criados: idsCriados.length,
      falhas: [...falhas, ...semPaiEncontrado],
    };
    setResultado(resultadoFinal);
    setStatus("concluido");
    salvarLog(viewedUserId, {
      ...resultadoFinal,
      nomeArquivo,
      data: new Date().toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Importar em massa</DialogTitle></DialogHeader>

        <div className="space-y-4">
          {status === "idle" && ultimoLog && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="flex items-center gap-1.5 font-medium">
                  <History className="h-3.5 w-3.5" /> Última importação
                </p>
                <button
                  type="button"
                  onClick={limparLog}
                  className="text-sky-500 hover:text-sky-700"
                  title="Limpar registro"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p>
                {new Date(ultimoLog.data).toLocaleString("pt-BR")}
                {ultimoLog.nomeArquivo ? ` · ${ultimoLog.nomeArquivo}` : ""}
              </p>
              <p>{ultimoLog.criados} de {ultimoLog.total} itens importados com sucesso.</p>
              {ultimoLog.falhas?.length > 0 && (
                <div className="text-xs text-rust-700 bg-rust-50 border border-rust-200 rounded-lg p-2 space-y-0.5 max-h-24 overflow-y-auto mt-1">
                  {ultimoLog.falhas.map((f, i) => <p key={i}>{f}</p>)}
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl border border-ink-200 bg-ink-50 p-3 text-sm text-ink-500 space-y-2">
            <p>Envie um arquivo Excel (.xlsx) ou CSV com as colunas: <code className="text-xs">titulo, tipo, status, episodio_atual, ano, genero, observacoes, midia_pai</code>.</p>
            <p>Use <code className="text-xs">midia_pai</code> com o título exato de outro item da planilha (ou já existente) para vincular OVAs/filmes/temporadas a um anime — deixe em branco quando não houver vínculo. Vários gêneros: separe por <code className="text-xs">;</code>.</p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-white"
                onClick={() => baixarTemplateXLSX()}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> Modelo (.xlsx)
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-white"
                onClick={() => baixarCSV("modelo_lista_midias.csv", gerarTemplateCSV())}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> Modelo (.csv)
              </Button>
            </div>
          </div>

          {status !== "concluido" && (
            <div>
              <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-200 py-6 cursor-pointer hover:border-ink-300 transition-colors">
                <Upload className="h-5 w-5 text-ink-400" />
                <span className="text-sm text-ink-500">{nomeArquivo || "Selecionar arquivo .xlsx ou .csv"}</span>
                <input
                  type="file"
                  accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={handleFile}
                />
              </label>
            </div>
          )}

          {status === "pronto" && (
            <div className="space-y-2">
              <p className="text-sm text-ink-600">
                <CheckCircle2 className="h-4 w-4 inline text-emerald-600 mr-1" />
                {linhas.length} {linhas.length === 1 ? "item pronto" : "itens prontos"} para importar.
              </p>
              {erros.length > 0 && (
                <div className="text-xs text-gold-700 bg-gold-50 border border-gold-200 rounded-lg p-2 space-y-0.5 max-h-28 overflow-y-auto">
                  {erros.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" onClick={reset}>Cancelar</Button>
                <Button type="button" onClick={handleImportar}>Importar {linhas.length} itens</Button>
              </div>
            </div>
          )}

          {status === "importando" && (
            <div className="py-2 space-y-2">
              <p className="text-sm text-ink-500 text-center">
                Importando... {progresso.feito} de {progresso.total}
              </p>
              <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                <div
                  className="h-full bg-sky-600 transition-all duration-200"
                  style={{ width: `${progresso.total ? (progresso.feito / progresso.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {status === "concluido" && resultado && (
            <div className="space-y-2">
              <p className="text-sm text-ink-700">
                <CheckCircle2 className="h-4 w-4 inline text-emerald-600 mr-1" />
                {resultado.criados} de {resultado.total} itens importados com sucesso.
              </p>
              {resultado.falhas.length > 0 && (
                <div className="text-xs text-rust-700 bg-rust-50 border border-rust-200 rounded-lg p-2 space-y-0.5 max-h-28 overflow-y-auto">
                  <p className="flex items-center gap-1 font-medium"><AlertTriangle className="h-3.5 w-3.5" /> Pendências</p>
                  {resultado.falhas.map((f, i) => <p key={i}>{f}</p>)}
                </div>
              )}
              <div className="flex justify-end pt-1">
                <Button type="button" onClick={() => handleClose(false)}>Concluir</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
