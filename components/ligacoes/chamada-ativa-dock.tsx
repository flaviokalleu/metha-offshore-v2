"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, Pause, Phone, PhoneOff, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLigacoes, type Chamada } from "@/components/ligacoes/ligacoes-provider";
import { formatarDuracao, formatarTelefone } from "@/components/ligacoes/formatar";

function Medidor({ label, nivel }: { label: string; nivel: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-success transition-[width] duration-75" style={{ width: `${Math.round(nivel * 100)}%` }} />
      </div>
    </div>
  );
}

function CartaoChamada({ chamada }: { chamada: Chamada }) {
  const { atendidaEm, mudo, espera, niveis, desligar, alternarEspera, alternarMudo } = useLigacoes();
  const [nivel, setNivel] = useState({ mic: 0, peer: 0 });
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    let raf = 0;
    let ultimo = 0;
    const loop = (t: number) => {
      if (t - ultimo > 80) {
        ultimo = t;
        setNivel(niveis(chamada.callId) ?? { mic: 0, peer: 0 });
        setAgora(Date.now());
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [chamada.callId, niveis]);

  const inicio = atendidaEm[chamada.callId];
  const status =
    chamada.status === "connected"
      ? formatarDuracao(agora - (inicio ?? agora))
      : chamada.status === "ringing"
        ? "Chamando…"
        : "Conectando…";
  const estaMudo = !!mudo[chamada.callId];
  const emEspera = !!espera[chamada.callId];

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-lg ring-1 ring-foreground/5">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            chamada.status === "connected" ? "bg-success/15 text-success" : "animate-pulse bg-muted text-muted-foreground",
          )}
        >
          <Phone className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{chamada.peerName || formatarTelefone(chamada.peer)}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {emEspera ? "Em espera" : status}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Medidor label="Você" nivel={estaMudo ? 0 : nivel.mic} />
        <Medidor label="Outro" nivel={nivel.peer} />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={estaMudo ? "warning" : "outline"}
          size="sm"
          className="flex-1"
          onClick={() => alternarMudo(chamada)}
          aria-pressed={estaMudo}
        >
          {estaMudo ? <MicOff /> : <Mic />}
          {estaMudo ? "Mudo" : "Microfone"}
        </Button>
        <Button
          variant={emEspera ? "warning" : "outline"}
          size="sm"
          className="flex-1"
          disabled={chamada.status !== "connected"}
          onClick={() => alternarEspera(chamada)}
          aria-pressed={emEspera}
        >
          {emEspera ? <Play /> : <Pause />}
          {emEspera ? "Retomar" : "Espera"}
        </Button>
        <Button size="icon-lg" className="bg-destructive text-white hover:bg-destructive/85" onClick={() => desligar(chamada)} aria-label="Desligar">
          <PhoneOff />
        </Button>
      </div>
    </div>
  );
}

/** Chamadas deste navegador, fixas no canto da tela em qualquer página do app. */
export function ChamadaAtivaDock() {
  const { minhas } = useLigacoes();

  useEffect(() => {
    if (minhas.length === 0) return;
    // Recarregar/fechar a aba derruba a ligação: avisa antes.
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [minhas.length]);

  if (minhas.length === 0) return null;
  return (
    <div className="fixed inset-x-3 bottom-20 z-40 flex flex-col gap-2 sm:left-auto sm:right-4 sm:w-80 md:bottom-4 print:hidden">
      {minhas.map((c) => (
        <CartaoChamada key={c.callId} chamada={c} />
      ))}
    </div>
  );
}
