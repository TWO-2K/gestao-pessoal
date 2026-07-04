import React, { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import PlannerTarefaForm from "@/components/PlannerTarefaForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import WeekStrip from "@/components/WeekStrip";
import { usePlannerTarefas } from "@/hooks/usePlannerTarefas";
import { usePlannerQuadros } from "@/hooks/usePlannerQuadros";
import { useToast } from "@/components/ui/use-toast";

const PRIORIDADE_COR = {
  alta: "bg-rust-500",
  media: "bg-gold-500",
  baixa: "bg-ink-300",
};

const COLUNAS = [
  { status: "a_fazer", label: "A fazer", dot: "bg-gold-400" },
  { status: "em_andamento", label: "Em andamento", dot: "bg-sky-400" },
  { status: "concluido", label: "Concluído", dot: "bg-emerald-500" },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function Planner() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [collapsed, setCollapsed] = useState({});
  const [addingTo, setAddingTo] = useState(null);
  const [novoTitulo, setNovoTitulo] = useState("");

  const [deleting, setDeleting] = useState(null);
  const [selectedQuadro, setSelectedQuadro] = useState(null);
  const [quadroDialogOpen, setQuadroDialogOpen] = useState(false);
  const [novoQuadroNome, setNovoQuadroNome] = useState("");
  const [deletingQuadro, setDeletingQuadro] = useState(null);
  const { toast } = useToast();

  const { tarefas, isLoading, deleteTarefaAsync, deleteFuturas, createOrUpdateTarefa, createManyTarefas, updateStatus } = usePlannerTarefas();
  const { quadros, createQuadro, deleteQuadro } = usePlannerQuadros();

  const handleCreateQuadro = async () => {
    if (!novoQuadroNome.trim()) return;
    try {
      const created = await createQuadro(novoQuadroNome.trim());
      setSelectedQuadro(created.id);
      setNovoQuadroNome("");
      setQuadroDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao criar quadro", description: error.message });
    }
  };

  const handleDeleteQuadro = async () => {
    try {
      await deleteQuadro(deletingQuadro.id);
      if (selectedQuadro === deletingQuadro.id) setSelectedQuadro(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir quadro", description: error.message });
    } finally {
      setDeletingQuadro(null);
    }
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

  const handleSaved = async (payload) => {
    if (Array.isArray(payload)) {
      const rows = payload.map((row) => ({ ...row, quadro_id: selectedQuadro }));
      if (rows.length === 1) await createOrUpdateTarefa(rows[0]);
      else await createManyTarefas(rows);
    } else {
      await createOrUpdateTarefa(payload);
    }
    setOpen(false);
    setEditing(null);
  };

  const doDia = useMemo(
    () => tarefas.filter((t) => t.data === selectedDate && (t.quadro_id || null) === selectedQuadro),
    [tarefas, selectedDate, selectedQuadro]
  );

  const porStatus = useMemo(() => {
    const map = { a_fazer: [], em_andamento: [], concluido: [] };
    doDia.forEach((t) => { (map[t.status] || map.a_fazer).push(t); });
    return map;
  }, [doDia]);

  const moveStatus = (tarefa, delta) => {
    const idx = COLUNAS.findIndex((c) => c.status === tarefa.status);
    const next = COLUNAS[idx + delta];
    if (!next) return;
    updateStatus({ id: tarefa.id, status: next.status });
  };

  const handleQuickAdd = async (status) => {
    if (!novoTitulo.trim()) { setAddingTo(null); return; }
    await createOrUpdateTarefa({
      titulo: novoTitulo.trim(),
      descricao: "",
      data: selectedDate,
      prioridade: "media",
      status,
      quadro_id: selectedQuadro,
    });
    setNovoTitulo("");
    setAddingTo(null);
  };

  return (
    <div>
      <PageHeader
        title="Planner"
        subtitle="Suas tarefas e compromissos"
        action={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Nova tarefa
          </Button>
        }
      />

      <WeekStrip value={selectedDate} onChange={setSelectedDate} />

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedQuadro(null)}
          className={cn(
            "flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            selectedQuadro === null ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-500 hover:bg-ink-200"
          )}
        >
          Geral
        </button>
        {quadros.map((q) => (
          <div key={q.id} className="group relative flex-shrink-0">
            <button
              onClick={() => setSelectedQuadro(q.id)}
              className={cn(
                "rounded-full px-3 py-1.5 pr-6 text-xs font-semibold transition-colors",
                selectedQuadro === q.id ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-500 hover:bg-ink-200"
              )}
            >
              {q.nome}
            </button>
            <button
              onClick={() => setDeletingQuadro(q)}
              className={cn(
                "absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity",
                selectedQuadro === q.id ? "text-white/70 hover:text-white" : "text-ink-400 hover:text-rust-600"
              )}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          onClick={() => setQuadroDialogOpen(true)}
          className="flex-shrink-0 flex items-center gap-1 rounded-full border border-dashed border-ink-300 px-3 py-1.5 text-xs font-semibold text-ink-400 hover:text-ink-900 hover:border-ink-400"
        >
          <Plus className="h-3 w-3" /> Novo quadro
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {COLUNAS.map((col) => (
          <div key={col.status} className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-center">
            <p className="text-2xl font-display text-ink-900">{porStatus[col.status].length}</p>
            <p className="text-[11px] uppercase tracking-wide text-ink-400">{col.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUNAS.map((col) => {
            const isCollapsed = collapsed[col.status];
            const itens = porStatus[col.status];
            return (
              <div key={col.status} className="rounded-2xl border border-ink-200 bg-ink-50/50 p-3">
                <button
                  onClick={() => setCollapsed((c) => ({ ...c, [col.status]: !c[col.status] }))}
                  className="w-full flex items-center justify-between mb-2 px-1"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                    <span className={cn("h-2.5 w-2.5 rounded-full", col.dot)} />
                    {col.label}
                    <span className="text-ink-400 font-normal">{itens.length}</span>
                  </span>
                  {isCollapsed ? <ChevronDown className="h-4 w-4 text-ink-400" /> : <ChevronUp className="h-4 w-4 text-ink-400" />}
                </button>

                {!isCollapsed && (
                  <>
                    <div className="space-y-2 mb-2">
                      {itens.length === 0 && addingTo !== col.status && (
                        <p className="text-xs text-ink-400 italic text-center py-4">Nenhuma tarefa aqui</p>
                      )}
                      {itens.map((tarefa) => {
                        const idx = COLUNAS.findIndex((c) => c.status === tarefa.status);
                        return (
                          <div key={tarefa.id} className="group rounded-xl border border-ink-200 bg-white px-3 py-2.5">
                            <div className="flex items-start gap-2">
                              <span className={cn("mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0", PRIORIDADE_COR[tarefa.prioridade])} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-ink-900 truncate">{tarefa.titulo}</p>
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
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex gap-0.5">
                                <button
                                  onClick={() => moveStatus(tarefa, -1)}
                                  disabled={idx === 0}
                                  className="p-1 text-ink-300 hover:text-ink-900 disabled:opacity-0 disabled:pointer-events-none"
                                >
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => moveStatus(tarefa, 1)}
                                  disabled={idx === COLUNAS.length - 1}
                                  className="p-1 text-ink-300 hover:text-ink-900 disabled:opacity-0 disabled:pointer-events-none"
                                >
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditing(tarefa); setOpen(true); }} className="p-1 text-ink-400 hover:text-ink-900">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => handleDeleteClick(tarefa)} className="p-1 text-ink-400 hover:text-rust-600">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {addingTo === col.status ? (
                      <div className="flex items-center gap-1">
                        <Input
                          autoFocus
                          value={novoTitulo}
                          onChange={(e) => setNovoTitulo(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleQuickAdd(col.status); if (e.key === "Escape") { setAddingTo(null); setNovoTitulo(""); } }}
                          placeholder="Título da tarefa"
                          className="h-8 text-sm"
                        />
                        <button onClick={() => handleQuickAdd(col.status)} className="p-1.5 text-ink-500 hover:text-ink-900">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setAddingTo(null); setNovoTitulo(""); }} className="p-1.5 text-ink-400 hover:text-rust-600">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingTo(col.status); setNovoTitulo(""); }}
                        className="w-full text-left text-xs text-ink-400 hover:text-ink-900 px-2 py-1.5"
                      >
                        + Adicionar um cartão
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar tarefa" : "Nova tarefa"}</DialogTitle></DialogHeader>
          <PlannerTarefaForm tarefa={editing} onSaved={handleSaved} onCancel={() => setOpen(false)} />
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

      <Dialog open={quadroDialogOpen} onOpenChange={setQuadroDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo quadro</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input
              autoFocus
              value={novoQuadroNome}
              onChange={(e) => setNovoQuadroNome(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateQuadro(); }}
              placeholder="Nome do quadro"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setQuadroDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateQuadro}>Criar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingQuadro} onOpenChange={(v) => !v && setDeletingQuadro(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir quadro</DialogTitle></DialogHeader>
          <p className="text-sm text-ink-500">
            As tarefas de "{deletingQuadro?.nome}" serão movidas para o quadro Geral.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDeletingQuadro(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteQuadro}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
