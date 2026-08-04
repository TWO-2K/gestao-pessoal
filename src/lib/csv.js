import { normalizarCabecalho } from "@/lib/text";

export function parseCSV(text) {
  const linhas = [];
  let campo = "";
  let linha = [];
  let dentroAspas = false;

  const normalizado = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < normalizado.length; i++) {
    const c = normalizado[i];

    if (dentroAspas) {
      if (c === '"') {
        if (normalizado[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          dentroAspas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') {
      dentroAspas = true;
    } else if (c === ",") {
      linha.push(campo);
      campo = "";
    } else if (c === "\n") {
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = "";
    } else {
      campo += c;
    }
  }
  if (campo !== "" || linha.length > 0) {
    linha.push(campo);
    linhas.push(linha);
  }

  const linhasNaoVazias = linhas.filter((l) => l.some((v) => v.trim() !== ""));
  if (linhasNaoVazias.length === 0) return [];

  const headers = linhasNaoVazias[0].map(normalizarCabecalho);
  return linhasNaoVazias.slice(1).map((valores) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (valores[idx] ?? "").trim();
    });
    return obj;
  });
}

function escapeCSV(valor) {
  const str = String(valor ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCSV(headers, linhas) {
  const linhaHeader = headers.join(",");
  const corpo = linhas.map((linha) => headers.map((h) => escapeCSV(linha[h])).join(","));
  return [linhaHeader, ...corpo].join("\n");
}

export function baixarCSV(nomeArquivo, conteudo) {
  const blob = new Blob(["﻿" + conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
