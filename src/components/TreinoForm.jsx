import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { GRUPOS_MUSCULARES } from "@/lib/gruposMusculares";
import RestTimer from "@/components/RestTimer";
import { Plus, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { novaSerie, novasSeries, agruparSeriesPorExercicio, diaSemanaDeData } from "@/lib/treinoUtils";
import { dataLocalHoje } from "@/lib/format";

export default function TreinoForm({ treino, exerciciosCatalogo = [], planos = [], ultimoTreino = null, onCreateExercicio, onSaved, onCancel }) {
  const [form, setForm] = useState({
    data: dataLocalHoje(),
    nome: "",
    observacao: "",
    plano_id: null,
    exercicios: [],
  });
  const [saving, setSaving] = useState(false);
  const [restSignals, setRestSignals] = useState({});
  const [addingExercicio, setAddingExercicio] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoGrupo, setNovoGrupo] = useState("");
  const [autoPreenchido, setAutoPreenchido] = useState(false);
  const [planosAmbiguosDoDia, setPlanosAmbiguosDoDia] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    if (treino) {
      setForm({
        data: treino.data,
        nome: treino.nome || "",
        observacao: treino.observacao || "",
        plano_id: treino.plano_id ?? null,
        exercicios: agruparSeriesPorExercicio(treino.series || []),
      });
    } else {
      setForm({ data: dataLocalHoje(), nome: "", observacao: "", plano_id: null, exercicios: [] });
    }
    setAutoPreenchido(false);
    setPlanosAmbiguosDoDia([]);
  }, [treino]);

  // Ao criar um treino novo, o plano cadastrado pro dia da semana da data escolhida
  // é aplicado automaticamente (ou pedido, se houver mais de um) — só enquanto o
  // usuário ainda não mexeu manualmente nos exercícios.
  useEffect(() => {
    if (treino) return;
    if (form.exercicios.length > 0 && !autoPreenchido) return;

    const diaSemana = diaSemanaDeData(form.data);
    const planosDoDia = planos.filter((p) => (p.dias_semana || []).includes(diaSemana));

    if (planosDoDia.length === 1) {
      const plano = planosDoDia[0];
      setForm((f) => ({
        ...f,
        nome: plano.nome,
        plano_id: plano.id,
        exercicios: plano.exercicios.map((pe) => ({
          exercicio_id: pe.exercicio_id,
          series: novasSeries(pe.series_alvo, pe.reps_alvo),
        })),
      }));
      setAutoPreenchido(true);
      setPlanosAmbiguosDoDia([]);
    } else if (planosDoDia.length > 1) {
      setPlanosAmbiguosDoDia(planosDoDia);
      if (autoPreenchido) {
        setForm((f) => ({ ...f, plano_id: null, exercicios: [] }));
        setAutoPreenchido(false);
      }
    } else {
      setPlanosAmbiguosDoDia([]);
      if (autoPreenchido) {
        setForm((f) => ({ ...f, plano_id: null, exercicios: [] }));
        setAutoPreenchido(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.data, planos, treino]);

  const exerciciosOrdenados = [...exerciciosCatalogo].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const aplicarPlano = (plano_id) => {
    const plano = planos.find((p) => p.id === plano_id);
    if (!plano) return;
    setForm((f) => ({
      ...f,
      nome: f.nome || plano.nome,
      plano_id: plano.id,
      exercicios: plano.exercicios.map((pe) => ({
        exercicio_id: pe.exercicio_id,
        series: novasSeries(pe.series_alvo, pe.reps_alvo),
      })),
    }));
    setAutoPreenchido(true);
    setPlanosAmbiguosDoDia([]);
  };

  const duplicarUltimoTreino = () => {
    if (!ultimoTreino) return;
    setForm((f) => ({
      ...f,
      exercicios: agruparSeriesPorExercicio(ultimoTreino.series || []),
    }));
    setAutoPreenchido(false);
  };

  const addExercicioLinha = (exercicio_id) => {
    setForm((f) => ({ ...f, exercicios: [...f.exercicios, { exercicio_id, series: novasSeries(3) }] }));
    setAutoPreenchido(false);
  };

  const removeExercicioLinha = (idx) => {
    setForm((f) => ({ ...f, exercicios: f.exercicios.filter((_, i) => i !== idx) }));
    setAutoPreenchido(false);
  };

  const setExercicioId = (idx, exercicio_id) => {
    setForm((f) => ({
      ...f,
      exercicios: f.exercicios.map((ex, i) => (i === idx ? { ...ex, exercicio_id } : ex)),
    }));
    setAutoPreenchido(false);
  };

  const addSerie = (idx) => {
    setForm((f) => ({
      ...f,
      exercicios: f.exercicios.map((ex, i) => (i === idx ? { ...ex, series: [...ex.series, novaSerie()] } : ex)),
    }));
  };

  const removeSerie = (idx, sidx) => {
    setForm((f) => ({
      ...f,
      exercicios: f.exercicios.map((ex, i) =>
        i === idx ? { ...ex, series: ex.series.filter((_, si) => si !== sidx) } : ex
      ),
    }));
  };

  const setSerieCampo = (idx, sidx, campo, valor) => {
    setForm((f) => ({
      ...f,
      exercicios: f.exercicios.map((ex, i) =>
        i === idx
          ? { ...ex, series: ex.series.map((s, si) => (si === sidx ? { ...s, [campo]: valor } : s)) }
          : ex
      ),
    }));
  };

  const toggleConcluida = (idx, sidx) => {
    const serieAtual = form.exercicios[idx]?.series[sidx];
    const novoValor = !serieAtual?.concluida;
    setSerieCampo(idx, sidx, "concluida", novoValor);
    if (novoValor) {
      setRestSignals((r) => ({ ...r, [idx]: (r[idx] || 0) + 1 }));
    }
  };

  const handleCriarExercicio = async () => {
    if (!novoNome.trim()) return;
    try {
      const criado = await onCreateExercicio({ nome: novoNome, grupo_muscular: novoGrupo });
      addExercicioLinha(criado.id);
      setAddingExercicio(false);
      setNovoNome("");
      setNovoGrupo("");
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao criar exercício", description: error.message });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.exercicios.length === 0 || form.exercicios.some((ex) => !ex.exercicio_id)) {
      toast({ variant: "destructive", title: "Adicione ao menos um exercício válido" });
      return;
    }
    setSaving(true);
    try {
      await onSaved({ id: treino?.id, ...form });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const nomeExercicio = (id) => exerciciosCatalogo.find((ex) => ex.id === id)?.nome || "";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="data">Data</Label>
          <Input id="data" type="date" value={form.data} onChange={(e) => set("data", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nome">Nome (opcional)</Label>
          <Input id="nome" placeholder="Treino de Peito" value={form.nome} onChange={(e) => set("nome", e.target.value)} />
        </div>
      </div>

      {!treino && planosAmbiguosDoDia.length > 1 && form.exercicios.length === 0 && (
        <div className="rounded-xl border border-gold-300 bg-gold-50 p-3">
          <p className="text-sm text-ink-700 mb-2">Mais de um plano cai nesse dia da semana. Qual usar?</p>
          <Select value="" onValueChange={aplicarPlano}>
            <SelectTrigger className="w-auto min-w-[200px]">
              <SelectValue placeholder="Escolher plano..." />
            </SelectTrigger>
            <SelectContent>
              {planosAmbiguosDoDia.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!treino && (planos.length > 0 || ultimoTreino) && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 p-3">
          {planos.length > 0 && (
            <Select value="" onValueChange={aplicarPlano}>
              <SelectTrigger className="w-auto min-w-[180px]">
                <SelectValue placeholder="Usar plano..." />
              </SelectTrigger>
              <SelectContent>
                {planos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {ultimoTreino && (
            <Button type="button" variant="outline" size="sm" onClick={duplicarUltimoTreino}>
              Duplicar último treino
            </Button>
          )}
        </div>
      )}

      <div className="space-y-3">
        <Label>Exercícios</Label>
        {form.exercicios.map((ex, idx) => {
          const totalConcluidas = ex.series.filter((s) => s.concluida).length;
          return (
          <div key={idx} className="rounded-xl border border-ink-200 bg-white p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <Select value={ex.exercicio_id} onValueChange={(v) => setExercicioId(idx, v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione o exercício">{nomeExercicio(ex.exercicio_id)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {exerciciosOrdenados.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {ex.series.length > 0 && (
                <span className="text-xs text-ink-400 flex-shrink-0 tabular-nums">
                  {totalConcluidas}/{ex.series.length}
                </span>
              )}
              <button type="button" onClick={() => removeExercicioLinha(idx)} className="p-2 text-ink-400 hover:text-rust-600 flex-shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {ex.series.map((s, sidx) => (
                <div key={sidx} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleConcluida(idx, sidx)}
                    className={cn(
                      "h-6 w-6 flex-shrink-0 rounded-full border flex items-center justify-center transition-colors",
                      s.concluida ? "bg-gold-500 border-gold-500 text-white" : "border-ink-300 text-transparent hover:border-ink-400"
                    )}
                    title={s.concluida ? "Marcar como não feita" : "Marcar como feita"}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs text-ink-400 w-5 flex-shrink-0">{sidx + 1}ª</span>
                  <Input
                    type="number" step="0.5" min="0" placeholder="Peso (kg)"
                    value={s.peso}
                    onChange={(e) => setSerieCampo(idx, sidx, "peso", e.target.value)}
                    className={cn("flex-1", s.concluida && "border-gold-300 bg-gold-50/40")}
                  />
                  <Input
                    type="number" min="0" placeholder="Reps"
                    value={s.repeticoes}
                    onChange={(e) => setSerieCampo(idx, sidx, "repeticoes", e.target.value)}
                    className={cn("flex-1", s.concluida && "border-gold-300 bg-gold-50/40")}
                  />
                  <button
                    type="button"
                    onClick={() => removeSerie(idx, sidx)}
                    disabled={ex.series.length === 1}
                    className="p-1.5 text-ink-300 hover:text-rust-600 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={() => addSerie(idx)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Série
              </Button>
            </div>

            <RestTimer defaultSeconds={90} startSignal={restSignals[idx] || 0} />
          </div>
          );
        })}

        <div className="flex flex-wrap gap-2">
          <Select value="" onValueChange={(v) => addExercicioLinha(v)}>
            <SelectTrigger className="w-auto min-w-[200px]">
              <SelectValue placeholder="+ Adicionar exercício" />
            </SelectTrigger>
            <SelectContent>
              {exerciciosOrdenados.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="sm" onClick={() => setAddingExercicio((v) => !v)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Novo exercício
          </Button>
        </div>

        {addingExercicio && (
          <div className="rounded-xl border border-ink-200 bg-ink-50 p-3 space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <Input placeholder="Nome do exercício" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} autoFocus />
              <Select value={novoGrupo} onValueChange={setNovoGrupo}>
                <SelectTrigger><SelectValue placeholder="Grupo muscular" /></SelectTrigger>
                <SelectContent>
                  {GRUPOS_MUSCULARES.map((g) => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setAddingExercicio(false)}>Cancelar</Button>
              <Button type="button" size="sm" onClick={handleCriarExercicio} disabled={!novoNome.trim()}>Adicionar</Button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacao">Observação</Label>
        <Textarea id="observacao" value={form.observacao} onChange={(e) => set("observacao", e.target.value)} rows={2} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </form>
  );
}
