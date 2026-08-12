import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Dumbbell, XCircle, ChevronLeft, ChevronRight, Trophy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { volumeTreino, recordesPorTreino } from "@/lib/academiaMetrics";
import { diaSemanaDeData } from "@/lib/treinoUtils";
import { DIAS_SEMANA } from "@/lib/diasSemana";
import { grupoMuscularLabel } from "@/lib/gruposMusculares";
import { useTreinos } from "@/hooks/useTreinos";
import { useExerciciosAcademia } from "@/hooks/useExerciciosAcademia";
import { usePlanosAcademia } from "@/hooks/usePlanosAcademia";

const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function partesData(dataStr) {
  const [y, m, d] = dataStr.split("-").map(Number);
  return {
    dia: d,
    mes: MESES_ABREV[m - 1],
    diaSemana: DIAS_SEMANA.find((ds) => ds.value === diaSemanaDeData(dataStr))?.label || "",
  };
}

const DIAS_A_VERIFICAR = 28; // últimas 4 semanas
const ITENS_POR_PAGINA = 15;

function diasNaoRealizados(treinos, planos) {
  const datasComTreino = new Set(treinos.map((t) => t.data));
  const faltas = [];
  const hoje = new Date();
  for (let i = 1; i <= DIAS_A_VERIFICAR; i++) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    const dataStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (datasComTreino.has(dataStr)) continue;
    const diaSemana = diaSemanaDeData(dataStr);
    const planosDoDia = planos.filter((p) => (p.dias_semana || []).includes(diaSemana));
    if (planosDoDia.length > 0) {
      faltas.push({ tipo: "nao_realizado", data: dataStr, planos: planosDoDia });
    }
  }
  return faltas;
}

