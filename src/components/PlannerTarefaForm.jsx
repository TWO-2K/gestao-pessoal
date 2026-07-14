import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const DIAS_ABREV = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

function makeEmptyForm(defaultData) {
  return {
    titulo: "",
    descricao: "",
    data: defaultData ?? new Date().toISOString().slice(0, 10),
    prioridade: "media",
    status: "a_fazer",
    tag: "",
    horario: "",
    repeticao: "nunca",
    repetirAte: "",
    diasSemana: [],
  };
}

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

function getOccurrenceDates(form) {
  if (!form.data || form.repeticao === "nunca" || !form.repetirAte) return [form.data || null];

  const dates = [];
  const start = parseDateLocal(form.data);
  const end = parseDateLocal(form.repetirAte);
  if (end < start) return [form.data];

  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay();
    const incluir = form.repeticao === "diaria" || form.diasSemana.includes(dow);
    if (incluir) dates.push(toDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates.length ? dates : [form.data];
}

export default function PlannerTarefaForm({ tarefa, defaultData, onSaved, onCancel }) {
  const [form, setForm] = useState(() => makeEmptyForm(defaultData));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (tarefa) {
      setForm({
        ...makeEmptyForm(defaultData),
        titulo: tarefa.titulo,
        descricao: tarefa.descricao || "",
        data: tarefa.data || "",
        prioridade: tarefa.prioridade,
        status: tarefa.status,
        tag: tarefa.tag || "",
        horario: tarefa.horario || "",
      });
    } else {
      setForm(makeEmptyForm(defaultData));
    }
  }, [tarefa, defaultData]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleDiaSemana = (dow) => {
    setForm((f) => ({
      ...f,
      diasSemana: f.diasSemana.includes(dow)
        ? f.diasSemana.filter((d) => d !== dow)
        : [...f.diasSemana, dow],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo) return;

    setSaving(true);
    try {
      if (tarefa) {
        await onSaved({
          id: tarefa.id,
          titulo: form.titulo,
          descricao: form.descricao,
          data: form.data || null,
          prioridade: form.prioridade,
          status: form.status,
          tag: form.tag || null,
          horario: form.horario || null,
        });
      } else {
        const datas = getOccurrenceDates(form);
        const serieId = datas.length > 1 ? crypto.randomUUID() : null;
        const rows = datas.map((data) => ({
          titulo: form.titulo,
          descricao: form.descricao,
          data,
          prioridade: form.prioridade,
          status: form.status,
          tag: form.tag || null,
          horario: form.horario || null,
          serie_id: serieId,
        }));
        await onSaved(rows);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="titulo">Título</Label>
        <Input id="titulo" value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="O que precisa ser feito?" autoFocus required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição (opcional)</Label>
        <Textarea
          id="descricao"
          value={form.descricao}
          onChange={(e) => set("descricao", e.target.value)}
          placeholder="Detalhes..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a_fazer">A fazer</SelectItem>
              <SelectItem value="em_andamento">Em andamento</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select value={form.prioridade} onValueChange={(v) => set("prioridade", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data">Data</Label>
          <Input id="data" type="date" value={form.data} onChange={(e) => set("data", e.target.value)} />
          <p className="text-[11px] text-ink-400">Deixe em branco para ficar no Quadro, sem dia fixo.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="horario">Horário</Label>
          <Input id="horario" type="time" value={form.horario} onChange={(e) => set("horario", e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tag">Tag / Projeto</Label>
        <Input id="tag" value={form.tag} onChange={(e) => set("tag", e.target.value)} placeholder="ex: trabalho, pessoal" />
      </div>

      {!tarefa && form.data && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Repetição</Label>
            <Select value={form.repeticao} onValueChange={(v) => set("repeticao", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a repetição" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nunca">Nunca</SelectItem>
                <SelectItem value="diaria">Diariamente</SelectItem>
                <SelectItem value="personalizado">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.repeticao !== "nunca" && (
            <div className="space-y-3 pl-3 border-l-2 border-ink-100">
              {form.repeticao === "personalizado" && (
                <div className="space-y-2">
                  <Label>Dias da semana</Label>
                  <div className="flex gap-1">
                    {DIAS_ABREV.map((label, dow) => (
                      <button
                        key={dow}
                        type="button"
                        onClick={() => toggleDiaSemana(dow)}
                        className={cn(
                          "flex-1 rounded-lg border px-1 py-1.5 text-[11px] font-semibold transition-colors",
                          form.diasSemana.includes(dow)
                            ? "border-gold-400 bg-gold-50 text-ink-900"
                            : "border-ink-200 text-ink-400 hover:bg-ink-50"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="repetirAte">Repetir até</Label>
                <Input
                  id="repetirAte"
                  type="date"
                  value={form.repetirAte}
                  min={form.data}
                  onChange={(e) => set("repetirAte", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </form>
  );
}
