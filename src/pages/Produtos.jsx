import React, { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import ProdutoForm from "@/components/ProdutoForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, MapPin, Package, Download, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { CATALOGO_PRODUTOS } from "@/lib/catalogoProdutos";
import { useProdutos } from "@/hooks/useProdutos";

const normalizar = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function Produtos() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busca, setBusca] = useState("");
  const [localFiltro, setLocalFiltro] = useState(null);

  const [importOpen, setImportOpen] = useState(false);
  const [importLocal, setImportLocal] = useState("");
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const [soFavoritos, setSoFavoritos] = useState(false);
  const { produtos, isLoading, saveProduto, importProdutos, toggleFavorito, deleteProduto } = useProdutos();

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importLocal.trim()) return;
    setImporting(true);
    try {
      await importProdutos({ local: importLocal, itens: CATALOGO_PRODUTOS });
      toast({ title: "Catálogo importado", description: `${CATALOGO_PRODUTOS.length} produtos em ${importLocal.trim()}.` });
      setImportOpen(false);
      setImportLocal("");
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao importar", description: error.message });
    } finally {
      setImporting(false);
    }
  };

  const locais = useMemo(() => [...new Set(produtos.map((p) => p.local))].sort(), [produtos]);

  const filtrados = useMemo(() => {
    const termo = normalizar(busca);
    return produtos.filter((p) => {
      if (localFiltro && p.local !== localFiltro) return false;
      if (soFavoritos && !p.favorito) return false;
      if (!termo) return true;
      return [p.nome, p.setor, p.corredor, p.prateleira, p.observacao].some((v) => normalizar(v).includes(termo));
    });
  }, [produtos, busca, localFiltro, soFavoritos]);

  // mercado -> setor -> produtos
  const grupos = useMemo(() => {
    const porLocal = new Map();
    for (const p of filtrados) {
      if (!porLocal.has(p.local)) porLocal.set(p.local, new Map());
      const setores = porLocal.get(p.local);
      const setor = p.setor || "Sem setor";
      if (!setores.has(setor)) setores.set(setor, []);
      setores.get(setor).push(p);
    }
    return [...porLocal.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtrados]);

  const handleSaved = async (form) => {
    await saveProduto(form);
    setOpen(false);
    setEditing(null);
  };

  const handleDelete = (p) => {
    if (window.confirm(`Remover "${p.nome}" de ${p.local}?`)) deleteProduto(p.id);
  };

  return (
    <div>
      <PageHeader
        title="Produtos"
        subtitle="Onde cada item fica no mercado"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Download className="h-4 w-4 mr-1.5" /> Importar catálogo
            </Button>
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="h-4 w-4 mr-1.5" /> Novo produto
            </Button>
          </div>
        }
      />

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produto, setor, corredor..."
          className="pl-9"
          aria-label="Buscar produto"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setSoFavoritos((v) => !v)}
          aria-pressed={soFavoritos}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors",
            soFavoritos ? "bg-gold-500 text-white" : "bg-ink-100 text-ink-500 hover:text-ink-900"
          )}
        >
          <Star className={cn("h-3.5 w-3.5", soFavoritos && "fill-current")} /> Favoritos
        </button>
        {locais.length > 1 && [null, ...locais].map((l) => (
            <button
              key={l ?? "todos"}
              type="button"
              onClick={() => setLocalFiltro(l)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition-colors",
                localFiltro === l ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-500 hover:text-ink-900"
              )}
            >
              {l ?? "Todos"}
            </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>{produtos.length === 0 ? "Nenhum produto cadastrado ainda." : "Nada encontrado."}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grupos.map(([local, setores]) => (
            <section key={local}>
              <h2 className="flex items-center gap-1.5 font-display text-xl mb-3">
                <MapPin className="h-4 w-4 text-ink-400" /> {local}
              </h2>
              <div className="space-y-4">
                {[...setores.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([setor, itens]) => (
                  <div key={setor}>
                    <h3 className="text-xs font-medium uppercase tracking-wide text-ink-400 mb-1.5">{setor}</h3>
                    <div className="space-y-2">
                      {[...itens].sort((a, b) => Number(!!b.favorito) - Number(!!a.favorito)).map((p) => (
                        <div key={p.id} className="group flex items-start gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{p.nome}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {p.corredor && (
                                <span className="rounded bg-ink-100 px-2 py-0.5 text-xs text-ink-600">Corredor {p.corredor}</span>
                              )}
                              {p.prateleira && (
                                <span className="rounded bg-ink-100 px-2 py-0.5 text-xs text-ink-600">Prateleira {p.prateleira}</span>
                              )}
                            </div>
                            {p.observacao && <p className="mt-1.5 text-xs text-ink-400">{p.observacao}</p>}
                          </div>
                          <button
                            onClick={() => toggleFavorito({ id: p.id, favorito: !p.favorito })}
                            aria-label={p.favorito ? "Remover dos favoritos" : "Marcar como favorito"}
                            aria-pressed={!!p.favorito}
                            className={cn("p-2", p.favorito ? "text-gold-500" : "text-ink-300 hover:text-gold-500")}
                          >
                            <Star className={cn("h-4 w-4", p.favorito && "fill-current")} />
                          </button>
                          <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditing(p); setOpen(true); }}
                              aria-label="Editar produto"
                              className="p-2 text-ink-400 hover:text-ink-900"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              aria-label="Excluir produto"
                              className="p-2 text-ink-400 hover:text-rust-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Importar catálogo</DialogTitle></DialogHeader>
          <form onSubmit={handleImport} className="space-y-4">
            <p className="text-sm text-ink-500">
              Cadastra {CATALOGO_PRODUTOS.length} produtos de uso residencial (só nome e setor) no mercado abaixo.
              Corredor e prateleira ficam em branco. Produtos que já existem são ignorados.
            </p>
            <Input
              value={importLocal}
              onChange={(e) => setImportLocal(e.target.value)}
              list="locais-import"
              placeholder="Mercado. Ex.: Atacadão"
              aria-label="Mercado"
              required
              autoFocus
            />
            <datalist id="locais-import">
              {locais.map((l) => <option key={l} value={l} />)}
            </datalist>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setImportOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={importing}>{importing ? "Importando..." : "Importar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
          <ProdutoForm
            produto={editing}
            locaisConhecidos={locais}
            localPadrao={localFiltro || ""}
            onSaved={handleSaved}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
