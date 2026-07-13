import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";

const TIPOS = [
  { value: "anime", label: "Anime" },
  { value: "ova", label: "OVA" },
  { value: "ona", label: "ONA" },
  { value: "filme", label: "Filme" },
  { value: "especial", label: "Especial" },
  { value: "serie", label: "Série (live-action)" },
];

const TIPO_LABEL = Object.fromEntries(TIPOS.map((t) => [t.value, t.label]));

const STATUS = [
  { value: "planejado", label: "Planejado" },
  { value: "assistindo", label: "Assistindo" },
  { value: "concluido", label: "Concluído" },
  { value: "pausado", label: "Pausado" },
  { value: "abandonado", label: "Abandonado" },
];

const EMPTY = {
  titulo: "",
  tipo: "anime",
  status: "planejado",
  nota: "",
  temporada_atual: "",
  episodio_atual: "",
  ano: "",
  genero: "",
  observacoes: "",
  franquia_id: "",
  midia_pai_id: "",
};

export default function MidiaForm({ midia, midias = [], franquias = [], defaults, onCreateFranquia, onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [novaFranquiaNome, setNovaFranquiaNome] = useState("");
  const [criandoFranquia, setCriandoFranquia] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (midia) {
      setForm({
        titulo: midia.titulo || "",
        tipo: midia.tipo || "anime",
        status: midia.status || "planejado",
        nota: midia.nota ?? "",
        temporada_atual: midia.temporada_atual ?? "",
        episodio_atual: midia.episodio_atual ?? "",
        ano: midia.ano ?? "",
        genero: midia.genero || "",
        observacoes: midia.observacoes || "",
        franquia_id: midia.franquia_id || "",
        midia_pai_id: midia.midia_pai_id || "",
      });
    } else {
      setForm({ ...EMPTY, ...defaults });
    }
  }, [midia, defaults]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;

    setSaving(true);
    try {
      await onSaved({ id: midia?.id, ...form, titulo: form.titulo.trim() });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCriarFranquia = async () => {
    if (!novaFranquiaNome.trim()) return;
    try {
      const created = await onCreateFranquia(novaFranquiaNome.trim());
      set("franquia_id", created.id);
      setNovaFranquiaNome("");
      setCriandoFranquia(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao criar franquia", description: error.message });
    }
  };

  const mostraEpisodio = !["filme", "especial"].includes(form.tipo);
  const opcoesPai = midias.filter((m) => m.id !== midia?.id);

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

      <div className="grid grid-cols-3 gap-3">
        {mostraEpisodio && (
          <div className="space-y-2">
            <Label htmlFor="temporada_atual">Temporada</Label>
            <Input id="temporada_atual" type="number" min="0" value={form.temporada_atual} onChange={(e) => set("temporada_atual", e.target.value)} />
          </div>
        )}
        {mostraEpisodio && (
          <div className="space-y-2">
            <Label htmlFor="episodio_atual">Episódio</Label>
            <Input id="episodio_atual" type="number" min="0" value={form.episodio_atual} onChange={(e) => set("episodio_atual", e.target.value)} />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="nota">Nota (0-10)</Label>
          <Input id="nota" type="number" min="0" max="10" step="0.5" value={form.nota} onChange={(e) => set("nota", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="ano">Ano</Label>
          <Input id="ano" type="number" min="1900" value={form.ano} onChange={(e) => set("ano", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="genero">Gênero</Label>
          <Input id="genero" value={form.genero} onChange={(e) => set("genero", e.target.value)} placeholder="Ação, Comédia..." />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Franquia (opcional)</Label>
        <p className="text-[11px] text-ink-400 -mt-1">Agrupa obras da mesma linha, mesmo com nomes diferentes.</p>
        <div className="flex items-center gap-1.5">
          <Select value={form.franquia_id || "none"} onValueChange={(v) => set("franquia_id", v === "none" ? "" : v)}>
            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {franquias.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="icon" className="flex-shrink-0" onClick={() => setCriandoFranquia((v) => !v)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {criandoFranquia && (
          <div className="flex items-center gap-1.5 pt-1">
            <Input
              autoFocus
              value={novaFranquiaNome}
              onChange={(e) => setNovaFranquiaNome(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCriarFranquia(); } }}
              placeholder="Nome da nova franquia"
              className="h-9 flex-1"
            />
            <Button type="button" size="sm" onClick={handleCriarFranquia}>Criar</Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Faz parte de (obra principal)</Label>
        <p className="text-[11px] text-ink-400 -mt-1">Use para OVAs, filmes ou especiais vinculados a uma obra específica.</p>
        <Select value={form.midia_pai_id || "none"} onValueChange={(v) => set("midia_pai_id", v === "none" ? "" : v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma (obra independente)</SelectItem>
            {opcoesPai.map((m) => (
              <SelectItem key={m.id} value={m.id}>[{TIPO_LABEL[m.tipo]}] {m.titulo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
