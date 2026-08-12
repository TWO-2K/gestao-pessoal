import React, { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import MetaForm from "@/components/MetaForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Plus, Pencil, Trash2, Target, Check } from "lucide-react";
import { formatDate } from "@/lib/format";
import { useMetasAcademia } from "@/hooks/useMetasAcademia";
import { useExerciciosAcademia } from "@/hooks/useExerciciosAcademia";
import { cn } from "@/lib/utils";

export default function MetasAcademia() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { metas, isLoading, deleteMeta, saveMeta, toggleMetaConcluida } = useMetasAcademia();
  const { exercicios } = useExerciciosAcademia();

  const exercicioMap = useMemo(() => Object.fromEntries(exercicios.map((e) => [e.id, e])), [exercicios]);

  const handleSaved = async (form) => {
    await saveMeta(form);
    setOpen(false);
    setEditing(null);
  };

  const tituloMeta = (meta) =>
    meta.tipo === "peso_corporal" ? "Peso corporal" : exercicioMap[meta.exercicio_id]?.nome || "Carga em exercício";

  const unidade = "kg";

  return (
    <div>
      <PageHeader
        title="Metas"
        subtitle="Seus objetivos na academia"
        action={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Nova meta
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : metas.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <Target className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhuma meta cadastrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {metas.map((meta) => {
            const progresso = meta.valorAtual != null ? Math.min(100, Math.round((meta.valorAtual / meta.valor_alvo) * 100)) : 0;
            return (
              <div key={meta.id} className={cn("group rounded-2xl border border-ink-200 bg-white px-4 py-3.5", meta.concluida && "opacity-60")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{tituloMeta(meta)}</p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      {meta.valorAtual != null ? `${meta.valorAtual}${unidade}` : "—"} / {meta.valor_alvo}{unidade}
                      {meta.prazo && ` · até ${formatDate(meta.prazo)}`}
                    </p>
                  </div>
                  <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => toggleMetaConcluida({ id: meta.id, concluida: !meta.concluida })}
                      className={cn("p-2", meta.concluida ? "text-emerald-600" : "text-ink-400 hover:text-emerald-600")}
                      title={meta.concluida ? "Marcar como não concluída" : "Marcar como concluída"}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setEditing(meta); setOpen(true); }} className="p-2 text-ink-400 hover:text-ink-900">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteMeta(meta.id)} className="p-2 text-ink-400 hover:text-rust-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <Progress value={progresso} className="mt-2.5 h-1.5" />
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar meta" : "Nova meta"}</DialogTitle></DialogHeader>
          <MetaForm meta={editing} exerciciosCatalogo={exercicios} onSaved={handleSaved} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
