import { useEffect, useState } from "react";

function isStandalone() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

// Captura o evento beforeinstallprompt (Chrome/Edge/Android) para poder
// disparar a instalação do PWA a partir de um botão nosso, em vez de depender
// do menu do navegador. No iOS esse evento não existe (ver IosInstallHint).
export function usePwaInstall() {
  const [deferredEvent, setDeferredEvent] = useState(null);
  const [installed, setInstalled] = useState(() => isStandalone());

  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredEvent(e);
    };
    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredEvent) return;
    deferredEvent.prompt();
    const { outcome } = await deferredEvent.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredEvent(null);
  };

  return { canInstall: !!deferredEvent && !installed, install };
}
