import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Search, CalendarRange, CheckCircle2, Circle, Link as LinkIcon, Shuffle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlannerEventosFuturos } from "@/hooks/usePlannerEventosFuturos";
import { useToast } from "@/components/ui/use-toast";
import EventoFuturoForm from "./EventoFuturoForm";

function parseDateLocal(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatData(dataEvento) {
  return parseDateLocal(dataEvento).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function primeiroLink(links) {
  if (!links) return null;
  const match = links.match(/https?:\/\/\S+/);
  if (!match) return null;
  return match[0];
}

function toDateStr(ano, mes, dia) {
  const mm = String(mes + 1).padStart(2, "0");
  const dd = String(dia).padStart(2, "0");
  return `${ano}-${mm}-${dd}`;
}

function diasFimDeSemanaNoMes(ano, mes) {
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const dias = [];
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const diaSemana = new Date(ano, mes, dia).getDay();
    if (diaSemana === 0 || diaSemana === 5 || diaSemana === 6) dias.push(dia);
  }
  return dias;
}

function amanha() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function sortearFimDeSemanaAPartir(ano, mes, dataMinima) {
  let a = ano;
  let m = mes;
  while (true) {
    const dias = diasFimDeSemanaNoMes(a, m).filter((dia) => new Date(a, m, dia) >= dataMinima);
    if (dias.length > 0) {
      if (dias.includes(12)) return toDateStr(a, m, 12);
      const dia = dias[Math.floor(Math.random() * dias.length)];
      return toDateStr(a, m, dia);
    }
    m += 1;
    if (m > 11) { m = 0; a += 1; }
  }
}

function EventoFuturoItem({ evento, onToggle, onEdit, onSortear }) {
  const concluido = evento.status === "concluido";
  const link = primeiroLink(evento.links);
  return (
    <div
      className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-white transition-colors cursor-pointer"
      onClick={() => onEdit(evento)}
    >
      <Checkbox
        checked={concluido}
        onCheckedChange={() => onToggle(evento)}
        onClick={(e) => e.stopPropagation()}
        className="flex-shrink-0"
      />
      <div className="flex-1 min-w-0 flex items-baseline gap-2">
        <p className={cn("text-sm font-medium text-ink-900 truncate", concluido && "line-through text-ink-400")}>
          {evento.titulo}
        </p>
        <span className="inline-flex items-center gap-1 text-[11px] text-ink-400 flex-shrink-0">
          <CalendarRange className="h-3 w-3" />
          {formatData(evento.data_evento)}
        </span>
        {evento.descricao && (
          <p className="text-xs text-ink-400 truncate hidden sm:block">{evento.descricao}</p>
        )}
      </div>
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-ink-300 hover:text-ink-900 flex-shrink-0"
          title={link}
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </a>
      )}
      {!concluido && (
        <button
          onClick={(e) => { e.stopPropagation(); onSortear(evento); }}
          title="Sortear nova data no mês"
          className="p-1 text-ink-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hover:text-ink-900"
        >
          <Shuffle className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(evento); }}
        className="p-1 text-ink-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hover:text-ink-900"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

const FILTROS = [
  { value: "pendentes", label: "Pendentes" },
  { value: "concluidos", label: "Concluídos" },
  { value: "todos", label: "Todos" },
];

export default function EventosFuturosList() {
  const { eventos, isLoading, createOrUpdateEvento, deleteEventoAsync, updateStatus } = usePlannerEventosFuturos();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("pendentes");
  const [distribuindo, setDistribuindo] = useState(false);
  const { toast } = useToast();

  const openNovo = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdicao = (evento) => {
    setEditing(evento);
    setOpen(true);
  };

  const handleSaved = async (payload) => {
    const dataAnterior = editing?.data_evento;
    const conflito = eventos.find(
      (e) => e.data_evento === payload.data_evento && e.id !== payload.id
    );
    if (conflito && dataAnterior && dataAnterior !== payload.data_evento) {
      await createOrUpdateEvento({ ...conflito, id: conflito.id, data_evento: dataAnterior });
      await createOrUpdateEvento(payload);
      toast({ title: "Datas trocadas", description: `"${conflito.titulo}" foi para ${dataAnterior.split("-").reverse().join("/")}.` });
    } else {
      await createOrUpdateEvento(payload);
    }
    setOpen(false);
    setEditing(null);
  };

  const handleDelete = async (evento) => {
    if (!window.confirm(`Excluir "${evento.titulo}"?`)) return;
    try {
      await deleteEventoAsync(evento.id);
      setOpen(false);
      setEditing(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
    }
  };

  const toggleConcluido = (evento) => {
    updateStatus({ id: evento.id, status: evento.status === "concluido" ? "pendente" : "concluido" });
  };

  const handleSortear = async (evento) => {
    const [ano, mes] = evento.data_evento.split("-").map(Number);
    const novaData = sortearFimDeSemanaAPartir(ano, mes - 1, amanha());
    const conflito = eventos.find((e) => e.data_evento === novaData && e.id !== evento.id);
    if (conflito) {
      await createOrUpdateEvento({ ...conflito, data_evento: evento.data_evento });
    }
    await createOrUpdateEvento({ ...evento, data_evento: novaData });
  };

  const handleDistribuir = async () => {
    const pendentes = [...eventos.filter((e) => e.status !== "concluido")];
    if (pendentes.length === 0) return;
    for (let i = pendentes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pendentes[i], pendentes[j]] = [pendentes[j], pendentes[i]];
    }
    setDistribuindo(true);
    try {
      const dataMinima = amanha();
      let ano = dataMinima.getFullYear();
      let mes = dataMinima.getMonth();
      for (const evento of pendentes) {
        const novaData = sortearFimDeSemanaAPartir(ano, mes, dataMinima);
        await createOrUpdateEvento({ ...evento, data_evento: novaData });
        mes += 1;
        if (mes > 11) { mes = 0; ano += 1; }
      }
      toast({ title: "Distribuição concluída", description: `${pendentes.length} evento${pendentes.length === 1 ? "" : "s"} redistribuído${pendentes.length === 1 ? "" : "s"}.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao distribuir", description: error.message });
    } finally {
      setDistribuindo(false);
    }
  };

  const totalPendentes = eventos.filter((e) => e.status !== "concluido").length;
  const totalConcluidos = eventos.length - totalPendentes;

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return eventos
      .filter((evento) => {
        if (filtro === "pendentes" && evento.status === "concluido") return false;
        if (filtro === "concluidos" && evento.status !== "concluido") return false;
        if (!termo) return true;
        return (
          evento.titulo?.toLowerCase().includes(termo) ||
          evento.descricao?.toLowerCase().includes(termo)
        );
      })
      .sort((a, b) => a.data_evento.localeCompare(b.data_evento));
  }, [eventos, busca, filtro]);

  if (isLoading) {
    return <div className="text-ink-400 text-sm">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button size="sm" className="rounded-xl" onClick={openNovo}>
          <Plus className="h-4 w-4 mr-1" /> Novo
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl"
          onClick={handleDistribuir}
          disabled={distribuindo}
          title="Sorteia uma data no mês para cada evento pendente"
        >
          {distribuindo ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Shuffle className="h-4 w-4 mr-1" />
          )}
          {distribuindo ? "Distribuindo..." : "Distribuir"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-ink-500">
          <Circle className="h-3 w-3 text-gold-500 fill-gold-500" />
          {totalPendentes} pendente{totalPendentes === 1 ? "" : "s"}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-500">
          <CheckCircle2 className="h-3 w-3 text-ink-300" />
          {totalConcluidos} concluído{totalConcluidos === 1 ? "" : "s"}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título..."
            className="pl-9 rounded-xl"
          />
        </div>
        <div className="flex rounded-xl border border-ink-200 p-0.5 bg-white flex-shrink-0">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap",
                filtro === f.value ? "bg-ink-900 text-white" : "text-ink-500 hover:text-ink-900"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-ink-200 bg-white py-12 text-center">
          <p className="text-sm text-ink-400">
            {eventos.length === 0 ? "Nenhum evento futuro cadastrado." : "Nenhum evento encontrado."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-ink-50/40 px-2 py-1.5 space-y-0.5">
          {filtrados.map((evento) => (
            <EventoFuturoItem key={evento.id} evento={evento} onToggle={toggleConcluido} onEdit={openEdicao} onSortear={handleSortear} />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar evento" : "Novo evento futuro"}</DialogTitle></DialogHeader>
          <EventoFuturoForm
            evento={editing}
            onSaved={handleSaved}
            onCancel={() => setOpen(false)}
            onDelete={handleDelete}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
