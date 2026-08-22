import React from "react";
import PageHeader from "@/components/PageHeader";
import EventosFuturosList from "@/components/planner/EventosFuturosList";

export default function EventosFuturos() {
  return (
    <div>
      <PageHeader
        title="Eventos futuros"
        subtitle="Itens sem data fixa, com uma faixa de datas desejada"
      />
      <EventosFuturosList />
    </div>
  );
}
