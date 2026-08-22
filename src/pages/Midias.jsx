import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import MidiaForm from "@/components/MidiaForm";
import MidiaDetailSheet from "@/components/MidiaDetailSheet";
import MidiaImportDialog from "@/components/MidiaImportDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Clapperboard, Upload, Search, Sparkles, Check, X, ChevronLeft, ChevronRight, Clock, ListTodo, PlayCircle, CheckCircle2, PauseCircle, Lock } from "lucide-react";
import { useMidias } from "@/hooks/useMidias";
import { useFranquias } from "@/hooks/useFranquias";
import { useUsuarios } from "@/hooks/useUsuarios";
import { useViewAs } from "@/lib/ViewAsContext";
import { useUsuarioAtual } from "@/hooks/useUsuarioAtual";

const TIPO_LABEL = { anime: "Anime", ova: "OVA", ona: "ONA", filme: "Filme", especial: "Especial", serie: "Série" };

const TIPO_SLUGS = { animes: "anime", ovas: "ova", onas: "ona", filmes: "filme", especiais: "especial", series: "serie" };

const SLUG_POR_TIPO = Object.fromEntries(Object.entries(TIPO_SLUGS).map(([slug, tipo]) => [tipo, slug]));

const TIPO_PLURAL = { anime: "Animes", ova: "OVAs", ona: "ONAs", filme: "Filmes", especial: "Especiais", serie: "Séries" };

const STATUS_STYLE = {
  pendente: "bg-rust-100 text-rust-700",
  planejado: "bg-ink-100 text-ink-500",
  assistindo: "bg-sky-100 text-sky-700",
  concluido: "bg-emerald-100 text-emerald-700",
  pausado: "bg-gold-100 text-gold-700",
};

const STATUS_LABEL = {
  pendente: "Pendente",
  planejado: "Planejado",
  assistindo: "Assistindo",
  concluido: "Concluído",
  pausado: "Pausado",
};

const STATUS_ICON = {
  pendente: Clock,
  planejado: ListTodo,
  assistindo: PlayCircle,
  concluido: CheckCircle2,
  pausado: PauseCircle,
};

