import React, { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import PlanoForm from "@/components/PlanoForm";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ClipboardList, Dumbbell } from "lucide-react";
import { diasSemanaLabel } from "@/lib/diasSemana";
import { grupoMuscularLabel } from "@/lib/gruposMusculares";
import { usePlanosAcademia } from "@/hooks/usePlanosAcademia";
import { useExerciciosAcademia } from "@/hooks/useExerciciosAcademia";

export default function PlanosAcademia() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { planos, isLoading, deletePlano, savePlano } = usePlanosAcademia();
  const { exercicios } = useExerciciosAcademia();

  const exercicioMap = useMemo(() => Object.fromEntries(exercicios.map((e) => [e.id, e])), [exercicios]);

  const handleSaved = async (form) => {
    await savePlano(form);
    setOpen(false);
    setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title="Planos de treino"
        subtitle="Rotinas fixas para pré-preencher seus treinos"
        action={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Novo plano
          </Button>
        }
      />

      <div className="mb-5">
        <PushNotificationToggle
          title="Lembrete de dia de treino"
          description="Notificação no celular nos dias da semana planejados em cada plano."
        />
      </div>

      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : planos.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum plano cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {planos.map((plano) => (
            <div key={plano.id} className="group rounded-2xl border border-ink-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{plano.nome}</p>
                  <p className="text-xs text-ink-400 mt-0.5">{diasSemanaLabel(plano.dias_semana)}</p>
                </div>
                <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => { setEditing(plano); setOpen(true); }} className="p-2 text-ink-400 hover:text-ink-900">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => deletePlano(plano.id)} className="p-2 text-ink-400 hover:text-rust-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <ul className="mt-3 space-y-1.5 border-t border-ink-100 pt-3">
                {plano.exercicios.map((pe, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <div className="h-7 w-7 flex-shrink-0 rounded-md border border-ink-200 bg-ink-50 overflow-hidden flex items-center justify-center">
                      {exercicioMap[pe.exercicio_id]?.foto_url ? (
                        <img src={exercicioMap[pe.exercicio_id].foto_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Dumbbell className="h-3 w-3 text-ink-300" />
                      )}
                    </div>
                    <span className="min-w-0 truncate flex-1">
                      <span className="text-ink-700">{exercicioMap[pe.exercicio_id]?.nome || "Exercício"}</span>
                      <span className="text-[10px] uppercase tracking-wide text-ink-300 ml-1.5">{grupoMuscularLabel(exercicioMap[pe.exercicio_id]?.grupo_muscular)}</span>
                    </span>
                    <span className="text-xs text-ink-400 flex-shrink-0 tabular-nums">{pe.series_alvo}x{pe.reps_alvo}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar plano" : "Novo plano"}</DialogTitle></DialogHeader>
          <PlanoForm
            plano={editing}
            exerciciosCatalogo={exercicios}
            onSaved={handleSaved}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
