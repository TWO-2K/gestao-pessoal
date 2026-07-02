import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

export default function UsuarioForm({ onSaved, onCancel }) {
  const [form, setForm] = useState({ nome: "", email: "", senha: "", role: "user" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.email || !form.senha) return;

    setSaving(true);
    try {
      await onSaved(form);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar usuário",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" value={form.nome} onChange={(e) => set("nome", e.target.value)} autoFocus required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="senha">Senha provisória</Label>
        <Input id="senha" type="text" minLength={6} value={form.senha} onChange={(e) => set("senha", e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Papel</Label>
        <Select value={form.role} onValueChange={(v) => set("role", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Usuário</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Criando..." : "Criar usuário"}</Button>
      </div>
    </form>
  );
}
