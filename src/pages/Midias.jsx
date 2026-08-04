import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import MidiaForm from "@/components/MidiaForm";
import MidiaDetailSheet from "@/components/MidiaDetailSheet";
import MidiaImportDialog from "@/components/MidiaImportDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Clapperboard, Upload, Search, Sparkles } from "lucide-react";
import { useMidias } from "@/hooks/useMidias";
import { useFranquias } from "@/hooks/useFranquias";

const TIPO_LABEL = { anime: "Anime", ova: "OVA", ona: "ONA", filme: "Filme", especial: "Especial", serie: "Série" };

const TIPO_SLUGS = { animes: "anime", ovas: "ova", onas: "ona", filmes: "filme", especiais: "especial", series: "serie" };

const SLUG_POR_TIPO = Object.fromEntries(Object.entries(TIPO_SLUGS).map(([slug, tipo]) => [tipo, slug]));

const TIPO_PLURAL = { anime: "Animes", ova: "OVAs", ona: "ONAs", filme: "Filmes", especial: "Especiais", serie: "Séries" };

const STATUS_STYLE = {
  planejado: "bg-ink-100 text-ink-500",
  assistindo: "bg-sky-100 text-sky-700",
  concluido: "bg-emerald-100 text-emerald-700",
  pausado: "bg-gold-100 text-gold-700",
  abandonado: "bg-rust-100 text-rust-700",
};

const STATUS_LABEL = {
  planejado: "Planejado",
  assistindo: "Assistindo",
  concluido: "Concluído",
  pausado: "Pausado",
  abandonado: "Abandonado",
};

