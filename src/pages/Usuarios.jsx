import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";
import UsuarioForm from "@/components/UsuarioForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Users, Pencil, Trash2 } from "lucide-react";
import { useUsuarios } from "@/hooks/useUsuarios";
import { useUsuarioAtual } from "@/hooks/useUsuarioAtual";
import { useToast } from "@/components/ui/use-toast";

export default function Usuarios() {
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const { usuarios, usuariosComDados, isLoading, toggleAtivo, criarUsuario, editarUsuario, excluirUsuario } = useUsuarios();
  const { usuario: usuarioAtual } = useUsuarioAtual();
  const { toast } = useToast();

  const confirmarExclusao = async () => {
    try {
      await excluirUsuario(excluindo.id);
    } catch (error) {
      toast({ variant: "destructive", title: "Não foi possível excluir", description: error.message });
    } finally {
      setExcluindo(null);
    }
  };

  const handleSaved = async (form) => {
    if (editando) {
      await editarUsuario(form);
    } else {
      await criarUsuario(form);
    }
    setOpen(false);
    setEditando(null);
  };

  const openCriar = () => {
    setEditando(null);
    setOpen(true);
  };

  const openEditar = (usuario) => {
    setEditando(usuario);
    setOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Usuários"
        subtitle="Quem tem acesso ao sistema"
        action={
          <Button onClick={openCriar}>
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
            const temDados = usuariosComDados.includes(u.id);
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
                  <Button variant="ghost" size="icon" onClick={() => openEditar(u)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!isSelf && (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={temDados}
                      title={temDados ? "Usuário já tem dados cadastrados e não pode ser excluído" : undefined}
                      onClick={() => setExcluindo(u)}
                      className="text-ink-400 hover:text-rust-600 disabled:opacity-40 disabled:hover:text-ink-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditando(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editando ? "Editar usuário" : "Novo usuário"}</DialogTitle></DialogHeader>
          <UsuarioForm usuario={editando} onSaved={handleSaved} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(excluindo)} onOpenChange={(v) => !v && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {excluindo?.nome}? Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