const STATUS_CARD_STYLE = {
  pendente: { icon: "text-rust-500", ring: "hover:border-rust-200" },
  planejado: { icon: "text-ink-400", ring: "hover:border-ink-300" },
  assistindo: { icon: "text-sky-500", ring: "hover:border-sky-200" },
  concluido: { icon: "text-emerald-500", ring: "hover:border-emerald-200" },
  pausado: { icon: "text-gold-500", ring: "hover:border-gold-200" },
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
  const [selecionados, setSelecionados] = useState(new Set());
  const [statusEmMassa, setStatusEmMassa] = useState("");
  const [aplicandoEmMassa, setAplicandoEmMassa] = useState(false);
  const [pagina, setPagina] = useState(1);
  const ITENS_POR_PAGINA = 20;

  const { midias, isLoading, deleteMidia, createOrUpdateMidia, toggleVisivelApenasAdmin } = useMidias();
  const { franquias, createFranquia } = useFranquias();
  const { usuarios } = useUsuarios();
  const { viewedUserId } = useViewAs();
  const { usuario } = useUsuarioAtual();
  const isAdmin = usuario?.role === "admin";

  const outrosUsuarios = useMemo(
    () => usuarios.filter((u) => u.ativo && u.id !== viewedUserId),
    [usuarios, viewedUserId]
  );

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

  const [somenteNovidades, setSomenteNovidades] = useState(false);

  const filtradas = useMemo(
    () =>
      midias
        .filter((m) => tipoEfetivo === "todos" || m.tipo === tipoEfetivo)
        .filter((m) => statusFiltro === "todos" || m.status === statusFiltro)
        .filter((m) => !somenteNovidades || temNovidade.has(m.id))
        .filter((m) => m.titulo.toLowerCase().includes(busca.trim().toLowerCase()))
        .sort((a, b) => {
          if (statusFiltro === "concluido") {
            const dataA = a.concluido_em ? new Date(a.concluido_em).getTime() : 0;
            const dataB = b.concluido_em ? new Date(b.concluido_em).getTime() : 0;
            if (dataA !== dataB) return dataB - dataA;
          }
          return a.titulo.localeCompare(b.titulo, "pt-BR");
        }),
    [midias, tipoEfetivo, statusFiltro, busca, somenteNovidades, temNovidade]
  );

  useEffect(() => {
    setSelecionados(new Set());
    setPagina(1);
  }, [tipoEfetivo, statusFiltro, busca, tipoFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const paginadas = filtradas.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

  const titulo = tipoFiltro === "todos" ? "Minha Lista" : TIPO_PLURAL[tipoFiltro];

  const escopoMetricas = useMemo(
    () => midias.filter((m) => tipoEfetivo === "todos" || m.tipo === tipoEfetivo),
    [midias, tipoEfetivo]
  );

  const contagemPorStatus = useMemo(() => {
    const map = Object.fromEntries(Object.keys(STATUS_LABEL).map((s) => [s, 0]));
    for (const m of escopoMetricas) {
      if (map[m.status] !== undefined) map[m.status] += 1;
    }
    return map;
  }, [escopoMetricas]);

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

  const toggleSelecionado = (idItem, e) => {
    e.stopPropagation();
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(idItem)) novo.delete(idItem);
      else novo.add(idItem);
      return novo;
    });
  };

  const todosSelecionados = filtradas.length > 0 && filtradas.every((m) => selecionados.has(m.id));

  const toggleTodos = () => {
    setSelecionados(todosSelecionados ? new Set() : new Set(filtradas.map((m) => m.id)));
  };

  const handleAplicarStatusEmMassa = async () => {
    if (!statusEmMassa || selecionados.size === 0) return;
    setAplicandoEmMassa(true);
    try {
      for (const idItem of selecionados) {
        const item = midiaPorId[idItem];
        if (!item) continue;
        await createOrUpdateMidia({
          id: item.id,
          titulo: item.titulo,
          tipo: item.tipo,
          status: statusEmMassa,
          episodio_atual: item.episodio_atual ?? "",
          ano: item.ano ?? "",
          genero: item.genero || "",
          observacoes: item.observacoes || "",
          franquia_id: item.franquia_id || "",
          midia_pai_id: item.midia_pai_id || "",
        });
      }
    } finally {
      setAplicandoEmMassa(false);
      setSelecionados(new Set());
      setStatusEmMassa("");
    }
  };

  return (
    <div>
      <PageHeader
        title={titulo}
        subtitle="Animes, séries e filmes que você está acompanhando"
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        {Object.entries(STATUS_LABEL).map(([status, label]) => {
          const Icone = STATUS_ICON[status];
          const ativo = statusFiltro === status;
          const estilo = STATUS_CARD_STYLE[status];
          return (
            <button
              key={status}
              onClick={() => setStatusFiltro((s) => (s === status ? "todos" : status))}
              className={`text-left rounded-2xl border bg-white px-4 py-3 transition-colors ${estilo.ring} ${ativo ? "border-ink-900 ring-1 ring-ink-900" : "border-ink-200"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{label}</span>
                <Icone className={`h-4 w-4 ${estilo.icon}`} />
              </div>
              <p className="font-display text-2xl font-medium tracking-tight text-ink-900 mt-1.5 tabular-nums">
                {contagemPorStatus[status]}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por título..."
            className="pl-8"
          />
        </div>
        <div className="hidden sm:block sm:flex-1" />
        {tipoFiltro === "todos" && (
          <Select value={tipoFiltroLocal} onValueChange={setTipoFiltroLocal}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[180px]">
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
          <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={statusFiltro === "concluido" ? "default" : "outline"}
          onClick={() => setStatusFiltro((s) => (s === "concluido" ? "todos" : "concluido"))}
          className={statusFiltro === "concluido" ? "" : "text-emerald-700 border-emerald-200"}
        >
          <Check className="h-4 w-4 mr-1.5" /> Assistidos
        </Button>
        {temNovidade.size > 0 && (
          <Button
            variant={somenteNovidades ? "default" : "outline"}
            onClick={() => setSomenteNovidades((v) => !v)}
            className={somenteNovidades ? "" : "text-sky-700 border-sky-200"}
          >
            <Sparkles className="h-4 w-4 mr-1.5" /> Novidades ({temNovidade.size})
          </Button>
        )}
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4 mr-1.5" /> Importar
        </Button>
        <Button onClick={abrirNovo}>
          <Plus className="h-4 w-4 mr-1.5" /> Novo
        </Button>
      </div>

      {selecionados.size > 0 && (
        <div className="flex items-center gap-2 mb-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
          <span className="text-sm text-sky-800 font-medium">
            {selecionados.size} {selecionados.size === 1 ? "selecionado" : "selecionados"}
          </span>
          <div className="flex-1" />
          <Select value={statusEmMassa} onValueChange={setStatusEmMassa}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Mudar status para..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleAplicarStatusEmMassa}
            disabled={!statusEmMassa || aplicandoEmMassa}
          >
            {aplicandoEmMassa ? "Aplicando..." : "Aplicar"}
          </Button>
          <button
            onClick={() => setSelecionados(new Set())}
            className="p-1.5 text-sky-700 hover:text-sky-900"
            title="Limpar seleção"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <Clapperboard className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nada por aqui ainda.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <div className="overflow-x-auto scroll-fino">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                  <th className="w-10 px-4 py-2.5">
                    <Checkbox checked={todosSelecionados} onCheckedChange={toggleTodos} />
                  </th>
                  <th className="text-left px-4 py-2.5">Nome</th>
                  <th className="text-left px-4 py-2.5">Tipo</th>
                  <th className="text-left px-4 py-2.5">Episódio</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                  {outrosUsuarios.length > 0 && <th className="text-left px-4 py-2.5">Outros</th>}
                  {isAdmin && <th className="w-10 px-4 py-2.5" title="Visível apenas para admin" />}
                </tr>
              </thead>
              <tbody>
                {paginadas.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => irPara(m)}
                    className={`border-b border-ink-50 last:border-b-0 hover:bg-ink-50 cursor-pointer transition-colors ${selecionados.has(m.id) ? "bg-sky-50" : ""}`}
                  >
                    <td className="px-4 py-2.5" onClick={(e) => toggleSelecionado(m.id, e)}>
                      <Checkbox checked={selecionados.has(m.id)} onCheckedChange={() => {}} />
                    </td>
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
                    {outrosUsuarios.length > 0 && (
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap items-center gap-1">
                          {outrosUsuarios.map((u) => {
                            const st = m.statusPorUsuario?.[u.id]?.status || "pendente";
                            return (
                              <span
                                key={u.id}
                                title={`${u.nome}: ${STATUS_LABEL[st]}`}
                                className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold uppercase ${STATUS_STYLE[st]}`}
                              >
                                {u.nome.trim().charAt(0)}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleVisivelApenasAdmin({ id: m.id, visivel_apenas_admin: !m.visivel_apenas_admin })}
                          title={m.visivel_apenas_admin ? "Visível só para admin — clique para tornar público" : "Marcar como visível só para admin"}
                          className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                            m.visivel_apenas_admin
                              ? "bg-ink-900 border-ink-900 text-white"
                              : "border-ink-200 text-transparent hover:border-ink-300"
                          }`}
                        >
                          <Lock className="h-3 w-3" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && filtradas.length > 0 && totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-3 text-sm text-ink-500">
          <span>
            Página {paginaAtual} de {totalPaginas} · {filtradas.length} itens
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              className="p-1.5 rounded-lg border border-ink-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
              className="p-1.5 rounded-lg border border-ink-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
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
