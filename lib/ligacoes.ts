import { ApiError } from "@/lib/auth";

/**
 * Cliente server-side do ArendCalls (serviço Go de ligações de voz do WhatsApp).
 * A API_KEY do ArendCalls NUNCA vai para o navegador: todo acesso passa pelas
 * rotas /api/ligacoes/*, que conferem o login do Metha antes de repassar.
 */

const BASE_URL = (process.env.ARENDCALLS_URL ?? "").replace(/\/+$/, "");
const API_KEY = process.env.ARENDCALLS_API_KEY ?? "";

export function ligacoesHabilitadas() {
  return BASE_URL !== "" && API_KEY !== "";
}

export async function arendFetch(path: string, init: RequestInit & { clientId?: string | null } = {}) {
  if (!ligacoesHabilitadas()) throw new ApiError(503, "Ligações não configuradas no servidor");
  const { clientId, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set("X-Api-Key", API_KEY);
  if (clientId) headers.set("X-Client-Id", clientId);
  try {
    return await fetch(`${BASE_URL}${path}`, { ...rest, headers, cache: "no-store" });
  } catch {
    throw new ApiError(502, "Serviço de ligações indisponível");
  }
}

type SessaoArend = { qr?: string; webhookUrl?: string; [k: string]: unknown };

/** Remove dados sensíveis (QR de pareamento, webhook) para quem não é admin. */
export function sanitizarEvento(ev: Record<string, unknown>, admin: boolean): Record<string, unknown> | null {
  if (admin) return ev;
  if (ev.type === "session-qr") return null;
  if (ev.type === "auth-state") return { ...ev, qr: undefined };
  if (ev.type === "session-list" && Array.isArray(ev.sessions)) {
    return { ...ev, sessions: (ev.sessions as SessaoArend[]).map(sanitizarSessao) };
  }
  return ev;
}

export function sanitizarSessao(s: SessaoArend) {
  const resto = { ...s };
  delete resto.qr;
  delete resto.webhookUrl;
  return resto;
}
