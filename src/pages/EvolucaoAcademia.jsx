import React, { useMemo, useState } from "react";
import * as RechartsPrimitive from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import PageHeader from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Trophy, BarChart3 } from "lucide-react";
import { formatDate } from "@/lib/format";
import { useTreinos } from "@/hooks/useTreinos";
import { useExerciciosAcademia } from "@/hooks/useExerciciosAcademia";
import { volumePorSemana, progressaoExercicio, recordesPorExercicio } from "@/lib/academiaMetrics";

export default function EvolucaoAcademia() {
  const { treinos, isLoading } = useTreinos();
  const { exercicios } = useExerciciosAcademia();
  const [exercicioId, setExercicioId] = useState("");

  const recordes = useMemo(() => recordesPorExercicio(treinos), [treinos]);

  const exerciciosComRegistro = useMemo(
    () =>
      [...exercicios]
        .filter((e) => recordes[e.id])
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [exercicios, recordes]
  );

  const exercicioSelecionado = exercicioId || exerciciosComRegistro[0]?.id || "";

  const progressao = useMemo(
    () =>
      exercicioSelecionado
        ? progressaoExercicio(treinos, exercicioSelecionado).map((p) => ({ ...p, label: formatDate(p.data) }))
        : [],
    [treinos, exercicioSelecionado]
  );

  const volumeSemanal = useMemo(
    () => volumePorSemana(treinos).map((v) => ({ ...v, label: formatDate(v.semana) })),
    [treinos]
  );

  const recordesOrdenados = useMemo(
    () =>
      Object.entries(recordes)
        .map(([exercicio_id, r]) => ({
          exercicio_id,
          nome: exercicios.find((e) => e.id === exercicio_id)?.nome || "Exercício",
          ...r,
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [recordes, exercicios]
  );

  return (
    <div>
      <PageHeader title="Evolução" subtitle="Progressão de carga, volume e recordes pessoais" />

      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : treinos.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Registre treinos para acompanhar sua evolução.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="font-display text-lg text-ink-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-ink-400" /> Progressão de carga
              </h2>
              {exerciciosComRegistro.length > 0 && (
                <Select value={exercicioSelecionado} onValueChange={setExercicioId}>
                  <SelectTrigger className="w-auto min-w-[180px]">
                    <SelectValue placeholder="Exercício" />
                  </SelectTrigger>
                  <SelectContent>
                    {exerciciosComRegistro.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {progressao.length === 0 ? (
              <p className="text-sm text-ink-400">Sem registros de peso para este exercício ainda.</p>
            ) : (
              <ChartContainer config={{}} className="max-h-[260px] w-full">
                <RechartsPrimitive.LineChart data={progressao}>
                  <RechartsPrimitive.CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <RechartsPrimitive.XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <RechartsPrimitive.YAxis tickLine={false} axisLine={false} width={40} domain={["auto", "auto"]} />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <RechartsPrimitive.Line type="monotone" dataKey="pesoMax" stroke="#c25b3f" strokeWidth={2} dot={{ r: 3 }} />
                </RechartsPrimitive.LineChart>
              </ChartContainer>
            )}
          </div>

          <div>
            <h2 className="font-display text-lg text-ink-900 mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-ink-400" /> Volume semanal
            </h2>
            <ChartContainer config={{}} className="max-h-[220px] w-full">
              <RechartsPrimitive.BarChart data={volumeSemanal}>
                <RechartsPrimitive.CartesianGrid vertical={false} strokeDasharray="3 3" />
                <RechartsPrimitive.XAxis dataKey="label" tickLine={false} axisLine={false} />
                <RechartsPrimitive.YAxis tickLine={false} axisLine={false} width={48} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <RechartsPrimitive.Bar dataKey="volume" fill="#c25b3f" radius={[4, 4, 0, 0]} />
              </RechartsPrimitive.BarChart>
            </ChartContainer>
          </div>

          <div>
            <h2 className="font-display text-lg text-ink-900 mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-ink-400" /> Recordes pessoais
            </h2>
            <div className="space-y-2.5">
              {recordesOrdenados.map((r) => (
                <div key={r.exercicio_id} className="flex items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3.5">
                  <span className="font-medium">{r.nome}</span>
                  <div className="text-right">
                    <p className="font-mono font-semibold tabular-nums">{r.peso} kg{r.repeticoes ? ` x${r.repeticoes}` : ""}</p>
                    <p className="text-xs text-ink-400 mt-0.5">{formatDate(r.data)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
