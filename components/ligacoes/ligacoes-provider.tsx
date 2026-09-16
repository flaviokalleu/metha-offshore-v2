"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { getAccessToken } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { abrirAudio, getClientId, ligacoesApi, type ConexaoAudio } from "@/lib/ligacoes-audio";
import { ChamadaRecebidaDialog } from "@/components/ligacoes/chamada-recebida-dialog";
import { ChamadaAtivaDock } from "@/components/ligacoes/chamada-ativa-dock";

export type EstadoSessao = "connecting" | "qr" | "open" | "stopped" | "logged_out";
export type StatusChamada = "starting" | "ringing" | "connected" | "ended";

export type Sessao = { id: string; name: string; jid: string; state: EstadoSessao; paired: boolean; qr?: string };

export type Chamada = {
  sessionId: string;
  callId: string;
  owner: string | null;
  direction: "outbound" | "inbound";
  peer: string;
  peerName?: string;
  startedAt: number;
  status: StatusChamada;
};

export type ChamadaRecebida = { sessionId: string; callId: string; peer: string; peerName?: string };

type Evento =
  | { type: "session-list"; sessions: Sessao[] }
  | { type: "session-qr"; sessionId: string; qr: string }
  | { type: "auth-state"; sessionId: string; paired: boolean; state: EstadoSessao; qr?: string }
  | { type: "call-list"; calls: Chamada[] }
  | { type: "call-status"; sessionId: string; id: string; owner: string | null; status: StatusChamada; peer: string; peerName?: string; startedAt: number }
  | { type: "call-ended"; sessionId: string; id: string; reason: string }
  | { type: "incoming"; sessionId: string; id: string; peer: string; peerName?: string }
  | { type: "incoming-claimed"; sessionId: string; id: string };

type Ctx = {
  habilitado: boolean;
  conectado: boolean;
  sessoes: Sessao[];
  qrs: Record<string, string>;
  chamadas: Chamada[];
  minhas: Chamada[];
  recebendo: ChamadaRecebida | null;
  /** Momento (ms) em que cada chamada foi atendida, para o cronômetro. */
  atendidaEm: Record<string, number>;
  mudo: Record<string, boolean>;
  espera: Record<string, boolean>;
  receberNesteDispositivo: boolean;
  setReceberNesteDispositivo: (v: boolean) => void;
  recarregarSessoes: () => Promise<void>;
  ligar: (sessionId: string, telefone: string) => Promise<void>;
  atender: () => Promise<void>;
  recusar: () => Promise<void>;
  desligar: (c: Chamada) => Promise<void>;
  alternarEspera: (c: Chamada) => Promise<void>;
  alternarMudo: (c: Chamada) => void;
  niveis: (callId: string) => { mic: number; peer: number } | null;
};

const LigacoesContext = createContext<Ctx | null>(null);
const RECEBER_KEY = "metha_ligacoes_receber";

export function useLigacoes() {
  const ctx = useContext(LigacoesContext);
  if (!ctx) throw new Error("useLigacoes fora do LigacoesProvider");
  return ctx;
}

function mensagemErro(e: unknown) {
  if (e instanceof DOMException && e.name === "NotAllowedError") return "Permissão de microfone negada no navegador";
  if (e instanceof DOMException && e.name === "NotFoundError") return "Nenhum microfone encontrado";
  return e instanceof Error ? e.message : "Erro na ligação";
}

