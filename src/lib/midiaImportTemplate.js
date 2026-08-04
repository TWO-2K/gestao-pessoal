import * as XLSX from "xlsx";
import { toCSV } from "@/lib/csv";

export const COLUNAS_IMPORT = [
  "titulo",
  "tipo",
  "status",
  "episodio_atual",
  "ano",
  "genero",
  "observacoes",
  "midia_pai",
];

export const TIPOS_VALIDOS = ["anime", "ova", "ona", "filme", "especial", "serie"];
export const STATUS_VALIDOS = ["planejado", "assistindo", "concluido", "pausado", "abandonado"];

const LINHAS_EXEMPLO = [
  { titulo: "One Piece", tipo: "anime", status: "assistindo", episodio_atual: "1085", ano: "1999", genero: "Ação; Aventura; Comédia", observacoes: "", midia_pai: "" },
  { titulo: "One Piece Film Red", tipo: "filme", status: "concluido", episodio_atual: "", ano: "2022", genero: "Ação; Aventura", observacoes: "", midia_pai: "One Piece" },
  { titulo: "Naruto", tipo: "anime", status: "concluido", episodio_atual: "220", ano: "2002", genero: "Ação; Aventura", observacoes: "", midia_pai: "" },
  { titulo: "Naruto Shippuden", tipo: "anime", status: "concluido", episodio_atual: "500", ano: "2007", genero: "Ação; Aventura", observacoes: "", midia_pai: "Naruto" },
  { titulo: "Bleach", tipo: "anime", status: "concluido", episodio_atual: "366", ano: "2004", genero: "Ação; Sobrenatural", observacoes: "", midia_pai: "" },
  { titulo: "Bleach: Thousand-Year Blood War", tipo: "anime", status: "assistindo", episodio_atual: "27", ano: "2022", genero: "Ação; Sobrenatural", observacoes: "", midia_pai: "Bleach" },
  { titulo: "Attack on Titan", tipo: "anime", status: "concluido", episodio_atual: "25", ano: "2013", genero: "Ação; Drama", observacoes: "Sem OVAs ou filmes vinculados", midia_pai: "" },
];

export function gerarTemplateCSV() {
  return toCSV(COLUNAS_IMPORT, LINHAS_EXEMPLO);
}

export function baixarTemplateXLSX(nomeArquivo = "modelo_lista_midias.xlsx") {
  const linhas = LINHAS_EXEMPLO.map((l) => COLUNAS_IMPORT.reduce((obj, col) => ({ ...obj, [col]: l[col] }), {}));
  const planilha = XLSX.utils.json_to_sheet(linhas, { header: COLUNAS_IMPORT });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, planilha, "Modelo");
  XLSX.writeFile(workbook, nomeArquivo);
}
