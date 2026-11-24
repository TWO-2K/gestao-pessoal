import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

// Exibida no primeiro acesso de quem recebeu uma senha provisória (criada ou
// resetada por um admin) — obriga a troca antes de liberar o resto do app.
export default function TrocarSenha() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    if (novaSenha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const { error: senhaError } = await supabase.auth.updateUser({ password: novaSenha });
      if (senhaError) throw senhaError;

      const { error: rpcError } = await supabase.rpc("marcar_senha_trocada");
      if (rpcError) throw rpcError;

      await queryClient.invalidateQueries({ queryKey: ["usuario-atual", user?.id] });
      toast({ title: "Senha atualizada!", description: "Sua senha foi alterada com sucesso." });
      navigate("/", { replace: true });
    } catch (err) {
      setErro(err.message || "Não foi possível trocar a senha.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <AuthLayout
      title="Troque sua senha"
      subtitle="Essa senha foi definida por um administrador. Por segurança, defina uma nova antes de continuar."
      footer={
        <button onClick={handleLogout} className="hover:underline">
          Sair
        </button>
      }
    >
      {erro && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {erro}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nova-senha">Nova senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="nova-senha"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="pl-10 h-12"
              required
              minLength={6}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmar-senha">Confirme a senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirmar-senha"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className="pl-10 h-12"
              required
              minLength={6}
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            "Trocar senha"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
