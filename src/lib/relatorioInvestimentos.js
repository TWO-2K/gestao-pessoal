import * as XLSX from "xlsx";
import { TIPOS_ATIVO, aindaPrevisto } from "@/lib/investimentos";

const MOEDA = '"R$" #,##0.00';
const PERCENTUAL = '0.0"%"';
const tipoLabel = (v) => TIPOS_ATIVO.find((t) => t.value === v)?.label || v;
const dataBr = (iso) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "");
const variacao = (atual, anterior) => (atual && anterior ? ((atual - anterior) / anterior) * 100 : null);

// Monta uma aba a partir de linhas de objetos; `formatos` define o formato numérico por coluna
function criarAba(linhas, formatos = {}) {
  const ws = XLSX.utils.json_to_sheet(linhas);
  const colunas = Object.keys(linhas[0] || {});
  ws["!cols"] = colunas.map((c) => ({ wch: Math.max(c.length, ...linhas.map((l) => String(l[c] ?? "").length)) + 2 }));
  linhas.forEach((_, i) => {
    colunas.forEach((c, j) => {
      const cel = ws[XLSX.utils.encode_cell({ r: i + 1, c: j })];
      if (cel && formatos[c] && typeof cel.v === "number") cel.z = formatos[c];
    });
  });
  return ws;
}

/**
 * Gera e baixa o relatório de investimentos (.xlsx) com as abas Resumo, Carteira, Aportes e Proventos.
 * `carteira` já vem com posição calculada (cotas, investido, precoMedio, valorAtual, pctMeta).
 */
export function baixarRelatorioInvestimentos({ carteira, aportes, proventos, ativoMap, totais }) {
  const ticker = (id) => ativoMap[id]?.ticker || "";

  const resumo = [
    { Indicador: "Investido", Valor: totais.investido, formato: MOEDA },
    { Indicador: "Valor atual", Valor: totais.valorAtual, formato: MOEDA },
    { Indicador: "Resultado", Valor: totais.valorAtual - totais.investido, formato: MOEDA },
    { Indicador: "Resultado (%)", Valor: totais.investido > 0 ? ((totais.valorAtual - totais.investido) / totais.investido) * 100 : null, formato: PERCENTUAL },
    { Indicador: "Proventos recebidos", Valor: totais.recebido, formato: MOEDA },
    { Indicador: "Total de cotas", Valor: totais.cotas, formato: "#,##0.####" },
  ];
  const wsResumo = criarAba(resumo.map(({ formato, ...l }) => l));
  resumo.forEach((l, i) => { const cel = wsResumo[`B${i + 2}`]; if (cel) cel.z = l.formato; });
  wsResumo["!cols"] = [{ wch: 24 }, { wch: 18 }];

  const wsCarteira = criarAba(
    carteira.map((a) => {
      const resultado = a.valorAtual != null ? a.valorAtual - a.investido : null;
      return {
        Ativo: a.ticker,
        Tipo: tipoLabel(a.tipo),
        Situação: a.inativo ? "Inativo" : "Em uso",
        Cotas: a.cotas,
        "Preço médio": a.precoMedio,
        Investido: a.investido,
        "Cotação hoje": a.cotacao_atual,
        "Cotação 7d": a.cotacao_7d,
        "Cotação 30d": a.cotacao_30d,
        "Cotação 90d": a.cotacao_90d,
        "Var. 7d (%)": variacao(a.cotacao_atual, a.cotacao_7d),
        "Var. 30d (%)": variacao(a.cotacao_atual, a.cotacao_30d),
        "Var. 90d (%)": variacao(a.cotacao_atual, a.cotacao_90d),
        "Valor atual": a.valorAtual,
        Resultado: resultado,
        "Resultado (%)": resultado != null && a.investido > 0 ? (resultado / a.investido) * 100 : null,
        "Valor teto": a.preco_teto,
        "Abaixo do teto": a.preco_teto && a.cotacao_atual ? (a.cotacao_atual <= a.preco_teto ? "Sim" : "Não") : "",
        "Meta (cotas)": a.meta_cotas,
        "Meta (%)": a.pctMeta,
      };
    }),
    {
      Cotas: "#,##0.####", "Preço médio": MOEDA, Investido: MOEDA, "Cotação hoje": MOEDA, "Cotação 7d": MOEDA, "Cotação 30d": MOEDA, "Cotação 90d": MOEDA,
      "Var. 7d (%)": PERCENTUAL, "Var. 30d (%)": PERCENTUAL, "Var. 90d (%)": PERCENTUAL, "Valor atual": MOEDA, Resultado: MOEDA,
      "Resultado (%)": PERCENTUAL, "Valor teto": MOEDA, "Meta (%)": PERCENTUAL,
    }
  );

  const wsAportes = criarAba(
    aportes.map((ap) => ({
      Data: dataBr(ap.data),
      Ativo: ticker(ap.ativo_id),
      Operação: ap.tipo === "venda" ? "Venda" : "Compra",
      Status: ap.status === "planejado" ? "Planejado" : "Realizado",
      Quantidade: Number(ap.quantidade),
      Preço: Number(ap.preco),
      Total: Number(ap.quantidade) * Number(ap.preco),
    })),
    { Quantidade: "#,##0.####", Preço: MOEDA, Total: MOEDA }
  );

  const wsProventos = criarAba(
    proventos.map((pv) => ({ Data: dataBr(pv.data), Ativo: ticker(pv.ativo_id), Tipo: pv.tipo, Situação: aindaPrevisto(pv) ? "Previsto" : "Recebido", Valor: Number(pv.valor) })),
    { Valor: MOEDA }
  );

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");
  XLSX.utils.book_append_sheet(wb, wsCarteira, "Carteira");
  XLSX.utils.book_append_sheet(wb, wsAportes, "Aportes");
  XLSX.utils.book_append_sheet(wb, wsProventos, "Proventos");

  const hoje = new Date();
  const dia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  XLSX.writeFile(wb, `Relatorio de Investimentos ${dia}.xlsx`);
}
