import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";
import UsuarioForm from "@/components/UsuarioForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Users } from "lucide-react";
import { useUsuarios } from "@/hooks/useUsuarios";
import { useUsuarioAtual } from "@/hooks/useUsuarioAtual";

export default function Usuarios() {
  const [open, setOpen] = useState(false);
  const { usuarios, isLoading, toggleAtivo, criarUsuario } = useUsuarios();
  const { usuario: usuarioAtual } = useUsuarioAtual();

  const handleSaved = async (form) => {
    await criarUsuario(form);
    setOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Usuários"
        subtitle="Quem tem acesso ao sistema"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Novo usuário
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : usuarios.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum usuário cadastrado ainda.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-ink-200 bg-white divide-y divide-ink-100 overflow-hidden">
          {usuarios.map((u) => {
            const isSelf = u.id === usuarioAtual?.id;
            return (
              <div key={u.id} className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink-900">{u.nome}</p>
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                      {u.role === "admin" ? "Admin" : "Usuário"}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-400 font-mono">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-400">{u.ativo ? "Ativo" : "Inativo"}</span>
                  <Switch
                    checked={u.ativo}
                    disabled={isSelf}
                    title={isSelf ? "Você não pode inativar a própria conta" : undefined}
                    onCheckedChange={() => toggleAtivo(u)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo usuário</DialogTitle></DialogHeader>
          <UsuarioForm onSaved={handleSaved} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
