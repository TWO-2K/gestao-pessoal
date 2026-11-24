import React from "react";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-ink-50 px-4 py-10">
      {/* Decoração de fundo — sutil, não compete com o card */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-forest-500/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full overflow-hidden mb-5 ring-2 ring-gold-500/60 ring-offset-4 ring-offset-ink-50">
            <img src="/pwa-192x192.png" alt="Órbita" className="h-full w-full object-cover" />
          </div>
          <p className="font-display text-sm uppercase tracking-[0.2em] text-ink-400 mb-1">Órbita</p>
          <h1 className="font-display text-3xl font-medium tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>}
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {children}
        </div>

        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}
