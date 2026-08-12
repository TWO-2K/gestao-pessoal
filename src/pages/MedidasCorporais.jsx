import React, { useMemo, useRef, useState } from "react";
import * as RechartsPrimitive from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import PageHeader from "@/components/PageHeader";
import MedidaCorporalForm from "@/components/MedidaCorporalForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Ruler, TrendingUp, Images, Upload } from "lucide-react";
import { formatDate, dataLocalHoje } from "@/lib/format";
import { useMedidasCorporais } from "@/hooks/useMedidasCorporais";
import { useFotosProgresso } from "@/hooks/useFotosProgresso";

const METRICAS = [
  { value: "cintura", label: "Cintura", unidade: "cm" },
  { value: "braco", label: "Braço", unidade: "cm" },
  { value: "peito", label: "Peito", unidade: "cm" },
  { value: "percentual_gordura", label: "% Gordura", unidade: "%" },
];

export default function MedidasCorporais() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [metrica, setMetrica] = useState("cintura");
  const { toast } = useToast();

  const { medidas, isLoading, deleteMedida, saveMedida } = useMedidasCorporais();
  const { fotos, isLoading: isLoadingFotos, uploadFoto, deleteFoto } = useFotosProgresso();

  const [dataFoto, setDataFoto] = useState(dataLocalHoje);
  const [enviando, setEnviando] = useState(false);
  const fileInputRef = useRef(null);

  const [fotoAntesId, setFotoAntesId] = useState("");
  const [fotoDepoisId, setFotoDepoisId] = useState("");

  const handleSaved = async (form) => {
    await saveMedida(form);
    setOpen(false);
    setEditing(null);
  };

  const chartData = useMemo(
    () =>
      medidas
        .filter((m) => m[metrica] != null)
        .map((m) => ({ label: formatDate(m.data), valor: m[metrica] })),
    [medidas, metrica]
  );

  const medidasOrdenadas = [...medidas].sort((a, b) => new Date(b.data) - new Date(a.data));
  const metricaAtual = METRICAS.find((m) => m.value === metrica);

  const handleSelectArquivo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setEnviando(true);
    try {
      await uploadFoto({ file, data: dataFoto });
      toast({ title: "Foto adicionada" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao enviar foto", description: error.message });
    } finally {
      setEnviando(false);
    }
  };

  const handleDeleteFoto = async (foto) => {
    try {
      await deleteFoto(foto);
      if (fotoAntesId === foto.id) setFotoAntesId("");
      if (fotoDepoisId === foto.id) setFotoDepoisId("");
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir foto", description: error.message });
    }
  };

  const fotoAntes = fotos.find((f) => f.id === fotoAntesId);
  const fotoDepois = fotos.find((f) => f.id === fotoDepoisId);

  return (
    <div>
      <PageHeader
        title="Medidas"
        subtitle="Medidas corporais e fotos de progresso"
        action={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Nova medida
          </Button>
        }
      />

      <div className="space-y-10">
        <div>
          {isLoading ? (
            <div className="text-ink-400 text-sm">Carregando...</div>
          ) : medidas.length === 0 ? (
            <div className="text-center py-16 text-ink-400">
              <Ruler className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Nenhuma medida registrada ainda.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="font-display text-lg text-ink-900 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-ink-400" /> Evolução
                </h2>
                <Select value={metrica} onValueChange={setMetrica}>
                  <SelectTrigger className="w-auto min-w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METRICAS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {chartData.length === 0 ? (
                <p className="text-sm text-ink-400 mb-6">Sem registros de {metricaAtual.label.toLowerCase()} ainda.</p>
              ) : (
                <ChartContainer config={{}} className="max-h-[240px] w-full mb-6">
                  <RechartsPrimitive.LineChart data={chartData}>
                    <RechartsPrimitive.CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <RechartsPrimitive.XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <RechartsPrimitive.YAxis tickLine={false} axisLine={false} width={40} domain={["auto", "auto"]} />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <RechartsPrimitive.Line type="monotone" dataKey="valor" stroke="#c25b3f" strokeWidth={2} dot={{ r: 3 }} />
                  </RechartsPrimitive.LineChart>
                </ChartContainer>
              )}

              <div className="space-y-2.5">
                {medidasOrdenadas.map((m) => (
                  <div key={m.id} className="group flex items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-ink-400">{formatDate(m.data)}</p>
                      <p className="text-sm text-ink-700 mt-0.5">
                        {[
                          m.cintura != null && `Cintura: ${m.cintura}cm`,
                          m.braco != null && `Braço: ${m.braco}cm`,
                          m.peito != null && `Peito: ${m.peito}cm`,
                          m.percentual_gordura != null && `Gordura: ${m.percentual_gordura}%`,
                        ].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => { setEditing(m); setOpen(true); }} className="p-2 text-ink-400 hover:text-ink-900">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteMedida(m.id)} className="p-2 text-ink-400 hover:text-rust-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg text-ink-900 mb-3 flex items-center gap-2">
            <Images className="h-4 w-4 text-ink-400" /> Fotos de progresso
          </h2>

          <div className="flex items-center gap-2 mb-5">
            <Input type="date" value={dataFoto} onChange={(e) => setDataFoto(e.target.value)} className="w-auto" />
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleSelectArquivo} />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={enviando}>
              <Upload className="h-4 w-4 mr-1.5" /> {enviando ? "Enviando..." : "Adicionar foto"}
            </Button>
          </div>

          {isLoadingFotos ? (
            <div className="text-ink-400 text-sm">Carregando...</div>
          ) : fotos.length === 0 ? (
            <p className="text-sm text-ink-400">Nenhuma foto de progresso ainda.</p>
          ) : (
            <>
              {fotos.length >= 2 && (
                <div className="mb-6">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Select value={fotoAntesId} onValueChange={setFotoAntesId}>
                      <SelectTrigger className="w-auto min-w-[140px]"><SelectValue placeholder="Antes" /></SelectTrigger>
                      <SelectContent>
                        {fotos.map((f) => (
                          <SelectItem key={f.id} value={f.id}>{formatDate(f.data)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-ink-400 text-sm">→</span>
                    <Select value={fotoDepoisId} onValueChange={setFotoDepoisId}>
                      <SelectTrigger className="w-auto min-w-[140px]"><SelectValue placeholder="Depois" /></SelectTrigger>
                      <SelectContent>
                        {fotos.map((f) => (
                          <SelectItem key={f.id} value={f.id}>{formatDate(f.data)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {fotoAntes && fotoDepois && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <img src={fotoAntes.url} alt={`Foto de ${formatDate(fotoAntes.data)}`} className="w-full rounded-2xl border border-ink-200 object-cover aspect-[3/4]" />
                        <p className="text-xs text-ink-400 text-center mt-1.5">{formatDate(fotoAntes.data)}</p>
                      </div>
                      <div>
                        <img src={fotoDepois.url} alt={`Foto de ${formatDate(fotoDepois.data)}`} className="w-full rounded-2xl border border-ink-200 object-cover aspect-[3/4]" />
                        <p className="text-xs text-ink-400 text-center mt-1.5">{formatDate(fotoDepois.data)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {fotos.map((foto) => (
                  <div key={foto.id} className="group relative">
                    <img src={foto.url} alt={`Foto de ${formatDate(foto.data)}`} className="w-full rounded-xl border border-ink-200 object-cover aspect-[3/4]" />
                    <p className="text-xs text-ink-400 text-center mt-1">{formatDate(foto.data)}</p>
                    <button
                      onClick={() => handleDeleteFoto(foto)}
                      className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-white/90 text-ink-400 hover:text-rust-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar medida" : "Nova medida"}</DialogTitle></DialogHeader>
          <MedidaCorporalForm medida={editing} onSaved={handleSaved} onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
