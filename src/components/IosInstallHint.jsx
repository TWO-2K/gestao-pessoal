import React, { useEffect, useState } from "react";
import { Share, X } from "lucide-react";

const DISMISS_KEY = "ios-install-hint-dismissed";

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export default function IosInstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isIos() && !isStandalone() && !localStorage.getItem(DISMISS_KEY)) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="relative flex items-center gap-3 bg-gold-50 border-b border-gold-200 px-4 py-2.5 text-sm text-ink-900">
      <Share className="h-4 w-4 flex-shrink-0 text-gold-600" />
      <p className="flex-1 min-w-0">
        Instale este app: toque em <strong>Compartilhar</strong> e depois em{" "}
        <strong>"Adicionar à Tela de Início"</strong>.
      </p>
      <button onClick={dismiss} className="p-1 text-ink-400 hover:text-ink-900 flex-shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
