import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import GeneroSelect from "@/components/GeneroSelect";
import { generoParaLista, listaParaGenero } from "@/lib/generos";

const TIPOS = [
  { value: "anime", label: "Anime" },
  { value: "ova", label: "OVA" },
  { value: "ona", label: "ONA" },
  { value: "filme", label: "Filme" },
  { value: "especial", label: "Especial" },
  { value: "serie", label: "Série (live-action)" },
];

const STATUS = [
  { value: "pendente", label: "Pendente" },
  { value: "planejado", label: "Planejado" },
  { value: "assistindo", label: "Assistindo" },
  { value: "concluido", label: "Concluído" },
  { value: "pausado", label: "Pausado" },
];

const EMPTY = {
  titulo: "",
  tipo: "anime",
  status: "planejado",
  episodio_atual: "",
  ano: "",
  genero: "",
  observacoes: "",
  franquia_id: "",
  midia_pai_id: "",
};

const SEM_PAI = "__nenhum__";

export default function MidiaForm({ midia, midias = [], defaults, onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (midia) {
      setForm({
        titulo: midia.titulo || "",
        tipo: midia.tipo || "anime",
        status: midia.status || "planejado",
        episodio_atual: midia.episodio_atual ?? "",
        ano: midia.ano ?? "",
        genero: midia.genero || "",
        observacoes: midia.observacoes || "",
        franquia_id: midia.franquia_id || "",
        midia_pai_id: midia.midia_pai_id || SEM_PAI,
      });
    } else {
      setForm({ ...EMPTY, midia_pai_id: SEM_PAI, ...defaults });
    }
  }, [midia, defaults]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;

    setSaving(true);
    try {
      await onSaved({
        id: midia?.id,
        ...form,
        titulo: form.titulo.trim(),
        midia_pai_id: form.midia_pai_id === SEM_PAI ? "" : form.midia_pai_id,
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const mostraEpisodio = !["filme", "especial"].includes(form.tipo);

  const opcoesPai = midias
    .filter((m) => m.id !== midia?.id && m.midia_pai_id !== midia?.id)
    .sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="titulo">Título</Label>
        <Input id="titulo" value={form.titulo} onChange={(e) => set("titulo", e.target.value)} autoFocus required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={form.tipo} onValueChange={(v) => set("tipo", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {mostraEpisodio && (
          <div className="space-y-2">
            <Label htmlFor="episodio_atual">Episódio</Label>
            <Input id="episodio_atual" type="number" min="0" value={form.episodio_atual} onChange={(e) => set("episodio_atual", e.target.value)} />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="ano">Ano</Label>
          <Input id="ano" type="number" min="1900" value={form.ano} onChange={(e) => set("ano", e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Faz parte de</Label>
        <Select value={form.midia_pai_id} onValueChange={(v) => set("midia_pai_id", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={SEM_PAI}>Nenhum (item independente)</SelectItem>
            {opcoesPai.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.titulo} ({TIPOS.find((t) => t.value === m.tipo)?.label})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Gênero</Label>
        <GeneroSelect
          value={generoParaLista(form.genero)}
          onChange={(lista) => set("genero", listaParaGenero(lista))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} rows={3} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </form>
  );
}
