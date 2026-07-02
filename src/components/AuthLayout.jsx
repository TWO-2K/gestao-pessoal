import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary mb-5">
            <span className="absolute inset-0 rounded-full ring-2 ring-gold-500/60 ring-offset-2 ring-offset-background" />
            <Icon className="w-6 h-6 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>}
        </div>
        <div className="bg-card rounded-xl shadow-sm border border-border p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}
