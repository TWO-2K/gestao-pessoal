import React from "react";

// Banner de boas-vindas: planeta com anéis orbitais desenhados em SVG (sem imagem externa).
export default function WelcomeBanner({ nome }) {
  const primeiroNome = nome?.trim() || "";
  return (
    <section
      className="relative overflow-hidden rounded-2xl border px-6 py-6 sm:px-8 sm:py-7"
      style={{ background: "var(--o-surface)", borderColor: "var(--o-border)" }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 700 220"
        preserveAspectRatio="xMaxYMid slice"
        className="pointer-events-none absolute inset-y-0 right-0 h-full w-[75%] sm:w-[60%]"
      >
        <defs>
          <radialGradient id="orbita-planeta" cx="30%" cy="25%" r="85%">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="35%" stopColor="#6d4ae8" />
            <stop offset="75%" stopColor="#1d1b6b" />
            <stop offset="100%" stopColor="#0a0b2e" />
          </radialGradient>
          <linearGradient id="orbita-anel" x1="0" x2="1">
            <stop offset="0%" stopColor="#6d4ae8" stopOpacity="0" />
            <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
          </linearGradient>
          <filter id="orbita-brilho" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>
        <circle cx="470" cy="300" r="215" fill="#6d4ae8" opacity="0.35" filter="url(#orbita-brilho)" />
        <circle cx="470" cy="300" r="190" fill="url(#orbita-planeta)" />
        <g transform="rotate(-14 470 120)">
          <ellipse cx="470" cy="120" rx="330" ry="62" fill="none" stroke="url(#orbita-anel)" strokeWidth="2.5" />
          <ellipse cx="470" cy="120" rx="380" ry="80" fill="none" stroke="url(#orbita-anel)" strokeWidth="1.5" opacity="0.6" />
        </g>
      </svg>
      <div className="relative">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Olá{primeiroNome ? "," : "!"}{" "}
          {primeiroNome && <span style={{ color: "#c084fc" }}>{primeiroNome}!</span>}
        </h1>
        <p className="mt-1 max-w-md text-sm sm:text-base" style={{ color: "var(--o-muted)" }}>
          Bem-vindo ao seu painel. Escolha um módulo para começar.
        </p>
      </div>
      <p className="relative mt-4 text-right text-xs italic sm:absolute sm:bottom-5 sm:right-8 sm:mt-0 sm:text-sm" style={{ color: "var(--o-muted)" }}>
        Organize • Automatize • Conquiste
        <span className="mt-1 block h-0.5 rounded-full bg-gradient-to-r from-transparent to-purple-400" />
      </p>
    </section>
  );
}
