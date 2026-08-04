import React, { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MidiaForm from "@/components/MidiaForm";
import GeneroSelect from "@/components/GeneroSelect";
import { listaParaGenero } from "@/lib/generos";
import { Pencil, Trash2, Plus, Library, Clapperboard, PlayCircle, ChevronDown, Sparkles } from "lucide-react";

const TIPO_LABEL = { anime: "Anime", ova: "OVA", ona: "ONA", filme: "Filme", especial: "Especial", serie: "Série" };

const TIPO_BADGE = {
  anime: "bg-sky-100 text-sky-700",
  ova: "bg-violet-100 text-violet-700",
  ona: "bg-violet-100 text-violet-700",
  filme: "bg-gold-100 text-gold-700",
  especial: "bg-gold-100 text-gold-700",
  serie: "bg-rust-100 text-rust-700",
};

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

export default function MidiaDetailSheet({
  midia,
  midias,
  franquias,
  franquiaPorId,
  relacionados,
  pai,
  onOpenChange,
  onSave,
  onDelete,
  onCreateFranquia,
  onSelectMidia,
  onAddRelatedBatch,
}) {
  const [mode, setMode] = useState("view");
  const [addingRelated, setAddingRelated] = useState(false);
  const [novoTipo, setNovoTipo] = useState("ova");
  const [novoStatus, setNovoStatus] = useState("planejado");
  const [novoEpisodio, setNovoEpisodio] = useState("");
  const [novoGenero, setNovoGenero] = useState([]);
  const [novosTitulos, setNovosTitulos] = useState("");
  const [salvandoLote, setSalvandoLote] = useState(false);

  useEffect(() => {
    setMode("view");
    setAddingRelated(false);
    setNovosTitulos("");
    setNovoTipo("ova");
    setNovoStatus("planejado");
    setNovoEpisodio("");
    setNovoGenero([]);
  }, [midia?.id]);

  const relacionadosOrdenados = useMemo(
    () => [...relacionados].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [relacionados]
  );

  const relacionadosPorTipo = useMemo(() => {
    const grupos = {};
    for (const item of relacionadosOrdenados) {
      if (!grupos[item.tipo]) grupos[item.tipo] = [];
      grupos[item.tipo].push(item);
    }
    return Object.entries(grupos).sort(([a], [b]) => TIPO_LABEL[a].localeCompare(TIPO_LABEL[b], "pt-BR"));
  }, [relacionadosOrdenados]);

  if (!midia) return null;

  const temNovidade =
    midia.status === "concluido" &&
    relacionados.some((f) => f.status === "planejado" || f.status === "assistindo");

  const handleSaved = async (formData) => {
    await onSave(formData);
    setMode("view");
  };

  const handleSalvarLote = async () => {
    const titulos = novosTitulos
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
    if (titulos.length === 0) return;
    setSalvandoLote(true);
    try {
      await onAddRelatedBatch({
        tipo: novoTipo,
        status: novoStatus,
        episodio_atual: novoEpisodio === "" ? "" : Number(novoEpisodio),
        genero: listaParaGenero(novoGenero),
        titulos,
      });
      setAddingRelated(false);
      setNovosTitulos("");
    } finally {
      setSalvandoLote(false);
    }
  };

  return (
    <Sheet open={!!midia} onOpenChange={(v) => !v && onOpenChange(false)}>
      <SheetContent hideClose className="w-full sm:max-w-xl overflow-y-auto bg-ink-50 p-0">
        <SheetHeader className="px-6 py-5 bg-white border-b border-ink-200">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                <Clapperboard className="h-5 w-5 text-sky-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <SheetTitle className="truncate">{midia.titulo}</SheetTitle>
                  {temNovidade && (
                    <span
                      title="Tem temporada/relacionado novo desde que você concluiu"
                      className="flex-shrink-0 flex items-center gap-0.5 text-[10px] font-medium rounded-full bg-sky-100 text-sky-700 px-1.5 py-0.5"
                    >
                      <Sparkles className="h-2.5 w-2.5" /> Novo
                    </span>
                  )}
                </div>
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
                  <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${TIPO_BADGE[midia.tipo]}`}>
                    {TIPO_LABEL[midia.tipo]}
                  </span>
                  {midia.ano && <span className="text-xs text-ink-400">{midia.ano}</span>}
                  {midia.genero && <span className="text-xs text-ink-400">· {midia.genero}</span>}
                </div>
                {(midia.franquia_id || pai) && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-ink-400">
                    <Library className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      {midia.franquia_id && franquiaPorId[midia.franquia_id]}
                      {midia.franquia_id && pai && " · "}
                      {pai && (
                        <button className="underline hover:text-ink-700" onClick={() => onSelectMidia(pai.id)}>
                          parte de {pai.titulo}
                        </button>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {mode === "view" && (
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => relacionadosOrdenados.length === 0 && onDelete(midia)}
                  disabled={relacionadosOrdenados.length > 0}
                  title={relacionadosOrdenados.length > 0 ? "Remova os relacionados antes de excluir" : "Excluir"}
                  className="p-1.5 text-ink-400 hover:text-rust-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-ink-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <Button size="sm" variant="outline" onClick={() => setMode("edit")}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        {mode === "edit" ? (
          <div className="p-6">
            <MidiaForm
              midia={midia}
              midias={midias}
              franquias={franquias}
              onCreateFranquia={onCreateFranquia}
              onSaved={handleSaved}
              onCancel={() => setMode("view")}
            />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-ink-200 bg-white shadow-sm px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-1.5">Status</p>
                <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${STATUS_STYLE[midia.status]}`}>
                  {STATUS_LABEL[midia.status]}
                </span>
              </div>
              <div className="rounded-xl border border-ink-200 bg-white shadow-sm px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-1.5">Episódio</p>
                {["filme", "especial"].includes(midia.tipo) ? (
                  <p className="text-sm text-ink-400">—</p>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm text-ink-900 font-medium">
                    <PlayCircle className="h-3.5 w-3.5 text-ink-400" />
                    Ep {midia.episodio_atual ?? "-"}
                  </div>
                )}
              </div>
            </div>

            {midia.observacoes && (
              <div className="rounded-xl border border-ink-200 bg-white shadow-sm px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-1.5">Observações</p>
                <p className="text-sm text-ink-600 whitespace-pre-wrap">{midia.observacoes}</p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                  Relacionados
                  {relacionadosOrdenados.length > 0 && (
                    <span className="ml-1.5 text-[11px] font-medium rounded-full bg-ink-200 text-ink-600 px-1.5 py-0.5">
                      {relacionadosOrdenados.length}
                    </span>
                  )}
                </p>
                <Button size="sm" variant="outline" className="bg-white" onClick={() => setAddingRelated((v) => !v)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                </Button>
              </div>

              {addingRelated && (
                <div className="rounded-xl border border-ink-200 bg-white shadow-sm p-3 mb-3 space-y-2.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Títulos (um por linha)</Label>
                    <Textarea
                      value={novosTitulos}
                      onChange={(e) => setNovosTitulos(e.target.value)}
                      placeholder={"Bleach 2\nBleach 3\nBleach: Hueco Mundo"}
                      rows={4}
                      autoFocus
                    />
                  </div>

                  <p className="text-[11px] text-ink-400">Valores abaixo aplicados a todos os títulos acima:</p>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tipo</Label>
                      <Select value={novoTipo} onValueChange={setNovoTipo}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(TIPO_LABEL).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Status</Label>
                      <Select value={novoStatus} onValueChange={setNovoStatus}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABEL).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {!["filme", "especial"].includes(novoTipo) && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Episódio</Label>
                        <Input
                          type="number"
                          min="0"
                          value={novoEpisodio}
                          onChange={(e) => setNovoEpisodio(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Gênero</Label>
                    <GeneroSelect value={novoGenero} onChange={setNovoGenero} />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setAddingRelated(false)}>Cancelar</Button>
                    <Button size="sm" onClick={handleSalvarLote} disabled={salvandoLote || !novosTitulos.trim()}>
                      {salvandoLote ? "Adicionando..." : "Adicionar"}
                    </Button>
                  </div>
                </div>
              )}

              {relacionadosOrdenados.length === 0 ? (
                <p className="text-xs text-ink-400 py-3">Nenhum OVA, filme ou especial vinculado a este item ainda.</p>
              ) : (
                <div className="space-y-3">
                  {relacionadosPorTipo.map(([tipo, itens]) => (
                    <details key={tipo} className="group overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm">
                      <summary className="flex items-center gap-1.5 px-3 py-1.5 bg-ink-50 group-open:border-b border-ink-200 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                        <ChevronDown className="h-3.5 w-3.5 text-ink-400 transition-transform group-open:rotate-180" />
                        <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${TIPO_BADGE[tipo]}`}>
                          {TIPO_LABEL[tipo]}
                        </span>
                        <span className="text-[11px] text-ink-400">{itens.length}</span>
                      </summary>
                      <table className="w-full text-sm">
                        <tbody>
                          {itens.map((filho) => (
                            <tr
                              key={filho.id}
                              onClick={() => onSelectMidia(filho.id)}
                              className="border-b border-ink-50 last:border-b-0 hover:bg-ink-50 cursor-pointer"
                            >
                              <td className="px-3 py-2 text-ink-900 truncate max-w-[220px]">{filho.titulo}</td>
                              <td className="px-3 py-2 text-ink-500 tabular-nums w-16">
                                {["filme", "especial"].includes(filho.tipo) ? "-" : `Ep ${filho.episodio_atual ?? "-"}`}
                              </td>
                              <td className="px-3 py-2 w-28">
                                <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${STATUS_STYLE[filho.status]}`}>
                                  {STATUS_LABEL[filho.status]}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </details>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