export default function Midias() {
  const { tipoSlug, id } = useParams();
  const navigate = useNavigate();
  const tipoFiltro = tipoSlug ? TIPO_SLUGS[tipoSlug] : "todos";

  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [novoDefaults, setNovoDefaults] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  const [tipoFiltroLocal, setTipoFiltroLocal] = useState("todos");
  const tipoEfetivo = tipoFiltro === "todos" ? tipoFiltroLocal : tipoFiltro;

  const { midias, isLoading, deleteMidia, createOrUpdateMidia } = useMidias();
  const { franquias, createFranquia } = useFranquias();

  const franquiaPorId = useMemo(() => Object.fromEntries(franquias.map((f) => [f.id, f.nome])), [franquias]);
  const midiaPorId = useMemo(() => Object.fromEntries(midias.map((m) => [m.id, m])), [midias]);
  const filhosPorPaiId = useMemo(() => {
    const map = {};
    for (const m of midias) {
      if (!m.midia_pai_id) continue;
      if (!map[m.midia_pai_id]) map[m.midia_pai_id] = [];
      map[m.midia_pai_id].push(m);
    }
    return map;
  }, [midias]);

  const filtradas = useMemo(
    () =>
      midias
        .filter((m) => tipoEfetivo === "todos" || m.tipo === tipoEfetivo)
        .filter((m) => statusFiltro === "todos" || m.status === statusFiltro)
        .filter((m) => m.titulo.toLowerCase().includes(busca.trim().toLowerCase()))
        .sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR")),
    [midias, tipoEfetivo, statusFiltro, busca]
  );

  const temNovidade = useMemo(() => {
    const set = new Set();
    for (const m of midias) {
      if (m.status !== "concluido") continue;
      const filhos = filhosPorPaiId[m.id] || [];
      if (filhos.some((f) => f.status === "planejado" || f.status === "assistindo")) {
        set.add(m.id);
      }
    }
    return set;
  }, [midias, filhosPorPaiId]);

  const titulo = tipoFiltro === "todos" ? "Minha Lista" : TIPO_PLURAL[tipoFiltro];

  const selecionada = id ? midiaPorId[id] || null : null;
  const relacionados = selecionada ? filhosPorPaiId[selecionada.id] || [] : [];
  const paiDaSelecionada = selecionada?.midia_pai_id ? midiaPorId[selecionada.midia_pai_id] : null;

  const irPara = (m) => {
    const slug = SLUG_POR_TIPO[m.tipo];
    navigate(`/midias/${slug}/${m.id}`);
  };

  const fecharPainel = () => {
    navigate(tipoSlug ? `/midias/${tipoSlug}` : "/midias");
  };

  const abrirNovo = () => {
    setNovoDefaults(tipoFiltro !== "todos" ? { tipo: tipoFiltro } : null);
    setOpen(true);
  };

  const handleAddRelatedBatch = async ({ tipo, status, episodio_atual, genero, titulos }) => {
    for (const t of titulos) {
      await createOrUpdateMidia({
        titulo: t,
        tipo,
        status,
        episodio_atual,
        genero,
        midia_pai_id: selecionada.id,
        franquia_id: selecionada.franquia_id || "",
      });
    }
  };

  const handleSaved = async (formData) => {
    const salvo = await createOrUpdateMidia(formData);
    setOpen(false);
    if (salvo?.id) irPara(salvo);
  };

  const handleSavedNoSheet = async (formData) => {
    await createOrUpdateMidia(formData);
  };

  const handleDelete = () => {
    deleteMidia(deleting.id);
    if (selecionada?.id === deleting.id) fecharPainel();
    setDeleting(null);
  };

  return (
    <div>
      <PageHeader
        title={titulo}
        subtitle="Animes, séries e filmes que você está acompanhando"
      />

      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por título..."
            className="pl-8"
          />
        </div>
        <div className="flex-1" />
        {tipoFiltro === "todos" && (
          <Select value={tipoFiltroLocal} onValueChange={setTipoFiltroLocal}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {Object.entries(TIPO_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={statusFiltro} onValueChange={setStatusFiltro}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4 mr-1.5" /> Importar
        </Button>
        <Button onClick={abrirNovo}>
          <Plus className="h-4 w-4 mr-1.5" /> Novo
        </Button>
      </div>

      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <Clapperboard className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nada por aqui ainda.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                  <th className="text-left px-4 py-2.5">Nome</th>
                  <th className="text-left px-4 py-2.5">Tipo</th>
                  <th className="text-left px-4 py-2.5">Episódio</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => irPara(m)}
                    className="border-b border-ink-50 last:border-b-0 hover:bg-ink-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2.5 text-ink-900 max-w-[280px]">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{m.titulo}</span>
                        {temNovidade.has(m.id) && (
                          <span
                            title="Tem temporada/relacionado novo desde que você concluiu"
                            className="flex-shrink-0 flex items-center gap-0.5 text-[10px] font-medium rounded-full bg-sky-100 text-sky-700 px-1.5 py-0.5"
                          >
                            <Sparkles className="h-2.5 w-2.5" /> Novo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-ink-500">{TIPO_LABEL[m.tipo]}</td>
                    <td className="px-4 py-2.5 text-ink-500 tabular-nums">
                      {["filme", "especial"].includes(m.tipo) ? "-" : m.episodio_atual ?? "-"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${STATUS_STYLE[m.status]}`}>
                        {STATUS_LABEL[m.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <MidiaDetailSheet
        midia={selecionada}
        midias={midias}
        franquias={franquias}
        franquiaPorId={franquiaPorId}
        relacionados={relacionados}
        pai={paiDaSelecionada}
        onOpenChange={(v) => !v && fecharPainel()}
        onSave={handleSavedNoSheet}
        onDelete={(m) => (filhosPorPaiId[m.id]?.length ? null : setDeleting(m))}
        onCreateFranquia={createFranquia}
        onSelectMidia={(midiaId) => irPara(midiaPorId[midiaId])}
        onAddRelatedBatch={handleAddRelatedBatch}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo item</DialogTitle></DialogHeader>
          <MidiaForm
            midia={null}
            midias={midias}
            franquias={franquias}
            defaults={novoDefaults}
            onCreateFranquia={createFranquia}
            onSaved={handleSaved}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <MidiaImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        midias={midias}
        createOrUpdateMidia={createOrUpdateMidia}
      />

      <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir item</DialogTitle></DialogHeader>
          <p className="text-sm text-ink-500">Excluir "{deleting?.titulo}" da sua lista?</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDeleting(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
