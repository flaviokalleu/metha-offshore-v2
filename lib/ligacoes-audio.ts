"use client";

import { api } from "@/lib/api-client";

/**
 * Perna navegador ↔ servidor da ligação: microfone e alto-falante trafegam como
 * PCM 16 kHz mono Int16 LE num data channel WebRTC ("pcm") até o ArendCalls,
 * que codifica/decodifica e fala com o WhatsApp.
 */

const CLIENT_ID_KEY = "metha_ligacoes_client_id";
const DEBUG_KEY = "metha_ligacoes_debug";

/** Identifica este navegador como "dono" das chamadas que ele fez/atendeu. */
export function getClientId() {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `c-${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

/** fetch autenticado para /api/ligacoes/* já com o X-Client-Id. */
export function ligacoesApi<T = unknown>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set("X-Client-Id", getClientId());
  return api<T>(`/ligacoes${path}`, { ...options, headers });
}

function float32ParaInt16(pcm: Float32Array): ArrayBuffer {
  const view = new DataView(new ArrayBuffer(pcm.length * 2));
  for (let i = 0; i < pcm.length; i += 1) {
    const s = Number.isNaN(pcm[i]) ? 0 : Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(i * 2, s < 0 ? Math.round(s * 32768) : Math.round(s * 32767), true);
  }
  return view.buffer;
}

function int16ParaFloat32(buf: ArrayBuffer): Float32Array {
  const view = new DataView(buf);
  const out = new Float32Array(Math.floor(buf.byteLength / 2));
  for (let i = 0; i < out.length; i += 1) out[i] = view.getInt16(i * 2, true) / 32768;
  return out;
}

export type ConexaoAudio = {
  /** Nível (0..1) do microfone e do interlocutor, para os medidores. */
  niveis: () => { mic: number; peer: number };
  setMudo: (mudo: boolean) => void;
  fechar: () => void;
};

function criarMedidor(ctx: AudioContext, origem: AudioNode) {
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  origem.connect(analyser);
  const dados = new Float32Array(analyser.fftSize);
  return () => {
    analyser.getFloatTimeDomainData(dados);
    let soma = 0;
    for (let i = 0; i < dados.length; i += 1) soma += dados[i] * dados[i];
    const db = 20 * Math.log10(Math.sqrt(soma / dados.length) || 1e-6);
    return Math.max(0, Math.min(1, (db + 60) / 60));
  };
}

export async function abrirAudio(sessionId: string, callId: string, micDeviceId?: string | null): Promise<ConexaoAudio> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Este navegador não permite usar o microfone (é preciso HTTPS)");
  }
  const micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      ...(micDeviceId ? { deviceId: { exact: micDeviceId } } : {}),
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
    },
  });

  const recursos: Array<() => void> = [() => micStream.getTracks().forEach((t) => t.stop())];
  const fechar = () => {
    for (const r of recursos.splice(0).reverse()) {
      try {
        r();
      } catch {}
    }
  };

  try {
    // Taxa nativa: os worklets fazem a conversão para/de 16 kHz.
    const ctx = new AudioContext({ latencyHint: "interactive" });
    recursos.push(() => void ctx.close());
    await ctx.audioWorklet.addModule("/worklets/ligacao-captura.js");
    await ctx.audioWorklet.addModule("/worklets/ligacao-reproducao.js");
    await ctx.resume();

    const pc = new RTCPeerConnection({ iceServers: [] });
    recursos.push(() => pc.close());
    const dc = pc.createDataChannel("pcm", { ordered: true });
    dc.binaryType = "arraybuffer";

    const micSource = ctx.createMediaStreamSource(micStream);
    const captura = new AudioWorkletNode(ctx, "ligacao-captura");
    captura.port.onmessage = (e: MessageEvent<Float32Array>) => {
      if (dc.readyState === "open") dc.send(float32ParaInt16(e.data));
    };
    micSource.connect(captura);
    // Ganho zero até o destino mantém o worklet processando sem tocar o próprio microfone.
    const silencio = ctx.createGain();
    silencio.gain.value = 0;
    captura.connect(silencio).connect(ctx.destination);

    const reproducao = new AudioWorkletNode(ctx, "ligacao-reproducao", { outputChannelCount: [1] });
    reproducao.connect(ctx.destination);
    dc.onmessage = (e: MessageEvent<ArrayBuffer>) => reproducao.port.postMessage(int16ParaFloat32(e.data));

    if (localStorage.getItem(DEBUG_KEY) === "1") {
      reproducao.port.onmessage = (e) =>
        console.info(`[ligacao ${callId}] taxa=${ctx.sampleRate}Hz dcBuf=${dc.bufferedAmount}B`, e.data);
    }

    const nivelMic = criarMedidor(ctx, micSource);
    const nivelPeer = criarMedidor(ctx, reproducao);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await new Promise<void>((resolve) => {
      if (pc.iceGatheringState === "complete") return resolve();
      const timer = setTimeout(resolve, 3000);
      pc.addEventListener("icegatheringstatechange", () => {
        if (pc.iceGatheringState === "complete") {
          clearTimeout(timer);
          resolve();
        }
      });
    });

    const { sdp_answer } = await ligacoesApi<{ sdp_answer: string }>(
      `/sessions/${encodeURIComponent(sessionId)}/calls/${encodeURIComponent(callId)}/webrtc`,
      { method: "POST", body: JSON.stringify({ sdp_offer: pc.localDescription!.sdp }) },
    );
    await pc.setRemoteDescription({ type: "answer", sdp: sdp_answer });

    return {
      niveis: () => ({ mic: nivelMic(), peer: nivelPeer() }),
      setMudo: (mudo) => captura.port.postMessage({ mudo }),
      fechar,
    };
  } catch (e) {
    fechar();
    throw e;
  }
}
