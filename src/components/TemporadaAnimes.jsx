import React from "react";
import { CalendarDays } from "lucide-react";
import { TIPOS_COM_TEMPORADA, rotuloTemporada, temporadaDe } from "@/lib/temporadas";

// Temporadas de lançamento dos animes: 4 por ano, começando em jan/abr/jul/out
export function calcularTemporadas(hoje = new Date()) {
  const n = Math.floor(hoje.getMonth() / 3);
  const proxN = (n + 1) % 4;
  const proxAno = proxN === 0 ? hoje.getFullYear() + 1 : hoje.getFullYear();
  const inicio = new Date(proxAno, proxN * 3, 1);
  return {
    atual: temporadaDe(hoje),
    proxima: `${proxAno}-${proxN + 1}`,
    dias: Math.ceil((inicio - hoje) / 86400000),
  };
}

export default function TemporadaAnimes({ midias = [] }) {
  const { atual, proxima, dias } = calcularTemporadas();
  const daAtual = midias.filter((m) => TIPOS_COM_TEMPORADA.includes(m.tipo) && m.temporada === atual);
  const concluidos = daAtual.filter((m) => m.status === "concluido").length;
  return (
    <div className="mb-5 flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
      <CalendarDays className="h-4 w-4 shrink-0" />
      <p>
        <strong>{rotuloTemporada(atual)}</strong>:{" "}
        {daAtual.length === 0
          ? "você ainda não pegou nenhum anime dessa temporada."
          : `${daAtual.length} ${daAtual.length === 1 ? "anime pego" : "animes pegos"}, ${concluidos} concluído${concluidos === 1 ? "" : "s"}.`}{" "}
        A de <strong>{rotuloTemporada(proxima)}</strong> começa em {dias} {dias === 1 ? "dia" : "dias"}.
      </p>
    </div>
  );
}
