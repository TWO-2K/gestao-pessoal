import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Star, ListChecks, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { dataLocalHoje, formatCurrency, formatDate } from "@/lib/format";
import { UNIDADES_COMPRA, totalItem, totalCompra } from "@/lib/compras";

const itemVazio = () => ({ nome: "", setor: "", quantidade: "1", unidade: "un", preco_unitario: "", comprado: false });

const estadoInicial = () => ({
  data: dataLocalHoje(),
  local: "",
  categoria_id: null,
  conta_pagamento_id: null,
  observacao: "",
  itens: [itemVazio()],
});

export default function CompraForm({ compra, categorias, contasPagamento, locaisConhecidos = [], produtos = [], comprasAnteriores = [], planejar = false, onSaved, onCancel }) {
  const [form, setForm] = useState(estadoInicial);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (compra) {
      setForm({
        data: compra.data,
        local: compra.local,
        categoria_id: compra.categoria_id ?? null,
        conta_pagamento_id: compra.conta_pagamento_id,
        observacao: compra.observacao || "",
        itens: compra.itens.length
          ? compra.itens.map((it) => ({
              nome: it.nome,
              setor: it.setor || "",
              quantidade: String(it.quantidade),
              unidade: it.unidade || "un",
              preco_unitario: Number(it.preco_unitario) ? String(it.preco_unitario) : "",
              comprado: !!it.comprado,
            }))
          : [itemVazio()],
      });
    } else {
      setForm(estadoInicial());
    }
  }, [compra]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setItem = (index, k, v) =>
    setForm((f) => ({ ...f, itens: f.itens.map((it, i) => (i === index ? { ...it, [k]: v } : it)) }));
  const addItem = () => setForm((f) => ({ ...f, itens: [...f.itens, itemVazio()] }));
  const removeItem = (index) =>
    setForm((f) => ({ ...f, itens: f.itens.length > 1 ? f.itens.filter((_, i) => i !== index) : f.itens }));

  const total = useMemo(() => totalCompra(form.itens), [form.itens]);

  // Catálogo do mercado escolhido (se não houver, usa todos), favoritos primeiro e sem nomes repetidos.
  const sugestoes = useMemo(() => {
    const doLocal = produtos.filter((p) => p.local === form.local.trim());
    const base = doLocal.length ? doLocal : produtos;
    const porNome = new Map();
    for (const p of base) {
      const atual = porNome.get(p.nome.toLowerCase());
      if (!atual || (p.favorito && !atual.favorito)) porNome.set(p.nome.toLowerCase(), p);
    }
    return [...porNome.values()].sort(
      (a, b) => Number(!!b.favorito) - Number(!!a.favorito) || a.nome.localeCompare(b.nome)
    );
  }, [produtos, form.local]);

  const favoritos = useMemo(() => sugestoes.filter((p) => p.favorito), [sugestoes]);

  // Ao digitar/escolher um produto do catálogo, já preenche o setor.
  const setNomeItem = (index, nome) =>
    setForm((f) => {
      const achado = sugestoes.find((p) => p.nome.toLowerCase() === nome.trim().toLowerCase());
      return {
        ...f,
        itens: f.itens.map((it, i) =>
          i === index ? { ...it, nome, setor: it.setor || achado?.setor || "" } : it
        ),
      };
    });

  const addFavorito = (p) =>
    setForm((f) => {
      if (f.itens.some((it) => it.nome.trim().toLowerCase() === p.nome.toLowerCase())) return f;
      const novo = { ...itemVazio(), nome: p.nome, setor: p.setor || "" };
      const semVazio = f.itens.filter((it) => it.nome.trim() || it.preco_unitario);
      return { ...f, itens: [...semVazio, novo] };
    });

  // Junta vários itens de uma vez, sem repetir nomes e descartando linhas em branco.
  const addVarios = (novos) =>
    setForm((f) => {
      const existentes = new Set(f.itens.map((it) => it.nome.trim().toLowerCase()));
      const unicos = novos.filter((n) => !existentes.has(n.nome.trim().toLowerCase()));
      const base = f.itens.filter((it) => it.nome.trim() || it.preco_unitario);
      return { ...f, itens: [...base, ...unicos.map((n) => ({ ...itemVazio(), ...n }))] };
    });

  // Compras anteriores do mesmo mercado (ou todas, se o mercado ainda não foi informado).
  const anteriores = useMemo(() => {
    const local = form.local.trim().toLowerCase();
    return comprasAnteriores
      .filter((c) => c.id !== compra?.id && c.itens.length && (!local || c.local.trim().toLowerCase() === local))
      .slice(0, 15);
  }, [comprasAnteriores, form.local, compra?.id]);

  const copiarCompra = (id) => {
    const origem = comprasAnteriores.find((c) => c.id === id);
    if (!origem) return;
    addVarios(
      origem.itens.map((it) => ({
        nome: it.nome,
        setor: it.setor || "",
        quantidade: String(it.quantidade),
        unidade: it.unidade || "un",
        preco_unitario: !planejar && Number(it.preco_unitario) ? String(it.preco_unitario) : "",
      }))
    );
    if (!form.local.trim()) set("local", origem.local);
  };

  const [catAberto, setCatAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [marcados, setMarcados] = useState(() => new Set());

  const catalogoAgrupado = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const mapa = new Map();
    for (const p of sugestoes) {
      if (q && !p.nome.toLowerCase().includes(q)) continue;
      const setor = p.setor || "Sem setor";
      if (!mapa.has(setor)) mapa.set(setor, []);
      mapa.get(setor).push(p);
    }
    return [...mapa.entries()].sort(([a], [b]) => (a === "Sem setor") - (b === "Sem setor") || a.localeCompare(b));
  }, [sugestoes, busca]);

  const toggleMarcado = (nome) =>
    setMarcados((s) => {
      const novo = new Set(s);
      novo.has(nome) ? novo.delete(nome) : novo.add(nome);
      return novo;
    });

  const adicionarMarcados = () => {
    addVarios(sugestoes.filter((p) => marcados.has(p.nome.toLowerCase())).map((p) => ({ nome: p.nome, setor: p.setor || "" })));
    setMarcados(new Set());
    setBusca("");
    setCatAberto(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const itensValidos = form.itens.filter((it) => it.nome.trim());
    if (!form.local.trim() || itensValidos.length === 0 || (!planejar && total <= 0)) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: planejar ? "Informe o mercado e ao menos um item." : "Informe o local e ao menos um item com preço.",
      });
      return;
    }

    setSaving(true);
    try {
      await onSaved({
        id: compra?.id,
        gasto_id: compra?.gasto_id,
        listaId: compra?.listaId,
        restantes: compra?.restantes,
        ...form,
        status: planejar ? "planejada" : "concluida",
        itens: itensValidos,
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="local">Local</Label>
          <Input
            id="local"
            list="locais-compra"
            value={form.local}
            onChange={(e) => set("local", e.target.value)}
            placeholder="Ex.: Atacadão"
            autoFocus
            required
          />
          <datalist id="locais-compra">
            {locaisConhecidos.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </div>
        <div className="space-y-2">
          <Label htmlFor="data">Data</Label>
          <Input id="data" type="date" value={form.data} onChange={(e) => set("data", e.target.value)} required />
        </div>
      </div>

      {!planejar && (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Categoria do gasto</Label>
          <Select value={form.categoria_id ?? undefined} onValueChange={(v) => set("categoria_id", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Ex.: Mercado" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Conta/Cartão</Label>
          <Select value={form.conta_pagamento_id ?? undefined} onValueChange={(v) => set("conta_pagamento_id", v)}>
            <SelectTrigger>
              <SelectValue placeholder="De onde saiu?" />
            </SelectTrigger>
            <SelectContent>
              {contasPagamento.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Itens</Label>
          {!planejar && <span className="text-sm font-mono font-semibold tabular-nums">{formatCurrency(total)}</span>}
        </div>
        <datalist id="produtos-compra">
          {sugestoes.map((p) => <option key={p.id} value={p.nome} />)}
        </datalist>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setCatAberto((v) => !v)} aria-expanded={catAberto}>
            <ListChecks className="h-4 w-4 mr-1" /> Escolher do catálogo
          </Button>
          {anteriores.length > 0 && (
            <Select value="" onValueChange={copiarCompra}>
              <SelectTrigger aria-label="Copiar de compra anterior" className="h-9 w-auto gap-2 text-sm">
                <Copy className="h-4 w-4" />
                <SelectValue placeholder="Copiar de compra anterior" />
              </SelectTrigger>
              <SelectContent>
                {anteriores.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.local} · {formatDate(c.data)} · {c.itens.length} {c.itens.length === 1 ? "item" : "itens"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {catAberto && (
          <div className="rounded-lg border border-ink-200 p-3 space-y-3">
            <Input
              aria-label="Buscar no catálogo"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produto..."
            />
            <div className="max-h-64 overflow-y-auto space-y-3">
              {catalogoAgrupado.length === 0 && <p className="text-xs text-ink-400">Nenhum produto encontrado.</p>}
              {catalogoAgrupado.map(([setor, lista]) => (
                <div key={setor}>
                  <h4 className="text-xs font-medium uppercase tracking-wide text-ink-400 mb-1">{setor}</h4>
                  <div className="grid sm:grid-cols-2 gap-x-3">
                    {lista.map((p) => {
                      const chave = p.nome.toLowerCase();
                      const jaNaLista = form.itens.some((it) => it.nome.trim().toLowerCase() === chave);
                      return (
                        <label key={p.id} className={cn("flex items-center gap-2 py-1 text-sm cursor-pointer", jaNaLista && "opacity-50")}>
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-gold-500"
                            checked={jaNaLista || marcados.has(chave)}
                            disabled={jaNaLista}
                            onChange={() => toggleMarcado(chave)}
                          />
                          <span className="truncate">{p.nome}</span>
                          {p.favorito && <Star className="h-3 w-3 text-gold-500 fill-current flex-shrink-0" aria-hidden />}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setCatAberto(false)}>Fechar</Button>
              <Button type="button" size="sm" onClick={adicionarMarcados} disabled={marcados.size === 0}>
                Adicionar {marcados.size || ""} {marcados.size === 1 ? "item" : "itens"}
              </Button>
            </div>
          </div>
        )}
        {favoritos.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-gold-500 fill-current" aria-hidden />
            {favoritos.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addFavorito(p)}
                className="rounded-full bg-ink-100 px-2.5 py-1 text-xs text-ink-600 hover:bg-ink-200"
              >
                + {p.nome}
              </button>
            ))}
          </div>
        )}
        <div className="space-y-2">
          {form.itens.map((item, index) => (
            <div key={index} className="rounded-lg border border-ink-200 p-2.5 space-y-2">
              <div className="flex gap-2">
                <Input
                  aria-label="Item"
                  list="produtos-compra"
                  value={item.nome}
                  onChange={(e) => setNomeItem(index, e.target.value)}
                  placeholder="Item"
                />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  aria-label="Remover item"
                  className="p-2 text-ink-400 hover:text-rust-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className={planejar ? "grid grid-cols-1 gap-2" : "grid grid-cols-2 sm:grid-cols-3 gap-2"}>
                <div className="flex gap-1">
                  <Input
                    aria-label="Quantidade"
                    type="number"
                    step="0.001"
                    min="0"
                    value={item.quantidade}
                    onChange={(e) => setItem(index, "quantidade", e.target.value)}
                  />
                  <Select value={item.unidade} onValueChange={(v) => setItem(index, "unidade", v)}>
                    <SelectTrigger aria-label="Unidade" className="w-[72px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIDADES_COMPRA.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!planejar && (
                  <>
                    <Input
                      aria-label="Preço unitário"
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.preco_unitario}
                      onChange={(e) => setItem(index, "preco_unitario", e.target.value)}
                      placeholder="Preço un."
                    />
                    <div className="flex items-center justify-end text-sm font-mono tabular-nums text-ink-500">
                      {formatCurrency(totalItem(item))}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar item
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacao">Observação</Label>
        <Textarea
          id="observacao"
          value={form.observacao}
          onChange={(e) => set("observacao", e.target.value)}
          placeholder="Detalhes adicionais..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </form>
  );
}
