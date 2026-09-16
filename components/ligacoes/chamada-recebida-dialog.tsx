"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, PhoneIncoming, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLigacoes } from "@/components/ligacoes/ligacoes-provider";
import { formatarTelefone } from "@/components/ligacoes/formatar";

/** Toque de chamada (440 + 480 Hz, 1 s ligado / 2 s desligado) via Web Audio. */
function tocarCampainha() {
  let ctx: AudioContext;
  try {
    ctx = new AudioContext();
  } catch {
    return () => {};
  }
  let parado = false;
  const ciclo = () => {
    if (parado) return;
    const t = ctx.currentTime;
    for (const freq of [440, 480]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
      gain.gain.setValueAtTime(0.15, t + 0.98);
      gain.gain.linearRampToValueAtTime(0, t + 1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 1.05);
    }
    setTimeout(ciclo, 3000);
  };
  ciclo();
  return () => {
    parado = true;
    void ctx.close().catch(() => {});
  };
}

export function ChamadaRecebidaDialog() {
  const { recebendo, receberNesteDispositivo, sessoes, atender, recusar } = useLigacoes();
  const [ocupado, setOcupado] = useState(false);
  const atenderRef = useRef<HTMLButtonElement>(null);
  const aberto = !!recebendo && receberNesteDispositivo;
  const sessao = sessoes.find((s) => s.id === recebendo?.sessionId);

  useEffect(() => {
    if (!aberto) return;
    const titulo = document.title;
    document.title = "📞 Chamada recebida";
    const parar = tocarCampainha();
    return () => {
      parar();
      document.title = titulo;
    };
  }, [aberto]);

  async function executar(acao: () => Promise<void>) {
    setOcupado(true);
    try {
      await acao();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Dialog open={aberto} disablePointerDismissal>
      <DialogContent showCloseButton={false} initialFocus={atenderRef}>
        <DialogHeader className="items-center text-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
            <PhoneIncoming className="size-7" />
          </div>
          {sessao && <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{sessao.name}</span>}
          <DialogTitle className="text-xl">Chamada recebida</DialogTitle>
          <DialogDescription className="truncate">
            {recebendo?.peerName || formatarTelefone(recebendo?.peer ?? "")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center gap-8 pt-2">
          <Button
            variant="destructive"
            size="icon"
            className="size-14 rounded-full"
            disabled={ocupado}
            onClick={() => executar(recusar)}
            aria-label="Recusar"
          >
            <PhoneOff className="size-6" />
          </Button>
          <Button
            ref={atenderRef}
            variant="success"
            size="icon"
            className="size-14 rounded-full"
            disabled={ocupado}
            onClick={() => executar(atender)}
            aria-label="Atender"
          >
            <Phone className="size-6" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
