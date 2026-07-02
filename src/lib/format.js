export const formatCurrency = (value) =>
  (Number(value) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
};