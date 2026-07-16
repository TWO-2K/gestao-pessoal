import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { usePlannerSubtarefas } from "@/hooks/usePlannerSubtarefas";
import { usePlannerEtiquetas } from "@/hooks/usePlannerEtiquetas";

const DIAS_ABREV = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

const ETIQUETA_CORES = [
  { nome: "rust", classe: "bg-rust-500" },
  { nome: "gold", classe: "bg-gold-500" },
  { nome: "forest", classe: "bg-forest-500" },
  { nome: "sky", classe: "bg-sky-400" },
  { nome: "emerald", classe: "bg-emerald-500" },
  { nome: "violet", classe: "bg-violet-500" },
];

export function etiquetaCorClasse(cor) {
  return ETIQUETA_CORES.find((c) => c.nome === cor)?.classe || "bg-ink-300";
}

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
    etiquetaIds: [],
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

export default function PlannerTarefaForm({ tarefa, defaultData, modo, quadroId, onSaved, onCancel }) {
  const [form, setForm] = useState(() => makeEmptyForm(defaultData));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const isQuadro = modo === "quadro";

  const [novaEtiquetaTexto, setNovaEtiquetaTexto] = useState("");
  const [novaEtiquetaCor, setNovaEtiquetaCor] = useState(ETIQUETA_CORES[0].nome);
  const { etiquetas, createEtiqueta, deleteEtiqueta } = usePlannerEtiquetas(quadroId);

  const [novoItemChecklist, setNovoItemChecklist] = useState("");
  const { subtarefas, createSubtarefa, toggleConcluida, deleteSubtarefa } = usePlannerSubtarefas();
  const itensChecklist = tarefa ? subtarefas.filter((s) => s.tarefa_id === tarefa.id) : [];

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
        etiquetaIds: (tarefa.etiquetas || []).map((e) => e.id),
      });
    } else {
      setForm(makeEmptyForm(defaultData));
    }
  }, [tarefa, defaultData]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleEtiqueta = (id) => {
    setForm((f) => ({
      ...f,
      etiquetaIds: f.etiquetaIds.includes(id) ? f.etiquetaIds.filter((x) => x !== id) : [...f.etiquetaIds, id],
    }));
  };

  const addEtiqueta = async () => {
    if (!novaEtiquetaTexto.trim()) return;
    try {
      const created = await createEtiqueta({ texto: novaEtiquetaTexto.trim(), cor: novaEtiquetaCor });
      setForm((f) => ({ ...f, etiquetaIds: [...f.etiquetaIds, created.id] }));
      setNovaEtiquetaTexto("");
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao criar etiqueta", description: error.message });
    }
  };

  const removeEtiqueta = async (id) => {
    try {
      await deleteEtiqueta(id);
      setForm((f) => ({ ...f, etiquetaIds: f.etiquetaIds.filter((x) => x !== id) }));
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir etiqueta", description: error.message });
    }
  };

  const addItemChecklist = async () => {
    if (!novoItemChecklist.trim() || !tarefa) return;
    await createSubtarefa({ tarefa_id: tarefa.id, titulo: novoItemChecklist.trim() });
    setNovoItemChecklist("");
  };

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
          data: isQuadro ? null : (form.data || null),
          prioridade: form.prioridade,
          status: form.status,
          tag: isQuadro ? null : (form.tag || null),
          horario: isQuadro ? null : (form.horario || null),
          etiquetaIds: isQuadro ? form.etiquetaIds : [],
        });
      } else {
        const datas = isQuadro ? [null] : getOccurrenceDates(form);
        const serieId = datas.length > 1 ? crypto.randomUUID() : null;
        const rows = datas.map((data) => ({
          titulo: form.titulo,
          descricao: form.descricao,
          data,
          prioridade: form.prioridade,
          status: form.status,
          tag: isQuadro ? null : (form.tag || null),
          horario: isQuadro ? null : (form.horario || null),
          serie_id: serieId,
          etiquetaIds: isQuadro ? form.etiquetaIds : [],
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

      {!isQuadro && (
        <>
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
        </>
      )}

      {isQuadro && (
        <div className="space-y-2">
          <Label>Etiquetas</Label>
          <p className="text-[11px] text-ink-400">Clique para marcar/desmarcar no cartão. As etiquetas são do quadro e podem ser reaproveitadas em outros cartões.</p>
          <div className="flex flex-wrap gap-1.5">
            {etiquetas.map((et) => {
              const selecionada = form.etiquetaIds.includes(et.id);
              return (
                <span
                  key={et.id}
                  onClick={() => toggleEtiqueta(et.id)}
                  className={cn(
                    "group/etq flex items-center gap-1 rounded-full pl-2 pr-1 py-0.5 text-[11px] font-medium text-white cursor-pointer transition-opacity",
                    etiquetaCorClasse(et.cor),
                    !selecionada && "opacity-40 hover:opacity-70"
                  )}
                >
                  {et.texto}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeEtiqueta(et.id); }}
                    className="rounded-full p-0.5 opacity-0 group-hover/etq:opacity-100 hover:bg-black/20"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </span>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-1">
              {ETIQUETA_CORES.map((c) => (
                <button
                  key={c.nome}
                  type="button"
                  onClick={() => setNovaEtiquetaCor(c.nome)}
                  className={cn(
                    "h-6 w-6 rounded-full flex-shrink-0",
                    c.classe,
                    novaEtiquetaCor === c.nome && "ring-2 ring-offset-1 ring-ink-500"
                  )}
                />
              ))}
            </div>
            <Input
              value={novaEtiquetaTexto}
              onChange={(e) => setNovaEtiquetaTexto(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEtiqueta(); } }}
              placeholder="Nome da etiqueta"
              className="h-8 text-sm"
            />
            <Button type="button" size="icon" variant="outline" className="h-8 w-8 flex-shrink-0" onClick={addEtiqueta}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {isQuadro && (
        <div className="space-y-2">
          <Label>Checklist</Label>
          {!tarefa ? (
            <p className="text-[11px] text-ink-400">Salve o cartão para adicionar itens de checklist.</p>
          ) : (
            <>
              <div className="space-y-1.5">
                {itensChecklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={item.concluida}
                      onCheckedChange={(checked) => toggleConcluida({ id: item.id, concluida: !!checked })}
                    />
                    <span className={cn("flex-1 text-sm", item.concluida && "line-through text-ink-400")}>
                      {item.titulo}
                    </span>
                    <button type="button" onClick={() => deleteSubtarefa(item.id)} className="p-1 text-ink-400 hover:text-rust-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  value={novoItemChecklist}
                  onChange={(e) => setNovoItemChecklist(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItemChecklist(); } }}
                  placeholder="Adicionar item"
                  className="h-8 text-sm"
                />
                <Button type="button" size="icon" variant="outline" className="h-8 w-8 flex-shrink-0" onClick={addItemChecklist}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {!isQuadro && !tarefa && form.data && (
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
