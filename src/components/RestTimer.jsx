import React, { useEffect, useRef, useState } from "react";
import { Timer, Play, Pause, RotateCcw } from "lucide-react";

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
    osc.onended = () => ctx.close();
  } catch {
    // Web Audio indisponível (ex.: navegador sem suporte) — ignora silenciosamente.
  }
}

export default function RestTimer({ defaultSeconds = 90, startSignal = 0 }) {
  const [duracao, setDuracao] = useState(defaultSeconds);
  const [restante, setRestante] = useState(defaultSeconds);
  const [rodando, setRodando] = useState(false);
  const intervalRef = useRef(null);
  const primeiraRenderRef = useRef(true);

  useEffect(() => {
    if (!rodando) return undefined;
    intervalRef.current = setInterval(() => {
      setRestante((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          setRodando(false);
          beep();
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [rodando]);

  const ajustarDuracao = (delta) => {
    const novaDuracao = Math.max(15, duracao + delta);
    setDuracao(novaDuracao);
    if (!rodando) setRestante(novaDuracao);
  };

  const iniciar = () => {
    if (restante === 0) setRestante(duracao);
    setRodando(true);
  };
  const pausar = () => setRodando(false);
  const reiniciar = () => {
    setRodando(false);
    setRestante(duracao);
  };

  useEffect(() => {
    if (primeiraRenderRef.current) {
      primeiraRenderRef.current = false;
      return;
    }
    if (startSignal) {
      setRestante(duracao);
      setRodando(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startSignal]);

  const mm = String(Math.floor(restante / 60)).padStart(2, "0");
  const ss = String(restante % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-1.5 w-fit">
      <Timer className="h-3.5 w-3.5 text-ink-400 flex-shrink-0" />
      <button type="button" onClick={() => ajustarDuracao(-15)} disabled={rodando} className="text-xs text-ink-400 hover:text-ink-700 disabled:opacity-30 px-1">
        -15s
      </button>
      <span className={`font-mono text-sm tabular-nums w-12 text-center ${restante === 0 && !rodando ? "text-rust-600" : ""}`}>
        {mm}:{ss}
      </span>
      <button type="button" onClick={() => ajustarDuracao(15)} disabled={rodando} className="text-xs text-ink-400 hover:text-ink-700 disabled:opacity-30 px-1">
        +15s
      </button>
      {rodando ? (
        <button type="button" onClick={pausar} className="p-1 text-ink-500 hover:text-ink-900">
          <Pause className="h-3.5 w-3.5" />
        </button>
      ) : (
        <button type="button" onClick={iniciar} className="p-1 text-ink-500 hover:text-ink-900">
          <Play className="h-3.5 w-3.5" />
        </button>
      )}
      <button type="button" onClick={reiniciar} className="p-1 text-ink-400 hover:text-ink-900">
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
