export const formatCurrency = (value) =>
  (Number(value) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// new Date().toISOString() usa UTC — à noite no Brasil (UTC-3) isso já é o dia
// seguinte. Usar os componentes locais evita "pular" pro dia errado depois das 21h.
export const dataLocalHoje = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
};