import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export const isPushSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSubscriptionState = useCallback(async () => {
    if (!isPushSupported()) {
      setIsLoading(false);
      return;
    }
    if (!user) {
      setIsSubscribed(false);
      setIsLoading(false);
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      setIsSubscribed(false);
      setIsLoading(false);
      return;
    }
    // A subscription do navegador é por dispositivo, não por conta: só
    // conta como "ativado" se ESTE usuário tiver uma linha registrada
    // para esse endpoint (outra conta pode usar o mesmo aparelho).
    const { data } = await supabase
      .from("push_subscriptions")
      .select("id")
      .match({ endpoint: subscription.endpoint, user_id: user.id })
      .maybeSingle();
    setIsSubscribed(!!data);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    refreshSubscriptionState();
  }, [refreshSubscriptionState]);

  const subscribe = useCallback(async () => {
    if (!isPushSupported()) {
      throw new Error("Este navegador não suporta notificações push.");
    }
    if (!user) {
      throw new Error("Você precisa estar logado para ativar notificações.");
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== "granted") {
      throw new Error("Permissão de notificação negada.");
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const json = subscription.toJSON();
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        user_agent: navigator.userAgent,
      },
      { onConflict: "endpoint,user_id" }
    );
    if (error) throw new Error(error.message);

    setIsSubscribed(true);
    return subscription;
  }, [user]);

  const unsubscribe = useCallback(async () => {
    if (!isPushSupported()) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      // Não desinscreve o endpoint no navegador: outra conta pode estar
      // usando o mesmo dispositivo e continuar recebendo notificações.
      await supabase.from("push_subscriptions").delete().match({ endpoint, user_id: user?.id });
    }
    setIsSubscribed(false);
  }, [user]);

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe };
}
