import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import RestTimer from "@/components/RestTimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Check, Trash2, Plus, PartyPopper, ClipboardList, Camera, X } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useTreinos } from "@/hooks/useTreinos";
import { useExerciciosAcademia } from "@/hooks/useExerciciosAcademia";
import { usePlanosAcademia } from "@/hooks/usePlanosAcademia";
import { novaSerie, novasSeries, agruparSeriesPorExercicio, diaSemanaDeData } from "@/lib/treinoUtils";
import { grupoMuscularLabel } from "@/lib/gruposMusculares";
import { recordesPorExercicio } from "@/lib/academiaMetrics";
import { dataLocalHoje as dataDeHoje } from "@/lib/format";

export default function TreinoHoje() {
  const { toast } = useToast();
  const { treinos, isLoading, saveTreino, deleteTreino } = useTreinos();
  const { exercicios, isLoading: isLoadingExercicios, uploadFotoExercicio, removeFotoExercicio } = useExerciciosAcademia();
  const { planos, isLoading: isLoadingPlanos } = usePlanosAcademia();

  const [searchParams] = useSearchParams();
  const [data, setData] = useState(() => searchParams.get("data") || dataDeHoje());
  const [treinoId, setTreinoId] = useState(null);
  const [planoId, setPlanoId] = useState(null);
  const [nome, setNome] = useState("");
  const [finalizado, setFinalizado] = useState(false);
  const [linhas, setLinhas] = useState(null); // null = ainda não carregado pra essa data
  const [restSignals, setRestSignals] = useState({});
  const [escolhendoPlano, setEscolhendoPlano] = useState(false);
  const dataCarregadaRef = useRef(null);
  // treinoId em ref (não só state) pra evitar duas séries marcadas em sequência
  // rápida criarem dois treinos duplicados — o fechamento de uma função async
  // não vê o setState da outra até o próximo render, então o valor "oficial" e
  // as gravações são serializados por aqui.
  const treinoIdRef = useRef(null);
  const filaSalvamentoRef = useRef(Promise.resolve());
  // Evita re-avisar o mesmo recorde a cada salvamento — o cálculo de PR compara
  // com o histórico fora deste treino, então sem isso todo clique/edição
  // reapresentava os recordes já avisados nesta mesma sessão.
  const prsAvisadosRef = useRef(new Set());
  const [exercicioFotoAlvo, setExercicioFotoAlvo] = useState(null);
  const fotoExercicioInputRef = useRef(null);
  const [galeriaExercicioId, setGaleriaExercicioId] = useState(null);
  const [fotoAmpliada, setFotoAmpliada] = useState(null); // url

  const treinoDoDia = treinos.find((t) => t.data === data) || null;
  const diaSemana = diaSemanaDeData(data);
  const planosDoDia = planos.filter((p) => p.ativo !== false && (p.dias_semana || []).includes(diaSemana));

  const iniciarComPlano = (plano) => {
    setPlanoId(plano.id);
    setNome(plano.nome);
    setLinhas(plano.exercicios.map((pe) => ({
      exercicio_id: pe.exercicio_id,
      series: novasSeries(pe.series_alvo, pe.reps_alvo),
    })));
    setEscolhendoPlano(false);
  };

  const carregarEstado = (treinoExistente) => {
    setRestSignals({});
    prsAvisadosRef.current = new Set();
    if (treinoExistente) {
      treinoIdRef.current = treinoExistente.id;
      setTreinoId(treinoExistente.id);
      setPlanoId(treinoExistente.plano_id ?? null);
      setNome(treinoExistente.nome || "");
      setFinalizado(!!treinoExistente.finalizado);
      setLinhas(agruparSeriesPorExercicio(treinoExistente.series || []));
      setEscolhendoPlano(false);
    } else {
      treinoIdRef.current = null;
      setTreinoId(null);
      setPlanoId(null);
      setFinalizado(false);
      if (planosDoDia.length === 1) {
        iniciarComPlano(planosDoDia[0]);
      } else if (planosDoDia.length > 1) {
        setNome("");
        setLinhas([]);
        setEscolhendoPlano(true);
      } else {
        setNome("");
        setLinhas([]);
        setEscolhendoPlano(false);
      }
    }
  };

  useEffect(() => {
    if (isLoading || isLoadingPlanos) return;
    if (dataCarregadaRef.current === data) return; // já carregado pra essa data, não sobrescreve edições em curso
    dataCarregadaRef.current = data;
    carregarEstado(treinoDoDia);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, treinoDoDia, planosDoDia, isLoading, isLoadingPlanos]);

  const handleExcluir = () => {
    if (!treinoId) return;
    deleteTreino(treinoId);
    carregarEstado(null);
  };

  const handleFinalizarTreino = () => {
    setFinalizado(true);
    persistir(linhas, true);
  };

  const handleReabrirTreino = () => {
    setFinalizado(false);
    persistir(linhas, false);
  };

  const exercicioMap = Object.fromEntries(exercicios.map((e) => [e.id, e]));

  const persistir = (linhasAtuais, finalizadoOverride) => {
    filaSalvamentoRef.current = filaSalvamentoRef.current
      .then(async () => {
        const idAntes = treinoIdRef.current;
        const recordesAntes = recordesPorExercicio(treinos.filter((t) => t.id !== idAntes));
        const finalizadoAtual = finalizadoOverride !== undefined ? finalizadoOverride : finalizado;
        const id = await saveTreino({ id: idAntes, data, nome: nome || "Treino", plano_id: planoId, finalizado: finalizadoAtual, observacao: "", exercicios: linhasAtuais });
        if (!idAntes) {
          treinoIdRef.current = id;
          setTreinoId(id);
        }

        for (const ex of linhasAtuais) {
          const pesos = ex.series.map((s) => Number(s.peso) || 0).filter((p) => p > 0);
          if (pesos.length === 0) continue;
          const pesoMax = Math.max(...pesos);
          const anterior = recordesAntes[ex.exercicio_id];
          if ((!anterior || pesoMax > anterior.peso) && !prsAvisadosRef.current.has(ex.exercicio_id)) {
            prsAvisadosRef.current.add(ex.exercicio_id);
            toast({ title: "Novo recorde pessoal! 🏆", description: `${exercicioMap[ex.exercicio_id]?.nome || "Exercício"}: ${pesoMax}kg` });
          }
        }
      })
      .catch((error) => {
        toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
      });
    return filaSalvamentoRef.current;
  };

  const setSerieCampo = (idx, sidx, campo, valor) => {
    setLinhas((ls) =>
      ls.map((ex, i) =>
        i === idx ? { ...ex, series: ex.series.map((s, si) => (si === sidx ? { ...s, [campo]: valor } : s)) } : ex
      )
    );
  };

  const toggleConcluida = (idx, sidx) => {
    setLinhas((ls) => {
      const proximo = ls.map((ex, i) =>
        i === idx
          ? { ...ex, series: ex.series.map((s, si) => (si === sidx ? { ...s, concluida: !s.concluida } : s)) }
          : ex
      );
      const marcouComoFeita = !ls[idx].series[sidx].concluida;
      if (marcouComoFeita) setRestSignals((r) => ({ ...r, [idx]: (r[idx] || 0) + 1 }));
      persistir(proximo);
      return proximo;
    });
  };

  const salvarComDebounce = (linhasAtuais) => {
    persistir(linhasAtuais);
  };

  const addSerie = (idx) => {
    setLinhas((ls) => ls.map((ex, i) => (i === idx ? { ...ex, series: [...ex.series, novaSerie()] } : ex)));
  };

  const removeSerie = (idx, sidx) => {
    setLinhas((ls) => {
      const proximo = ls.map((ex, i) => (i === idx ? { ...ex, series: ex.series.filter((_, si) => si !== sidx) } : ex));
      salvarComDebounce(proximo);
      return proximo;
    });
  };

  const handleClickFotoExercicio = (exercicioId) => {
    setGaleriaExercicioId(exercicioId);
  };

  const handleAdicionarFotoExercicio = (exercicioId) => {
    setExercicioFotoAlvo(exercicioId);
    fotoExercicioInputRef.current?.click();
  };

  const enviarFotoExercicio = async (exercicioId, file) => {
    try {
      await uploadFotoExercicio({ exercicioId, file });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao enviar foto do exercício", description: error.message });
    }
  };

  const handleFotoExercicioSelecionada = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !exercicioFotoAlvo) return;
    await enviarFotoExercicio(exercicioFotoAlvo, file);
  };

  const handleColarFotoExercicio = async (e) => {
    if (!galeriaExercicioId) return;
    const item = Array.from(e.clipboardData?.items || []).find((i) => i.type.startsWith("image/"));
    if (!item) return;
    e.preventDefault();
    const file = item.getAsFile();
    if (!file) return;
    await enviarFotoExercicio(galeriaExercicioId, file);
  };

  const handleRemoverFotoExercicio = async (foto) => {
    try {
      await removeFotoExercicio({ fotoId: foto.id, fotoPath: foto.foto_path });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao remover foto", description: error.message });
    }
  };

  const isHoje = data === dataDeHoje();

  if (isLoading || isLoadingExercicios || isLoadingPlanos || linhas === null) {
    return (
      <div>
        <PageHeader title="Treino do dia" subtitle="Carregando..." />
      </div>
    );
  }

  const totalSeries = linhas.reduce((n, ex) => n + ex.series.length, 0);
  const totalConcluidas = linhas.reduce((n, ex) => n + ex.series.filter((s) => s.concluida).length, 0);
  const todasSeriesFeitas = totalSeries > 0 && totalConcluidas === totalSeries;
  const treinoConcluido = todasSeriesFeitas || finalizado;

  return (
    <div>
      <PageHeader
        title="Treino do dia"
        subtitle={nome || "Sem plano pra esse dia — escolha outra data ou ajuste seus planos"}
        action={
          <div className="flex items-center gap-2">
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="w-auto" />
            {treinoId && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="outline" size="icon" className="text-ink-400 hover:text-rust-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir esse treino?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Remove o treino registrado nesse dia, com todos os exercícios e séries. Não dá pra desfazer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleExcluir}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        }
      />

      {!isHoje && (
        <p className="text-xs text-ink-400 mb-4">Editando um dia diferente de hoje.</p>
      )}

      {escolhendoPlano && (
        <div className="mb-5 rounded-xl border border-ink-200 bg-ink-50 p-4">
          <p className="text-sm text-ink-700 mb-2.5">Mais de um plano cai nesse dia. Qual você vai fazer?</p>
          <Select value="" onValueChange={(v) => iniciarComPlano(planosDoDia.find((p) => p.id === v))}>
            <SelectTrigger className="w-auto min-w-[220px]">
              <SelectValue placeholder="Escolher plano..." />
            </SelectTrigger>
            <SelectContent>
              {planosDoDia.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {totalSeries > 0 && (
        <div className="mb-5 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-ink-100 overflow-hidden">
            <div
              className={cn("h-full transition-all", treinoConcluido ? "bg-emerald-500" : "bg-gold-500")}
              style={{ width: `${Math.round((totalConcluidas / totalSeries) * 100)}%` }}
            />
          </div>
          <span className="text-xs text-ink-400 tabular-nums flex-shrink-0">{totalConcluidas}/{totalSeries} séries</span>
        </div>
      )}

      {treinoConcluido ? (
        <div className="mb-5 flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span className="flex items-center gap-2">
            <PartyPopper className="h-4 w-4" />
            {todasSeriesFeitas ? "Treino concluído!" : "Treino finalizado (nem tudo foi feito, e tudo bem)."}
          </span>
          {!todasSeriesFeitas && (
            <Button type="button" variant="ghost" size="sm" className="h-auto py-1 text-emerald-700 hover:text-emerald-900" onClick={handleReabrirTreino}>
              Reabrir
            </Button>
          )}
        </div>
      ) : (
        totalSeries > 0 && (
          <div className="mb-5">
            <Button type="button" variant="outline" size="sm" onClick={handleFinalizarTreino}>
              Finalizar treino por hoje
            </Button>
          </div>
        )
      )}

      <input ref={fotoExercicioInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoExercicioSelecionada} />

      <div className="space-y-3">
        {linhas.map((ex, idx) => {
          const totalConcluidasEx = ex.series.filter((s) => s.concluida).length;
          const fotosExercicio = exercicioMap[ex.exercicio_id]?.fotos || [];
          const fotoExercicio = fotosExercicio[0]?.url;
          return (
            <div key={idx} className="rounded-xl border border-ink-200 bg-white p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleClickFotoExercicio(ex.exercicio_id)}
                  title="Fotos de exemplo do exercício"
                  className="relative h-10 w-10 flex-shrink-0 rounded-lg border border-ink-200 bg-ink-50 overflow-hidden flex items-center justify-center"
                >
                  {fotoExercicio ? (
                    <img src={fotoExercicio} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Camera className="h-4 w-4 text-ink-300" />
                  )}
                  {fotosExercicio.length > 1 && (
                    <span className="absolute bottom-0 right-0 bg-ink-900 text-white text-[9px] leading-none px-1 py-0.5 rounded-tl-md">
                      {fotosExercicio.length}
                    </span>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-ink-900">{exercicioMap[ex.exercicio_id]?.nome || "Exercício"}</span>
                  <span className="text-xs text-ink-400 ml-1.5">{grupoMuscularLabel(exercicioMap[ex.exercicio_id]?.grupo_muscular)}</span>
                </div>
                {ex.series.length > 0 && (
                  <span className="text-xs text-ink-400 flex-shrink-0 tabular-nums">
                    {totalConcluidasEx}/{ex.series.length}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                {ex.series.map((s, sidx) => (
                  <div key={sidx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleConcluida(idx, sidx)}
                      className={cn(
                        "h-7 w-7 flex-shrink-0 rounded-full border flex items-center justify-center transition-colors",
                        s.concluida ? "bg-gold-500 border-gold-500 text-white" : "border-ink-300 text-transparent hover:border-ink-400"
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-ink-400 w-5 flex-shrink-0">{sidx + 1}ª</span>
                    <Input
                      type="number" step="0.5" min="0" placeholder="Peso (kg)"
                      value={s.peso}
                      onChange={(e) => setSerieCampo(idx, sidx, "peso", e.target.value)}
                      onBlur={() => salvarComDebounce(linhas)}
                      className={cn("flex-1", s.concluida && "border-gold-300 bg-gold-50/40")}
                    />
                    <Input
                      type="number" min="0" placeholder="Reps"
                      value={s.repeticoes}
                      onChange={(e) => setSerieCampo(idx, sidx, "repeticoes", e.target.value)}
                      onBlur={() => salvarComDebounce(linhas)}
                      className={cn("flex-1", s.concluida && "border-gold-300 bg-gold-50/40")}
                    />
                    <button
                      type="button"
                      onClick={() => removeSerie(idx, sidx)}
                      disabled={ex.series.length === 1}
                      className="p-1.5 text-ink-300 hover:text-rust-600 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <Button type="button" variant="ghost" size="sm" onClick={() => addSerie(idx)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Série
                </Button>
              </div>

              <RestTimer defaultSeconds={90} startSignal={restSignals[idx] || 0} />
            </div>
          );
        })}

        {linhas.length === 0 && !escolhendoPlano && (
          <div className="text-center py-14 text-ink-400">
            <ClipboardList className="h-9 w-9 mx-auto mb-3 opacity-40" />
            <p className="mb-3">Nenhum plano cai nesse dia.</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/academia/planos">Criar ou ajustar um plano</Link>
            </Button>
          </div>
        )}
      </div>

      <Dialog open={!!galeriaExercicioId} onOpenChange={(open) => !open && setGaleriaExercicioId(null)}>
        <DialogContent className="max-w-lg" onPaste={handleColarFotoExercicio}>
          {galeriaExercicioId && (
            <div className="space-y-3">
              <p className="font-medium text-ink-900 pr-6">{exercicioMap[galeriaExercicioId]?.nome || "Exercício"}</p>
              <p className="text-xs text-ink-400">Dica: copie uma imagem e cole aqui com Ctrl+V.</p>
              <div className="grid grid-cols-3 gap-2">
                {(exercicioMap[galeriaExercicioId]?.fotos || []).map((foto) => (
                  <div key={foto.id} className="relative group aspect-square rounded-lg overflow-hidden border border-ink-200">
                    <button type="button" onClick={() => setFotoAmpliada(foto.url)} className="h-full w-full">
                      <img src={foto.url} alt="" className="h-full w-full object-cover" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoverFotoExercicio(foto)}
                      title="Remover foto"
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAdicionarFotoExercicio(galeriaExercicioId)}
                  className="aspect-square rounded-lg border border-dashed border-ink-300 text-ink-400 hover:border-ink-400 hover:text-ink-600 flex flex-col items-center justify-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-[11px]">Adicionar</span>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!fotoAmpliada} onOpenChange={(open) => !open && setFotoAmpliada(null)}>
        <DialogContent className="max-w-lg">
          {fotoAmpliada && <img src={fotoAmpliada} alt="" className="w-full rounded-lg object-contain max-h-[70vh]" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
