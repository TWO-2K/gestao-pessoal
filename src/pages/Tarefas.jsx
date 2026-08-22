import React, { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import PlannerTarefaForm from "@/components/PlannerTarefaForm";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, ChevronLeft, ChevronRight, Calendar, CalendarDays, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { dataLocalHoje } from "@/lib/format";
import { usePlannerTarefas } from "@/hooks/usePlannerTarefas";
import { useToast } from "@/components/ui/use-toast";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const PRIORIDADE_COR = {
  alta: "bg-rust-500",
  media: "bg-gold-500",
  baixa: "bg-ink-300",
};

const VISOES = [
  { value: "mes", label: "Mensal", icon: Calendar },
  { value: "semana", label: "Semanal", icon: CalendarDays },
  { value: "dia", label: "Diário", icon: Clock },
];

function parseDateLocal(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(dateStr, delta) {
  const d = parseDateLocal(dateStr);
  d.setDate(d.getDate() + delta);
  return toDateStr(d);
}

function formatDiaCompleto(dateStr) {
  return parseDateLocal(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

function formatDiaCurto(dateStr) {
  return parseDateLocal(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function TarefaItem({ tarefa, onToggle, onEdit }) {
  const concluida = tarefa.status === "concluido";
  return (
    <div className="group flex items-start gap-2.5 rounded-xl border border-ink-200 px-3 py-2.5 hover:bg-ink-50">
      <Checkbox
        checked={concluida}
        onCheckedChange={() => onToggle(tarefa)}
        onClick={(e) => e.stopPropagation()}
        className="mt-0.5 flex-shrink-0"
      />
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(tarefa)}>
        <p className={cn("text-sm font-medium text-ink-900 truncate", concluida && "line-through text-ink-400")}>
          {tarefa.titulo}
        </p>
        {tarefa.descricao && (
          <p className="text-xs text-ink-400 truncate mt-0.5">{tarefa.descricao}</p>
        )}
        {(tarefa.tag || tarefa.horario) && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {tarefa.horario && (
              <span className="text-[10px] text-ink-400">{tarefa.horario.slice(0, 5)}</span>
            )}
            {tarefa.tag && (
              <span className="text-[10px] rounded-full bg-ink-100 text-ink-500 px-2 py-0.5 truncate max-w-[8rem]">
                {tarefa.tag}
              </span>
            )}
          </div>
        )}
      </div>
      <button
        onClick={() => onEdit(tarefa)}
        className="p-0.5 text-ink-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5 hover:text-ink-900"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function Tarefas() {
  const [visao, setVisao] = useState("mes");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelectedRaw] = useState(dataLocalHoje());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { toast } = useToast();

  const { tarefas, isLoading, deleteTarefaAsync, deleteFuturas, createOrUpdateTarefa, createManyTarefas, updateStatus } = usePlannerTarefas();

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const setSelected = (dateStr) => {
    setSelectedRaw(dateStr);
    const d = parseDateLocal(dateStr);
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const tarefasPorDia = useMemo(() => {
    const map = {};
    tarefas.forEach((t) => {
      if (!t.data) return;
      if (!map[t.data]) map[t.data] = [];
      map[t.data].push(t);
    });
    return map;
  }, [tarefas]);

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, dateStr });
    }
    return cells;
  }, [year, month]);

  const semanaDias = useMemo(() => {
    const d = parseDateLocal(selected);
    const dow = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - dow);
    return Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(start);
      dt.setDate(start.getDate() + i);
      return toDateStr(dt);
    });
  }, [selected]);

  const todayStr = dataLocalHoje();
  const tarefasDoDiaSel = (tarefasPorDia[selected] || []).slice().sort((a, b) => (a.horario || "").localeCompare(b.horario || ""));

  const moveMes = (delta) => setCursor(new Date(year, month + delta, 1));
  const moveSemana = (delta) => setSelected(addDays(selected, delta * 7));
  const moveDia = (delta) => setSelected(addDays(selected, delta));

  const toggleConcluida = (tarefa) => {
    updateStatus({ id: tarefa.id, status: tarefa.status === "concluido" ? "a_fazer" : "concluido" });
  };

  const handleSaved = async (payload) => {
    if (Array.isArray(payload)) {
      if (payload.length === 1) await createOrUpdateTarefa(payload[0]);
      else await createManyTarefas(payload);
    } else {
      await createOrUpdateTarefa(payload);
    }
    setOpen(false);
    setEditing(null);
  };

  const handleDeleteClick = async (tarefa) => {
    if (tarefa.serie_id) {
      setDeleting(tarefa);
      return;
    }
    try {
      await deleteTarefaAsync(tarefa.id);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
    }
  };

  const handleDeleteFromForm = async (tarefa) => {
    setOpen(false);
    setEditing(null);
    await handleDeleteClick(tarefa);
  };

  const handleDeleteOnly = async () => {
    try {
      await deleteTarefaAsync(deleting.id);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteFuturas = async () => {
    try {
      await deleteFuturas({ serieId: deleting.serie_id, data: deleting.data });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
    } finally {
      setDeleting(null);
    }
  };

  const openNova = (dateStr) => {
    if (dateStr) setSelected(dateStr);
    setEditing(null);
    setOpen(true);
  };

  const openEdicao = (tarefa) => {
    setEditing(tarefa);
    setOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Calendário"
        subtitle="Sua agenda em formato de calendário"
        action={
          <Button onClick={() => openNova()}>
            <Plus className="h-4 w-4 mr-1.5" /> Nova tarefa
          </Button>
        }
      />

      <div className="flex items-center gap-1 mb-4 rounded-xl border border-ink-200 bg-ink-50/50 p-1 w-fit">
        {VISOES.map((v) => (
          <button
            key={v.value}
            onClick={() => setVisao(v.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              visao === v.value ? "bg-white shadow-sm text-ink-900" : "text-ink-400 hover:text-ink-900"
            )}
          >
            <v.icon className="h-4 w-4" /> {v.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : visao === "mes" ? (
        <div className="grid lg:grid-cols-[1fr_320px] gap-5">
          <div className="rounded-3xl border border-ink-200 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold tracking-tight">{MESES[month]} {year}</h3>
              <div className="flex gap-1">
                <button onClick={() => moveMes(-1)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => moveMes(1)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {DIAS.map((d) => (
                <div key={d} className="text-center text-[11px] font-medium text-ink-400 py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((cell, i) => {
                if (!cell) return <div key={`e${i}`} />;
                const itens = tarefasPorDia[cell.dateStr] || [];
                const isToday = cell.dateStr === todayStr;
                const isSelected = cell.dateStr === selected;
                return (
                  <button
                    key={cell.dateStr}
                    onClick={() => setSelected(cell.dateStr)}
                    className={cn(
                      "aspect-square sm:aspect-[4/3] rounded-lg flex flex-col items-center justify-start gap-0.5 p-1 text-xs transition-colors relative",
                      isSelected ? "bg-ink-900 text-white" : isToday ? "bg-ink-100 text-ink-900" : "hover:bg-ink-50 text-ink-600"
                    )}
                  >
                    <span className={cn("font-medium", isToday && !isSelected && "text-ink-900")}>{cell.day}</span>
                    {itens.length > 0 && (
                      <div className="flex items-center gap-0.5 absolute bottom-1.5">
                        {itens.slice(0, 3).map((t) => (
                          <span
                            key={t.id}
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              isSelected ? "bg-white/80" : PRIORIDADE_COR[t.prioridade]
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-ink-200 bg-white p-5">
            <p className="text-xs text-ink-400">Dia selecionado</p>
            <h3 className="font-semibold tracking-tight mb-4">{formatDiaCompleto(selected)}</h3>

            {tarefasDoDiaSel.length === 0 ? (
              <p className="text-sm text-ink-400">Nenhuma tarefa neste dia.</p>
            ) : (
              <div className="space-y-2">
                {tarefasDoDiaSel.map((tarefa) => (
                  <TarefaItem key={tarefa.id} tarefa={tarefa} onToggle={toggleConcluida} onEdit={openEdicao} />
                ))}
              </div>
            )}

            <Button variant="outline" className="w-full mt-4 rounded-xl" onClick={() => openNova()}>
              <Plus className="h-4 w-4 mr-1.5" /> Adicionar tarefa
            </Button>
          </div>
        </div>
      ) : visao === "semana" ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold tracking-tight">
              {formatDiaCurto(semanaDias[0])} – {formatDiaCurto(semanaDias[6])}
            </h3>
            <div className="flex gap-1">
              <button onClick={() => moveSemana(-1)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setSelected(todayStr)} className="px-3 rounded-lg hover:bg-ink-100 text-ink-500 text-xs font-medium">
                Hoje
              </button>
              <button onClick={() => moveSemana(1)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {semanaDias.map((dateStr, i) => {
              const itens = (tarefasPorDia[dateStr] || []).slice().sort((a, b) => (a.horario || "").localeCompare(b.horario || ""));
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selected;
              return (
                <div
                  key={dateStr}
                  className={cn(
                    "rounded-2xl border p-3 min-h-[9rem]",
                    isSelected ? "border-ink-900" : "border-ink-200",
                    isToday && !isSelected && "bg-ink-50/60"
                  )}
                >
                  <button
                    onClick={() => setSelected(dateStr)}
                    className="w-full flex items-center justify-between mb-2"
                  >
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-[11px] font-medium text-ink-400 uppercase">{DIAS[i]}</span>
                      <span className={cn("text-sm font-semibold", isToday ? "text-ink-900" : "text-ink-600")}>
                        {parseDateLocal(dateStr).getDate()}
                      </span>
                    </span>
                    <span
                      onClick={(e) => { e.stopPropagation(); openNova(dateStr); }}
                      className="p-1 rounded-md text-ink-300 hover:text-ink-900 hover:bg-ink-100"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </span>
                  </button>

                  <div className="space-y-1.5">
                    {itens.length === 0 ? (
                      <p className="text-[11px] text-ink-300 italic">Nada aqui</p>
                    ) : (
                      itens.map((tarefa) => {
                        const concluida = tarefa.status === "concluido";
                        return (
                          <div
                            key={tarefa.id}
                            onClick={() => openEdicao(tarefa)}
                            className="flex items-start gap-1.5 rounded-lg px-1.5 py-1 hover:bg-ink-50 cursor-pointer"
                          >
                            <span className={cn("mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0", PRIORIDADE_COR[tarefa.prioridade])} />
                            <span className={cn("text-xs text-ink-700 leading-snug truncate", concluida && "line-through text-ink-400")}>
                              {tarefa.horario && <span className="text-ink-400 mr-1">{tarefa.horario.slice(0, 5)}</span>}
                              {tarefa.titulo}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="max-w-xl mx-auto lg:mx-0">
          <div className="rounded-3xl border border-ink-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-ink-400">{DIAS[parseDateLocal(selected).getDay()]}</p>
                <h3 className="font-semibold tracking-tight">{formatDiaCompleto(selected)}</h3>
              </div>
              <div className="flex gap-1">
                <button onClick={() => moveDia(-1)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setSelected(todayStr)} className="px-3 rounded-lg hover:bg-ink-100 text-ink-500 text-xs font-medium">
                  Hoje
                </button>
                <button onClick={() => moveDia(1)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {tarefasDoDiaSel.length === 0 ? (
              <p className="text-sm text-ink-400">Nenhuma tarefa neste dia.</p>
            ) : (
              <div className="space-y-2">
                {tarefasDoDiaSel.map((tarefa) => (
                  <TarefaItem key={tarefa.id} tarefa={tarefa} onToggle={toggleConcluida} onEdit={openEdicao} />
                ))}
              </div>
            )}

            <Button variant="outline" className="w-full mt-4 rounded-xl" onClick={() => openNova()}>
              <Plus className="h-4 w-4 mr-1.5" /> Adicionar tarefa
            </Button>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar tarefa" : "Nova tarefa"}</DialogTitle></DialogHeader>
          <PlannerTarefaForm
            tarefa={editing}
            defaultData={selected}
            modo="dia"
            quadroId={null}
            onSaved={handleSaved}
            onCancel={() => setOpen(false)}
            onDelete={handleDeleteFromForm}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir tarefa recorrente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-ink-500">
            Esta tarefa faz parte de uma repetição. O que você quer excluir?
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button variant="outline" onClick={handleDeleteOnly}>Só esta tarefa</Button>
            <Button variant="outline" onClick={handleDeleteFuturas}>Esta e as próximas</Button>
            <Button variant="ghost" onClick={() => setDeleting(null)}>Cancelar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
