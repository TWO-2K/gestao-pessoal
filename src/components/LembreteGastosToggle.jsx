import { useCallback, useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";

// Preferência por usuário (vale para todos os aparelhos). Sem linha = ligado.
export default function LembreteGastosToggle() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ativo, setAtivo] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("preferencias_notificacao")
      .select("lembrete_gastos")
      .eq("user_id", user.id)
      .maybeSingle();
    setAtivo(data?.lembrete_gastos ?? true);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const handleChange = async (checked) => {
    const anterior = ativo;
    setAtivo(checked);
    const { error } = await supabase
      .from("preferencias_notificacao")
      .upsert(
        { user_id: user.id, lembrete_gastos: checked, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    if (error) {
      setAtivo(anterior);
      toast({ title: "Não foi possível atualizar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: checked ? "Lembrete de gastos ativado" : "Lembrete de gastos desativado" });
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3">
      <CalendarCheck className="h-4 w-4 text-ink-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-900">Lembrete diário de gastos</p>
        <p className="text-xs text-ink-400">Aviso às 21h para conferir se lançou os gastos do dia.</p>
      </div>
      <Switch checked={ativo} disabled={isLoading} onCheckedChange={handleChange} />
    </div>
  );
}
