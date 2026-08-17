import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { DIAS_SEMANA } from "@/lib/diasSemana";
import { GRUPOS_MUSCULARES } from "@/lib/gruposMusculares";
import { Plus, Trash2 } from "lucide-react";

const novoExercicioPlano = (exercicio_id) => ({ exercicio_id, series_alvo: 3, reps_alvo: 12 });

export default function PlanoForm({ plano, exerciciosCatalogo = [], onCreateExercicio, onSaved, onCancel }) {
  const [form, setForm] = useState({ nome: "", dias_semana: [], exercicios: [] });
  const [saving, setSaving] = useState(false);
  const [addingExercicio, setAddingExercicio] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoGrupo, setNovoGrupo] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (plano) {
      setForm({
        nome: plano.nome || "",
        dias_semana: plano.dias_semana || [],
        exercicios: plano.exercicios || [],
      });
    } else {
      setForm({ nome: "", dias_semana: [], exercicios: [] });
    }
  }, [plano]);

  const exerciciosOrdenados = [...exerciciosCatalogo].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const idsAdicionados = form.exercicios.map((ex) => ex.exercicio_id);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleDia = (dia) => {
    setForm((f) => ({
      ...f,
      dias_semana: f.dias_semana.includes(dia)
        ? f.dias_semana.filter((d) => d !== dia)
        : [...f.dias_semana, dia].sort((a, b) => a - b),
    }));
  };

  const addExercicio = (exercicio_id) => {
    if (idsAdicionados.includes(exercicio_id)) return;
    setForm((f) => ({ ...f, exercicios: [...f.exercicios, novoExercicioPlano(exercicio_id)] }));
  };

  const removeExercicio = (idx) => {
    setForm((f) => ({ ...f, exercicios: f.exercicios.filter((_, i) => i !== idx) }));
  };

  const setAlvo = (idx, campo, valor) => {
    setForm((f) => ({
      ...f,
      exercicios: f.exercicios.map((ex, i) => (i === idx ? { ...ex, [campo]: valor } : ex)),
    }));
  };

  const nomeExercicio = (id) => exerciciosCatalogo.find((ex) => ex.id === id)?.nome || "";

  const handleCriarExercicio = async () => {
    if (!novoNome.trim()) return;
    try {
      const criado = await onCreateExercicio({ nome: novoNome, grupo_muscular: novoGrupo });
      addExercicio(criado.id);
      setAddingExercicio(false);
      setNovoNome("");
      setNovoGrupo("");
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao criar exercício", description: error.message });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast({ variant: "destructive", title: "Informe um nome para o plano" });
      return;
    }
    if (form.exercicios.length === 0) {
      toast({ variant: "destructive", title: "Adicione ao menos um exercício" });
      return;
    }
    setSaving(true);
    try {
      await onSaved({
        id: plano?.id,
        nome: form.nome,
        dias_semana: form.dias_semana,
        exercicios: form.exercicios.map((ex) => ({
          exercicio_id: ex.exercicio_id,
          series_alvo: Number(ex.series_alvo) || 3,
          reps_alvo: Number(ex.reps_alvo) || 12,
        })),
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" placeholder="Treino A" value={form.nome} onChange={(e) => set("nome", e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label>Dias da semana</Label>
        <div className="flex flex-wrap gap-1.5">
          {DIAS_SEMANA.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => toggleDia(d.value)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                form.dias_semana.includes(d.value)
                  ? "bg-ink-900 text-white border-ink-900"
                  : "border-ink-200 text-ink-500 hover:border-ink-400"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Exercícios</Label>
        <div className="space-y-1.5">
          {form.exercicios.map((ex, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2">
              <span className="text-sm flex-1 min-w-0 truncate">{nomeExercicio(ex.exercicio_id)}</span>
              <Input
                type="number" min="1" value={ex.series_alvo}
                onChange={(e) => setAlvo(idx, "series_alvo", e.target.value)}
                className="w-14 h-8 text-center px-1"
                title="Séries alvo"
              />
              <span className="text-xs text-ink-400">x</span>
              <Input
                type="number" min="1" value={ex.reps_alvo}
                onChange={(e) => setAlvo(idx, "reps_alvo", e.target.value)}
                className="w-14 h-8 text-center px-1"
                title="Repetições alvo"
              />
              <button type="button" onClick={() => removeExercicio(idx)} className="p-1 text-ink-400 hover:text-rust-600 flex-shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value="" onValueChange={(v) => addExercicio(v)}>
            <SelectTrigger className="w-auto min-w-[200px]">
              <SelectValue placeholder="+ Adicionar exercício" />
            </SelectTrigger>
            <SelectContent>
              {exerciciosOrdenados
                .filter((e) => !idsAdicionados.includes(e.id))
                .map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          {onCreateExercicio && (
            <Button type="button" variant="outline" size="sm" onClick={() => setAddingExercicio((v) => !v)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Novo exercício
            </Button>
          )}
        </div>

        {addingExercicio && (
          <div className="rounded-xl border border-ink-200 bg-ink-50 p-3 space-y-2.5 mt-2">
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

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </form>
  );
}
