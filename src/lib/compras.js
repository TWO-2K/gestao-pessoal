export const SETORES_COMPRA = [
  "Hortifruti",
  "Açougue",
  "Padaria",
  "Laticínios",
  "Mercearia",
  "Bebidas",
  "Limpeza",
  "Higiene",
  "Congelados",
  "Pet",
  "Outros",
];

export const UNIDADES_COMPRA = ["un", "kg", "g", "L", "ml", "pct", "cx"];

export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const totalItem = (item) =>
  round2((parseFloat(item.quantidade) || 0) * (parseFloat(item.preco_unitario) || 0));

export const totalCompra = (itens) => round2(itens.reduce((sum, it) => sum + totalItem(it), 0));

const chaveProduto = (local, nome) => `${(local || "").trim().toLowerCase()}|${(nome || "").trim().toLowerCase()}`;

/** Índice para achar o produto (setor/corredor/prateleira) pelo mercado + nome. */
export function indexarProdutos(produtos) {
  const exato = new Map();
  const porNome = new Map();
  for (const p of produtos) {
    exato.set(chaveProduto(p.local, p.nome), p);
    const n = p.nome.trim().toLowerCase();
    // Prefere o que tem corredor/prateleira preenchido quando o nome repete em outro mercado.
    const atual = porNome.get(n);
    if (!atual || (!(atual.corredor || atual.prateleira) && (p.corredor || p.prateleira))) porNome.set(n, p);
  }
  return (local, nome) => exato.get(chaveProduto(local, nome)) || porNome.get((nome || "").trim().toLowerCase()) || null;
}

/** Agrupa itens por setor (Sem setor por último) usando o catálogo de Produtos. */
export function agruparPorSetor(itens, local, achar) {
  const mapa = new Map();
  for (const it of itens) {
    const p = achar(local, it.nome);
    const setor = p?.setor || it.setor || "Sem setor";
    if (!mapa.has(setor)) mapa.set(setor, []);
    mapa.get(setor).push({ ...it, produto: p });
  }
  return [...mapa.entries()].sort(([a], [b]) => {
    if (a === "Sem setor") return 1;
    if (b === "Sem setor") return -1;
    return a.localeCompare(b);
  });
}

/** Soma `total` agrupando por `chave(item)`; retorna [{ nome, total }] ordenado desc. */
export function agruparTotais(itens, chave) {
  const mapa = new Map();
  for (const it of itens) {
    const k = chave(it) || "Sem setor";
    mapa.set(k, (mapa.get(k) || 0) + (Number(it.total) || 0));
  }
  return [...mapa.entries()]
    .map(([nome, total]) => ({ nome, total: round2(total) }))
    .sort((a, b) => b.total - a.total);
}