export default function Treinos() {
  const { treinos, isLoading } = useTreinos();
  const { exercicios } = useExerciciosAcademia();
  const { planos } = usePlanosAcademia();

  const exercicioMap = useMemo(() => Object.fromEntries(exercicios.map((e) => [e.id, e])), [exercicios]);
  const planoMap = useMemo(() => Object.fromEntries(planos.map((p) => [p.id, p])), [planos]);

  const itens = useMemo(() => {
    const registrados = treinos.map((t) => ({ tipo: "treino", data: t.data, treino: t }));
    const faltas = diasNaoRealizados(treinos, planos);
    return [...registrados, ...faltas].sort((a, b) => (a.data < b.data ? 1 : -1));
  }, [treinos, planos]);

  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(itens.length / ITENS_POR_PAGINA));

  useEffect(() => {
    setPagina(1);
  }, [treinos, planos]);

  const itensDaPagina = itens.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA);

  const prsPorTreino = useMemo(() => recordesPorTreino(treinos), [treinos]);

  const gruposPorExercicio = (treino) => {
    const ordem = [];
    const grupos = {};
    for (const s of [...treino.series].sort((a, b) => a.numero_serie - b.numero_serie)) {
      if (!grupos[s.exercicio_id]) {
        grupos[s.exercicio_id] = [];
        ordem.push(s.exercicio_id);
      }
      grupos[s.exercicio_id].push(s);
    }
    return ordem.map((exercicio_id) => ({ exercicio_id, series: grupos[exercicio_id] }));
  };

  return (
    <div>
      <PageHeader
        title="Histórico"
        subtitle="Registro do que já aconteceu — para lançar ou corrigir um treino, use 'Treino do dia'"
      />

      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : itens.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum treino registrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {itensDaPagina.map((item) => {
            const { dia, mes, diaSemana } = partesData(item.data);

            if (item.tipo === "nao_realizado") {
              return (
                <Link
                  key={`falta-${item.data}`}
                  to={`/academia/hoje?data=${item.data}`}
                  className="flex items-stretch gap-3 rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 hover:border-ink-300 transition-colors overflow-hidden"
                >
                  <div className="flex flex-col items-center justify-center w-16 flex-shrink-0 py-3 text-ink-300">
                    <span className="text-[10px] uppercase tracking-wide">{diaSemana}</span>
                    <span className="text-xl font-display leading-none mt-0.5">{dia}</span>
                    <span className="text-[10px] uppercase">{mes}</span>
                  </div>
                  <div className="flex items-center gap-2 py-3 pr-4 text-ink-400 min-w-0">
                    <XCircle className="h-4 w-4 flex-shrink-0" />
                    <p className="text-sm truncate">
                      <span className="font-medium">Não realizado</span> — {item.planos.map((p) => p.nome).join(", ")}
                    </p>
                  </div>
                </Link>
              );
            }

            const treino = item.treino;
            const totalSeries = treino.series.length;
            const seriesConcluidas = treino.series.filter((s) => s.concluida).length;
            const treinoCompleto = totalSeries > 0 && seriesConcluidas === totalSeries;
            const prsDoTreino = prsPorTreino[treino.id];

            return (
              <div key={treino.id} className="flex items-stretch gap-0 rounded-2xl border border-ink-200 bg-white overflow-hidden">
                <div className="flex flex-col items-center justify-center w-16 flex-shrink-0 py-3.5 bg-ink-50 text-ink-500 border-r border-ink-100">
                  <span className="text-[10px] uppercase tracking-wide">{diaSemana}</span>
                  <span className="text-xl font-display leading-none mt-0.5 text-ink-900">{dia}</span>
                  <span className="text-[10px] uppercase">{mes}</span>
                </div>

                <div className="flex-1 min-w-0 px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{treino.nome || "Treino"}</p>
                        {treino.plano_id && planoMap[treino.plano_id] && (
                          <span className="text-[10px] uppercase tracking-wide font-medium text-ink-500 bg-ink-100 rounded-full px-2 py-0.5 flex-shrink-0">
                            {planoMap[treino.plano_id].nome}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-400 mt-0.5">
                        Volume: {volumeTreino(treino).toLocaleString("pt-BR")} kg
                      </p>
                    </div>
                    {totalSeries > 0 && (
                      <span
                        className={cn(
                          "flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide rounded-full px-2 py-0.5 flex-shrink-0",
                          treinoCompleto ? "bg-emerald-100 text-emerald-700" : "bg-gold-100 text-gold-700"
                        )}
                      >
                        {treinoCompleto && <CheckCircle2 className="h-3 w-3" />}
                        {seriesConcluidas}/{totalSeries} séries
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 space-y-1">
                    {gruposPorExercicio(treino).map(({ exercicio_id, series }) => {
                      const pesos = series.map((s) => Number(s.peso) || 0).filter((p) => p > 0);
                      const min = pesos.length ? Math.min(...pesos) : null;
                      const max = pesos.length ? Math.max(...pesos) : null;
                      const faixaPeso = min == null ? "—" : min === max ? `${min}kg` : `${min}–${max}kg`;
                      const reps = [...new Set(series.map((s) => s.repeticoes).filter((r) => r != null))];
                      const ehPr = prsDoTreino?.has(exercicio_id);
                      return (
                        <div key={exercicio_id} className="flex items-center gap-1.5 text-sm">
                          {ehPr && <Trophy className="h-3.5 w-3.5 text-gold-500 flex-shrink-0" />}
                          <span className="font-medium text-ink-700">{exercicioMap[exercicio_id]?.nome || "Exercício"}</span>
                          <span className="text-[10px] uppercase tracking-wide text-ink-300">{grupoMuscularLabel(exercicioMap[exercicio_id]?.grupo_muscular)}</span>
                          <span className="text-ink-400">
                            {series.length}x{reps.length === 1 ? reps[0] : reps.join("/")} — {faixaPeso}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {treino.observacao && (
                    <p className="mt-2 text-xs text-ink-400 italic">{treino.observacao}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <Button
            type="button" variant="outline" size="sm"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <span className="text-xs text-ink-400 tabular-nums">Página {pagina} de {totalPaginas}</span>
          <Button
            type="button" variant="outline" size="sm"
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
          >
            Próxima <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      <p className="mt-6 text-xs text-ink-400 text-center">
        Precisa corrigir ou lançar um treino de outro dia?{" "}
        <Link to="/academia/hoje" className="underline hover:text-ink-600">Vá em "Treino do dia"</Link>.
      </p>
    </div>
  );
}
