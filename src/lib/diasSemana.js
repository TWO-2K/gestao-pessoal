export const DIAS_SEMANA = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

export const diasSemanaLabel = (dias = []) =>
  DIAS_SEMANA.filter((d) => dias.includes(d.value))
    .map((d) => d.label)
    .join(", ") || "—";
