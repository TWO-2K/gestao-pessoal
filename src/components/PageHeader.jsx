import React from "react";

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight text-ink-900">{title}</h1>
        {subtitle && <p className="text-ink-500 mt-1.5 text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}