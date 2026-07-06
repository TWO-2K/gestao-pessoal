import { Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { isPushSupported, usePushNotifications } from "@/hooks/usePushNotifications";

const isIosOutsideStandalone = () => {
  if (typeof navigator === "undefined") return false;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches || navigator.standalone;
  return isIos && !isStandalone;
};

export default function PushNotificationToggle() {
  const { toast } = useToast();
  const { isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();

  if (!isPushSupported()) return null;

  const handleChange = async (checked) => {
    try {
      if (checked) {
        await subscribe();
        toast({ title: "Notificações ativadas", description: "Você será avisado quando uma conta estiver perto de vencer." });
      } else {
        await unsubscribe();
        toast({ title: "Notificações desativadas" });
      }
    } catch (error) {
      toast({ title: "Não foi possível atualizar", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3">
      <Bell className="h-4 w-4 text-ink-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-900">Avisar antes do vencimento</p>
        <p className="text-xs text-ink-400">
          Notificação no celular 1 dia antes e no dia do vencimento.
          {isIosOutsideStandalone() && " No iPhone, adicione o app à Tela de Início para receber notificações."}
        </p>
      </div>
      <Switch checked={isSubscribed} disabled={isLoading} onCheckedChange={handleChange} />
    </div>
  );
}