export function LigacoesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [habilitado, setHabilitado] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [qrs, setQrs] = useState<Record<string, string>>({});
  const [chamadas, setChamadas] = useState<Chamada[]>([]);
  const [recebendo, setRecebendo] = useState<ChamadaRecebida | null>(null);
  const [atendidaEm, setAtendidaEm] = useState<Record<string, number>>({});
  const [mudo, setMudo] = useState<Record<string, boolean>>({});
  const [espera, setEspera] = useState<Record<string, boolean>>({});
  // O provider só monta com usuário logado e no navegador (o layout espera o login).
  const [receberNesteDispositivo, setReceber] = useState(() => {
    const salvo = typeof window === "undefined" ? null : localStorage.getItem(RECEBER_KEY);
    return salvo === null ? user?.perfil === "admin" : salvo === "1";
  });
  const conexoes = useRef(new Map<string, { audio: ConexaoAudio; criadaEm: number }>());

  const clientId = typeof window === "undefined" ? "" : getClientId();

  const setReceberNesteDispositivo = useCallback((v: boolean) => {
    localStorage.setItem(RECEBER_KEY, v ? "1" : "0");
    setReceber(v);
  }, []);

  const fecharConexao = useCallback((callId: string) => {
    const c = conexoes.current.get(callId);
    if (!c) return;
    c.audio.fechar();
    conexoes.current.delete(callId);
  }, []);

  const recarregarSessoes = useCallback(async () => {
    const r = await ligacoesApi<{ sessions: Sessao[] }>("/sessions");
    setSessoes(r.sessions ?? []);
  }, []);

  // Descobre se o servidor tem o ArendCalls configurado.
  useEffect(() => {
    if (!user) return;
    ligacoesApi<{ habilitado: boolean }>("/status")
      .then((r) => setHabilitado(r.habilitado))
      .catch(() => setHabilitado(false));
  }, [user]);

  // Stream de eventos em tempo real (sessões, QR, chamadas).
  useEffect(() => {
    if (!user || !habilitado) return;
    let es: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let ativo = true;

    const tratar = (ev: Evento) => {
      switch (ev.type) {
        case "session-list":
          setSessoes(ev.sessions);
          // Ao (re)conectar, o QR atual vem só aqui (só admin recebe o campo qr).
          setQrs(() => {
            const n: Record<string, string> = {};
            for (const x of ev.sessions) if (!x.paired && x.qr) n[x.id] = x.qr;
            return n;
          });
          break;
        case "session-qr":
          setQrs((q) => ({ ...q, [ev.sessionId]: ev.qr }));
          break;
        case "auth-state":
          setSessoes((s) => s.map((x) => (x.id === ev.sessionId ? { ...x, state: ev.state, paired: ev.paired } : x)));
          setQrs((q) => {
            const n = { ...q };
            if (ev.paired || !ev.qr) delete n[ev.sessionId];
            else n[ev.sessionId] = ev.qr;
            return n;
          });
          break;
        case "call-list": {
          setChamadas(ev.calls);
          const ids = new Set(ev.calls.map((c) => c.callId));
          for (const [id, c] of conexoes.current) {
            if (!ids.has(id) && Date.now() - c.criadaEm > 5000) fecharConexao(id);
          }
          setAtendidaEm((a) => {
            const n = { ...a };
            for (const c of ev.calls) if (c.status === "connected" && !n[c.callId]) n[c.callId] = Date.now();
            return n;
          });
          break;
        }
        case "call-status":
          setChamadas((cs) =>
            cs.map((c) =>
              c.callId === ev.id
                ? { ...c, status: ev.status, peer: ev.peer, peerName: ev.peerName ?? c.peerName, owner: ev.owner ?? c.owner }
                : c,
            ),
          );
          if (ev.status === "connected") setAtendidaEm((a) => (a[ev.id] ? a : { ...a, [ev.id]: Date.now() }));
          break;
        case "call-ended":
          fecharConexao(ev.id);
          setChamadas((cs) => cs.filter((c) => c.callId !== ev.id));
          setRecebendo((r) => (r?.callId === ev.id ? null : r));
          break;
        case "incoming":
          setRecebendo({ sessionId: ev.sessionId, callId: ev.id, peer: ev.peer, peerName: ev.peerName });
          break;
        case "incoming-claimed":
          setRecebendo((r) => (r?.callId === ev.id ? null : r));
          break;
      }
    };

    const conectar = async () => {
      if (!ativo) return;
      // Garante token válido (o api-client renova se tiver expirado) antes de abrir o stream.
      try {
        await recarregarSessoes();
      } catch {
        retry = setTimeout(conectar, 10000);
        return;
      }
      const token = getAccessToken();
      if (!ativo || !token) return;
      es = new EventSource(`/api/ligacoes/events?token=${encodeURIComponent(token)}&clientId=${encodeURIComponent(clientId)}`);
      es.onopen = () => setConectado(true);
      es.onmessage = (m) => {
        try {
          tratar(JSON.parse(m.data));
        } catch {}
      };
      es.onerror = () => {
        setConectado(false);
        es?.close();
        es = null;
        retry = setTimeout(conectar, 5000);
      };
    };
    void conectar();

    return () => {
      ativo = false;
      clearTimeout(retry);
      es?.close();
      setConectado(false);
    };
  }, [user, habilitado, clientId, recarregarSessoes, fecharConexao]);

  // Fecha todo áudio ao sair do app (logout / desmontagem).
  useEffect(() => {
    const mapa = conexoes.current;
    return () => {
      for (const c of mapa.values()) c.audio.fechar();
      mapa.clear();
    };
  }, []);

  const conectarAudio = useCallback(async (sessionId: string, callId: string) => {
    try {
      const audio = await abrirAudio(sessionId, callId);
      conexoes.current.set(callId, { audio, criadaEm: Date.now() });
    } catch (e) {
      await ligacoesApi(`/sessions/${encodeURIComponent(sessionId)}/calls/${encodeURIComponent(callId)}`, { method: "DELETE" }).catch(() => {});
      throw e;
    }
  }, []);

  const ligar = useCallback(
    async (sessionId: string, telefone: string) => {
      if (!window.isSecureContext) throw new Error("Ligações exigem HTTPS: o navegador bloqueia o microfone em HTTP");
      const { call } = await ligacoesApi<{ call: { callId: string } }>(`/sessions/${encodeURIComponent(sessionId)}/calls`, {
        method: "POST",
        body: JSON.stringify({ phone: telefone }),
      });
      await conectarAudio(sessionId, call.callId);
    },
    [conectarAudio],
  );

  const atender = useCallback(async () => {
    const r = recebendo;
    if (!r) return;
    try {
      if (!window.isSecureContext) throw new Error("Ligações exigem HTTPS: o navegador bloqueia o microfone em HTTP");
      await ligacoesApi(`/sessions/${encodeURIComponent(r.sessionId)}/calls/${encodeURIComponent(r.callId)}/accept`, { method: "POST" });
      setRecebendo(null);
      await conectarAudio(r.sessionId, r.callId);
    } catch (e) {
      setRecebendo(null);
      toast.error(mensagemErro(e));
    }
  }, [recebendo, conectarAudio]);

  const recusar = useCallback(async () => {
    const r = recebendo;
    if (!r) return;
    setRecebendo(null);
    await ligacoesApi(`/sessions/${encodeURIComponent(r.sessionId)}/calls/${encodeURIComponent(r.callId)}/reject`, { method: "POST" }).catch(
      (e) => toast.error(mensagemErro(e)),
    );
  }, [recebendo]);

  const desligar = useCallback(
    async (c: Chamada) => {
      fecharConexao(c.callId);
      setChamadas((cs) => cs.filter((x) => x.callId !== c.callId));
      await ligacoesApi(`/sessions/${encodeURIComponent(c.sessionId)}/calls/${encodeURIComponent(c.callId)}`, { method: "DELETE" }).catch(() => {});
    },
    [fecharConexao],
  );

  const alternarEspera = useCallback(
    async (c: Chamada) => {
      const novo = !espera[c.callId];
      try {
        await ligacoesApi(`/sessions/${encodeURIComponent(c.sessionId)}/calls/${encodeURIComponent(c.callId)}/${novo ? "hold" : "unhold"}`, {
          method: "POST",
          body: JSON.stringify({ mode: "hold" }),
        });
        setEspera((e) => ({ ...e, [c.callId]: novo }));
      } catch (e) {
        toast.error(mensagemErro(e));
      }
    },
    [espera],
  );

  const alternarMudo = useCallback(
    (c: Chamada) => {
      const novo = !mudo[c.callId];
      conexoes.current.get(c.callId)?.audio.setMudo(novo);
      setMudo((m) => ({ ...m, [c.callId]: novo }));
    },
    [mudo],
  );

  const niveis = useCallback((callId: string) => conexoes.current.get(callId)?.audio.niveis() ?? null, []);

  const minhas = chamadas.filter((c) => c.owner === clientId && c.status !== "ended");

  const value: Ctx = {
    habilitado,
    conectado,
    sessoes,
    qrs,
    chamadas,
    minhas,
    recebendo,
    atendidaEm,
    mudo,
    espera,
    receberNesteDispositivo,
    setReceberNesteDispositivo,
    recarregarSessoes,
    ligar: async (sid, tel) => {
      try {
        await ligar(sid, tel);
      } catch (e) {
        toast.error(mensagemErro(e));
        throw e;
      }
    },
    atender,
    recusar,
    desligar,
    alternarEspera,
    alternarMudo,
    niveis,
  };

  return (
    <LigacoesContext.Provider value={value}>
      {children}
      {habilitado && (
        <>
          <ChamadaRecebidaDialog />
          <ChamadaAtivaDock />
        </>
      )}
    </LigacoesContext.Provider>
  );
}
