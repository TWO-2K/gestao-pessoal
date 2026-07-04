import React, { useMemo, useState } from "react";
import * as RechartsPrimitive from "recharts";
import PageHeader from "@/components/PageHeader";
import MonthFilter, { isInMonth } from "@/components/MonthFilter";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatCurrency, formatDate } from "@/lib/format";
import { useContas } from "@/hooks/useContas";
import { useGastos } from "@/hooks/useGastos";
import { useDividas } from "@/hooks/useDividas";
import { useCategorias } from "@/hooks/useCategorias";
import { TrendingUp, PieChart as PieChartIcon, Trophy } from "lucide-react";

const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function Relatorios() {
  const now = new Date();
  const [mes, setMes] = useState({ month: now.getMonth(), year: now.getFullYear() });

  const { contas, isLoading: isLoadingContas } = useContas();
  const { gastos, isLoading: isLoadingGastos } = useGastos();
  const { dividas, parcelas, isLoading: isLoadingDividas } = useDividas();
  const { categorias, isLoading: isLoadingCategorias } = useCategorias();

  const isLoading = isLoadingContas || isLoadingGastos || isLoadingDividas || isLoadingCategorias;

  const catMap = useMemo(() => Object.fromEntries(categorias.map((c) => [c.id, c])), [categorias]);

  const contasDoMes = useMemo(
    () => contas.filter((c) => isInMonth(c.vencimento, mes.month, mes.year)),
    [contas, mes]
  );
  const gastosDoMes = useMemo(
    () => gastos.filter((g) => isInMonth(g.data, mes.month, mes.year)),
    [gastos, mes]
  );
  const parcelasDoMes = useMemo(
    () => parcelas.filter((p) => isInMonth(p.data_recebimento, mes.month, mes.year)),
    [parcelas, mes]
  );

  const totalPago = useMemo(
    () => contasDoMes.filter((c) => c.status === "pago").reduce((s, c) => s + (c.valor || 0), 0),
    [contasDoMes]
  );
  const totalPendente = useMemo(
    () => contasDoMes.filter((c) => c.status === "pendente").reduce((s, c) => s + (c.valor || 0), 0),
    [contasDoMes]
  );
  const totalRecebido = useMemo(
    () => parcelasDoMes.reduce((s, p) => s + (p.valor || 0), 0),
    [parcelasDoMes]
  );

  const pagoPendenteData = useMemo(() => ([
    { name: "Pago", value: totalPago, fill: "#3f7a4f" },
    { name: "Pendente", value: totalPendente, fill: "#c25b3f" },
  ]), [totalPago, totalPendente]);

  const gastosPorCategoria = useMemo(() => {
    const totals = {};
    const add = (categoriaId, valor) => {
      const key = categoriaId || "sem-categoria";
      totals[key] = (totals[key] || 0) + (valor || 0);
    };

    contasDoMes.filter((c) => c.status === "pago").forEach((c) => add(c.categoria_id, c.valor));
    gastosDoMes.forEach((g) => add(g.categoria_id, g.valor));

    return Object.entries(totals)
      .map(([categoriaId, total]) => ({
        categoriaId,
        name: catMap[categoriaId]?.nome || "Sem categoria",
        value: total,
        fill: catMap[categoriaId]?.cor || "#a3a3a3",
      }))
      .sort((a, b) => b.value - a.value);
  }, [contasDoMes, gastosDoMes, catMap]);

  const recebimentosPorMes = useMemo(() => {
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(mes.year, mes.month - i, 1);
      meses.push({ month: d.getMonth(), year: d.getFullYear() });
    }
    return meses.map(({ month, year }) => ({
      label: `${MESES_ABREV[month]}/${String(year).slice(2)}`,
      total: parcelas
        .filter((p) => isInMonth(p.data_recebimento, month, year))
        .reduce((s, p) => s + (p.valor || 0), 0),
    }));
  }, [parcelas, mes]);

  const contasPagasPorMes = useMemo(() => {
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(mes.year, mes.month - i, 1);
      meses.push({ month: d.getMonth(), year: d.getFullYear() });
    }
    return meses.map(({ month, year }) => ({
      label: `${MESES_ABREV[month]}/${String(year).slice(2)}`,
      total: contas
        .filter((c) => c.status === "pago" && isInMonth(c.vencimento, month, year))
        .reduce((s, c) => s + (c.valor || 0), 0),
    }));
  }, [contas, mes]);

  const maioresGastos = useMemo(() => {
    const itens = [
      ...contasDoMes.filter((c) => c.status === "pago").map((c) => ({
        id: `conta-${c.id}`,
        descricao: c.descricao,
        valor: c.valor,
        data: c.vencimento,
        categoria: catMap[c.categoria_id],
      })),
      ...gastosDoMes.map((g) => ({
        id: `gasto-${g.id}`,
        descricao: g.descricao,
        valor: g.valor,
        data: g.data,
        categoria: catMap[g.categoria_id],
      })),
    ];
    return itens.sort((a, b) => (b.valor || 0) - (a.valor || 0)).slice(0, 10);
  }, [contasDoMes, gastosDoMes, catMap]);

  if (isLoading) return <div className="text-ink-400 text-sm">Carregando...</div>;

  return (
    <div>
      <PageHeader title="Relatórios" subtitle="Visão detalhada do seu mês" />

      <div className="mb-6">
        <MonthFilter value={mes} onChange={setMes} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl bg-ink-900 text-white p-5">
          <p className="text-ink-50/50 text-xs uppercase tracking-[0.12em] mb-3">Total pago</p>
          <p className="font-display text-2xl font-medium tabular-nums">{formatCurrency(totalPago)}</p>
        </div>
        <div className="rounded-2xl bg-rust-600 text-white p-5">
          <p className="text-rust-100/70 text-xs uppercase tracking-[0.12em] mb-3">Total pendente</p>
          <p className="font-display text-2xl font-medium tabular-nums">{formatCurrency(totalPendente)}</p>
        </div>
        <div className="rounded-2xl bg-forest-600 text-white p-5">
          <p className="text-forest-100/70 text-xs uppercase tracking-[0.12em] mb-3">Total recebido</p>
          <p className="font-display text-2xl font-medium tabular-nums">{formatCurrency(totalRecebido)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="font-display text-lg text-ink-900 mb-3 flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-ink-400" /> Contas pagas x pendentes
          </h2>
          {totalPago === 0 && totalPendente === 0 ? (
            <div className="rounded-xl border border-ink-200 bg-white px-5 py-8 text-center text-ink-400">
              <p className="text-sm">Nenhuma conta neste mês.</p>
            </div>
          ) : (
            <ChartContainer config={{}} className="mx-auto max-h-[260px]">
              <RechartsPrimitive.PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <RechartsPrimitive.Pie data={pagoPendenteData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {pagoPendenteData.map((entry) => (
                    <RechartsPrimitive.Cell key={entry.name} fill={entry.fill} />
                  ))}
                </RechartsPrimitive.Pie>
              </RechartsPrimitive.PieChart>
            </ChartContainer>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg text-ink-900 mb-3 flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-ink-400" /> Gastos por categoria
          </h2>
          {gastosPorCategoria.length === 0 ? (
            <div className="rounded-xl border border-ink-200 bg-white px-5 py-8 text-center text-ink-400">
              <p className="text-sm">Nenhum gasto ou conta paga neste mês.</p>
            </div>
          ) : (
            <ChartContainer config={{}} className="mx-auto max-h-[260px]">
              <RechartsPrimitive.PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <RechartsPrimitive.Pie data={gastosPorCategoria} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {gastosPorCategoria.map((entry) => (
                    <RechartsPrimitive.Cell key={entry.categoriaId} fill={entry.fill} />
                  ))}
                </RechartsPrimitive.Pie>
              </RechartsPrimitive.PieChart>
            </ChartContainer>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="font-display text-lg text-ink-900 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-ink-400" /> Contas pagas (últimos 6 meses)
        </h2>
        <ChartContainer config={{}} className="max-h-[260px] w-full">
          <RechartsPrimitive.BarChart data={contasPagasPorMes}>
            <RechartsPrimitive.CartesianGrid vertical={false} strokeDasharray="3 3" />
            <RechartsPrimitive.XAxis dataKey="label" tickLine={false} axisLine={false} />
            <RechartsPrimitive.YAxis tickLine={false} axisLine={false} width={40} />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <RechartsPrimitive.Bar dataKey="total" fill="#c25b3f" radius={4} />
          </RechartsPrimitive.BarChart>
        </ChartContainer>
      </div>

      <div className="mb-8">
        <h2 className="font-display text-lg text-ink-900 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-ink-400" /> Recebimentos (últimos 6 meses)
        </h2>
        <ChartContainer config={{}} className="max-h-[260px] w-full">
          <RechartsPrimitive.BarChart data={recebimentosPorMes}>
            <RechartsPrimitive.CartesianGrid vertical={false} strokeDasharray="3 3" />
            <RechartsPrimitive.XAxis dataKey="label" tickLine={false} axisLine={false} />
            <RechartsPrimitive.YAxis tickLine={false} axisLine={false} width={40} />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <RechartsPrimitive.Bar dataKey="total" fill="#3f7a4f" radius={4} />
          </RechartsPrimitive.BarChart>
        </ChartContainer>
      </div>

      <div>
        <h2 className="font-display text-lg text-ink-900 mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-ink-400" /> Maiores gastos do mês
        </h2>
        {maioresGastos.length === 0 ? (
          <div className="rounded-xl border border-ink-200 bg-white px-5 py-8 text-center text-ink-400">
            <p className="text-sm">Nenhum gasto ou conta paga neste mês.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-ink-200 bg-white divide-y divide-ink-100 overflow-hidden">
            {maioresGastos.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.categoria?.cor || "#a3a3a3" }}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-ink-900 truncate">{item.descricao}</p>
                    <p className="text-xs text-ink-400 font-mono">{formatDate(item.data)}</p>
                  </div>
                </div>
                <p className="flex-shrink-0 font-mono font-semibold tabular-nums text-ink-800">{formatCurrency(item.valor)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
