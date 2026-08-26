import React, { useState } from "react";
import * as RechartsPrimitive from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import PageHeader from "@/components/PageHeader";
import PesoCorporalForm from "@/components/PesoCorporalForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Scale, TrendingUp, CalendarPlus } from "lucide-react";
import { formatDate, dataLocalHoje } from "@/lib/format";
import { usePesoCorporal } from "@/hooks/usePesoCorporal";
import { useToast } from "@/components/ui/use-toast";

export default function PesoCorporal() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [dataAgendada, setDataAgendada] = useState(dataLocalHoje());
  const [agendando, setAgendando] = useState(false);
  const { toast } = useToast();

  const { registros, isLoading, deleteRegistroPeso, saveRegistroPeso, agendarPesagem } = usePesoCorporal();

  const handleSaved = async (form) => {
    await saveRegistroPeso(form);
    setOpen(false);
    setEditing(null);
  };

  const handleAgendar = async (e) => {
    e.preventDefault();
    setAgendando(true);
    try {
      await agendarPesagem(dataAgendada);
      setAgendaOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao agendar", description: error.message });
    } finally {
      setAgendando(false);
    }
  };

  const chartData = registros.map((r) => ({ label: formatDate(r.data), peso: r.peso }));
  const registrosOrdenados = [...registros].sort((a, b) => new Date(b.data) - new Date(a.data));

  return (
    <div>
      <PageHeader
        title="Peso Corporal"
        subtitle="Evolução do seu peso na balança"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setDataAgendada(dataLocalHoje()); setAgendaOpen(true); }}>
              <CalendarPlus className="h-4 w-4 mr-1.5" /> Agendar pesagem
            </Button>
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="h-4 w-4 mr-1.5" /> Novo registro
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="text-ink-400 text-sm">Carregando...</div>
      ) : registros.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <Scale className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum registro de peso ainda.</p>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="font-display text-lg text-ink-900 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-ink-400" /> Evolução
            </h2>
            <ChartContainer config={{}} className="max-h-[260px] w-full">
              <RechartsPrimitive.LineChart data={chartData}>
                <RechartsPrimitive.CartesianGrid vertical={false} strokeDasharray="3 3" />
                <RechartsPrimitive.XAxis dataKey="label" tickLine={false} axisLine={false} />
                <RechartsPrimitive.YAxis tickLine={false} axisLine={false} width={40} domain={["auto", "auto"]} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <RechartsPrimitive.Line type="monotone" dataKey="peso" stroke="#c25b3f" strokeWidth={2} dot={{ r: 3 }} />
              </RechartsPrimitive.LineChart>
            </ChartContainer>
          </div>

          <div className="space-y-2.5">
            {registrosOrdenados.map((r) => (
              <div key={r.id} className="group flex items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3.5">
                <div>
                  <p className="font-mono font-semibold tabular-nums">{r.peso} kg</p>
                  <p className="text-xs text-ink-400 mt-0.5">{formatDate(r.data)}</p>
                </div>
                <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(r); setOpen(true); }} className="p-2 text-ink-400 hover:text-ink-900">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteRegistroPeso(r.id)} className="p-2 text-ink-400 hover:text-rust-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar registro" : "Novo registro"}</DialogTitle></DialogHeader>
          <PesoCorporalForm registro={editing} onSaved={handleSaved} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={agendaOpen} onOpenChange={setAgendaOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agendar pesagem</DialogTitle></DialogHeader>
          <form onSubmit={handleAgendar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dataAgendada">Data</Label>
              <Input
                id="dataAgendada"
                type="date"
                value={dataAgendada}
                onChange={(e) => setDataAgendada(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setAgendaOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={agendando}>{agendando ? "Agendando..." : "Agendar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
