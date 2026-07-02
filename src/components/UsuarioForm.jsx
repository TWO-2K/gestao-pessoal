import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

export default function UsuarioForm({ usuario, onSaved, onCancel }) {
  const isEditing = !!usuario;
  const [form, setForm] = useState({
    nome: usuario?.nome ?? "",
    email: usuario?.email ?? "",
    senha: "",
    role: usuario?.role ?? "user",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.email) return;
    if (!isEditing && !form.senha) return;

    setSaving(true);
    try {
      await onSaved(isEditing ? { ...form, id: usuario.id } : form);
    } catch (error) {
      toast({
        variant: "destructive",
        title: isEditing ? "Erro ao editar usuário" : "Erro ao criar usuário",
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
        <Label htmlFor="senha">{isEditing ? "Nova senha" : "Senha provisória"}</Label>
        <Input
          id="senha"
          type="text"
          minLength={6}
          value={form.senha}
          onChange={(e) => set("senha", e.target.value)}
          placeholder={isEditing ? "Deixe em branco para manter a atual" : undefined}
          required={!isEditing}
        />
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
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar usuário"}
        </Button>
      </div>
    </form>
  );
}
