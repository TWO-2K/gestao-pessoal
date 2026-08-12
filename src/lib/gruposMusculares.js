export const GRUPOS_MUSCULARES = [
  { value: "peito", label: "Peito" },
  { value: "costas", label: "Costas" },
  { value: "pernas", label: "Pernas" },
  { value: "ombros", label: "Ombros" },
  { value: "biceps", label: "Bíceps" },
  { value: "triceps", label: "Tríceps" },
  { value: "abdomen", label: "Abdômen" },
  { value: "cardio", label: "Cardio" },
  { value: "corpo_inteiro", label: "Corpo inteiro" },
  { value: "outro", label: "Outro" },
];

export const grupoMuscularLabel = (value) =>
  GRUPOS_MUSCULARES.find((g) => g.value === value)?.label || value || "—";
