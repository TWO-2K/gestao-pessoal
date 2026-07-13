import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import MidiaForm from "@/components/MidiaForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Clapperboard, Star, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMidias } from "@/hooks/useMidias";
import { useFranquias } from "@/hooks/useFranquias";

const TIPO_LABEL = { anime: "Anime", ova: "OVA", ona: "ONA", filme: "Filme", especial: "Especial", serie: "Série" };

const TIPO_SLUGS = { animes: "anime", ovas: "ova", onas: "ona", filmes: "filme", especiais: "especial", series: "serie" };

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
  const { tipoSlug } = useParams();
  const tipoFiltro = tipoSlug ? TIPO_SLUGS[tipoSlug] : "todos";

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [novoDefaults, setNovoDefaults] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

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
    () => (tipoFiltro === "todos" ? midias : midias.filter((m) => m.tipo === tipoFiltro)),
    [midias, tipoFiltro]
  );

  const titulo = tipoFiltro === "todos" ? "Minha Lista" : TIPO_PLURAL[tipoFiltro];

  // Ao trocar de tela/tipo, seleciona o primeiro item da lista (padrão AppSheet).
  useEffect(() => {
    if (filtradas.length === 0) {
      setSelectedId(null);
    } else if (!filtradas.some((m) => m.id === selectedId)) {
      setSelectedId(filtradas[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoFiltro, filtradas.length]);

  const selecionada = selectedId ? midiaPorId[selectedId] : null;
  const relacionados = selecionada ? filhosPorPaiId[selecionada.id] || [] : [];
  const paiDaSelecionada = selecionada?.midia_pai_id ? midiaPorId[selecionada.midia_pai_id] : null;

  const abrirNovo = () => {
    setEditing(null);
    setNovoDefaults(tipoFiltro !== "todos" ? { tipo: tipoFiltro } : null);
    setOpen(true);
  };

  const abrirNovoExtra = () => {
    setEditing(null);
    setNovoDefaults({ tipo: "ova", midia_pai_id: selecionada.id, franquia_id: selecionada.franquia_id || "" });
    setOpen(true);
  };

  const abrirEditar = (m) => {
    setEditing(m);
    setNovoDefaults(null);
    setOpen(true);
  };

  const handleSaved = async (formData) => {
    const salvo = await createOrUpdateMidia(formData);
    setOpen(false);
    setEditing(null);
    if (salvo?.id) setSelectedId(salvo.id);
  };

  const handleDelete = () => {
    deleteMidia(deleting.id);
    if (selectedId === deleting.id) setSelectedId(null);
    setDeleting(null);
  };

  return (
    <div>
      <PageHeader
        title={titulo}
        subtitle="Animes, séries e filmes que você está acompanhando"
        action={
          <Button onClick={abrirNovo}>
            <Plus className="h-4 w-4 mr-1.5" /> Novo
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <Clapperboard className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nada por aqui ainda.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-[minmax(0,320px)_1fr] gap-4 items-start">
          {/* Lista */}
          <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2 border-b border-ink-100 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              <span>Nome</span>
              <span>Ep.</span>
              <span>Status</span>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {filtradas.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={cn(
                    "w-full grid grid-cols-[1fr_auto_auto] gap-2 items-center px-4 py-2.5 text-left border-b border-ink-50 last:border-b-0 transition-colors",
                    selectedId === m.id ? "bg-gold-50" : "hover:bg-ink-50"
                  )}
                >
                  <span className="truncate text-sm text-ink-900">{m.titulo}</span>
                  <span className="text-xs text-ink-400 tabular-nums">{m.episodio_atual ?? "-"}</span>
                  <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${STATUS_STYLE[m.status]}`}>
                    {STATUS_LABEL[m.status]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Detalhe */}
          {selecionada ? (
            <div className="rounded-2xl border border-ink-200 bg-white">
              <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-ink-100">
                <div className="min-w-0">
                  <p className="font-display text-lg text-ink-900 truncate">{selecionada.titulo}</p>
                  <p className="text-xs text-ink-400 mt-0.5">
                    {TIPO_LABEL[selecionada.tipo]}{selecionada.ano ? ` · ${selecionada.ano}` : ""}{selecionada.genero ? ` · ${selecionada.genero}` : ""}
                  </p>
                  {(selecionada.franquia_id || paiDaSelecionada) && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-ink-400">
                      <Library className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {selecionada.franquia_id && franquiaPorId[selecionada.franquia_id]}
                        {selecionada.franquia_id && paiDaSelecionada && " · "}
                        {paiDaSelecionada && (
                          <button className="underline hover:text-ink-700" onClick={() => setSelectedId(paiDaSelecionada.id)}>
                            parte de {paiDaSelecionada.titulo}
                          </button>
                        )}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setDeleting(selecionada)} className="p-1.5 text-ink-400 hover:text-rust-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <Button size="sm" variant="outline" onClick={() => abrirEditar(selecionada)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 px-5 py-4 border-b border-ink-100">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-1">Status</p>
                  <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${STATUS_STYLE[selecionada.status]}`}>
                    {STATUS_LABEL[selecionada.status]}
                  </span>
                </div>
                {!["filme", "especial"].includes(selecionada.tipo) && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-1">Temporada / Ep.</p>
                    <p className="text-sm text-ink-900">T{selecionada.temporada_atual ?? "-"} · Ep {selecionada.episodio_atual ?? "-"}</p>
                  </div>
                )}
                {selecionada.nota != null && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-1">Nota</p>
                    <span className="flex items-center gap-1 text-sm text-ink-900">
                      <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" /> {selecionada.nota}
                    </span>
                  </div>
                )}
              </div>

              {selecionada.observacoes && (
                <p className="text-sm text-ink-500 px-5 py-3 border-b border-ink-100">{selecionada.observacoes}</p>
              )}

              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-ink-900 flex items-center gap-2">
                    Relacionados
                    <span className="text-[11px] font-medium rounded-full bg-ink-100 text-ink-500 px-1.5 py-0.5">
                      {relacionados.length}
                    </span>
                  </p>
                  <Button size="sm" variant="ghost" onClick={abrirNovoExtra}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                  </Button>
                </div>

                {relacionados.length === 0 ? (
                  <p className="text-xs text-ink-400 py-3">Nenhum OVA, filme ou especial vinculado a este item ainda.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-ink-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-ink-100 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                          <th className="text-left px-3 py-2">Nome</th>
                          <th className="text-left px-3 py-2">Tipo</th>
                          <th className="text-left px-3 py-2">Ep.</th>
                          <th className="text-left px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relacionados.map((filho) => (
                          <tr
                            key={filho.id}
                            onClick={() => setSelectedId(filho.id)}
                            className="border-b border-ink-50 last:border-b-0 hover:bg-ink-50 cursor-pointer"
                          >
                            <td className="px-3 py-2 text-ink-900 truncate max-w-[220px]">{filho.titulo}</td>
                            <td className="px-3 py-2 text-ink-500">{TIPO_LABEL[filho.tipo]}</td>
                            <td className="px-3 py-2 text-ink-500 tabular-nums">{filho.episodio_atual ?? "-"}</td>
                            <td className="px-3 py-2">
                              <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${STATUS_STYLE[filho.status]}`}>
                                {STATUS_LABEL[filho.status]}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-ink-200 bg-white flex items-center justify-center py-20 text-ink-400 text-sm">
              Selecione um item na lista
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar item" : "Novo item"}</DialogTitle></DialogHeader>
          <MidiaForm
            midia={editing}
            midias={midias}
            franquias={franquias}
            defaults={novoDefaults}
            onCreateFranquia={createFranquia}
            onSaved={handleSaved}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

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
