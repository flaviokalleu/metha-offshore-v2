import { NextResponse, type NextRequest } from "next/server";
import { ApiError, requireAdmin, requireAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { arendFetch, ligacoesHabilitadas, sanitizarSessao } from "@/lib/ligacoes";

type Ctx = { params: Promise<{ path: string[] }> };

const ACOES_SESSAO = new Set(["logout", "pair", "start", "restart", "stop"]);
const ACOES_CHAMADA = new Set(["webrtc", "accept", "reject", "hold", "unhold"]);

// Mensagens do ArendCalls que chegam em inglês → português para a interface.
const TRADUCOES: Record<string, string> = {
  "operator already on a call": "Você já está em uma ligação",
  "max concurrent calls": "Limite de ligações simultâneas atingido",
  "not paired": "WhatsApp não conectado. Leia o QR code na tela de ligações.",
  "claimed by another client": "Essa chamada já foi atendida por outra pessoa",
  "no such call": "Chamada não encontrada (pode já ter sido encerrada)",
  "no such session": "Conta de WhatsApp não encontrada",
  "phone required": "Informe o número de telefone",
};

/**
 * Define quem pode acessar cada rota do ArendCalls. Retorna null para rotas
 * não permitidas — nada fora desta lista é repassado ao serviço.
 */
function nivelDeAcesso(method: string, path: string[]): "auth" | "admin" | null {
  const [raiz, sid, sub, , acao] = path;
  if (raiz !== "sessions") return null;
  const n = path.length;

  if (n === 1) return method === "GET" ? "auth" : method === "POST" ? "admin" : null;
  if (!sid) return null;
  if (n === 2) return method === "PATCH" || method === "DELETE" ? "admin" : null;
  if (n === 3 && method === "POST" && ACOES_SESSAO.has(sub)) return "admin";
  if (n === 3 && method === "GET" && sub === "history") return "auth";
  if (sub !== "calls") return null;
  if (n === 3) return method === "POST" ? "auth" : null;
  if (n === 4) return method === "DELETE" ? "auth" : null;
  if (n === 5 && method === "POST" && ACOES_CHAMADA.has(acao)) return "auth";
  return null;
}

async function proxy(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;

  if (path.length === 1 && path[0] === "status" && req.method === "GET") {
    requireAuth(req);
    return NextResponse.json({ habilitado: ligacoesHabilitadas() });
  }

  const nivel = nivelDeAcesso(req.method, path);
  if (!nivel) throw new ApiError(404, "Rota não encontrada");
  const user = nivel === "admin" ? requireAdmin(req) : requireAuth(req);

  const body = req.method === "GET" || req.method === "DELETE" ? undefined : await req.text();
  const res = await arendFetch(`/api/${path.map(encodeURIComponent).join("/")}`, {
    method: req.method,
    body: body || (req.method === "POST" ? "{}" : undefined),
    headers: { "Content-Type": "application/json" },
    clientId: req.headers.get("x-client-id"),
  });

  if (res.status === 204) return new NextResponse(null, { status: 204 });

  const texto = await res.text();
  let data: unknown = null;
  try {
    data = texto ? JSON.parse(texto) : null;
  } catch {
    data = { error: texto };
  }

  if (!res.ok) {
    const msg = (data as { error?: string } | null)?.error ?? "Erro no serviço de ligações";
    const status = res.status === 401 ? 502 : res.status; // 401 do ArendCalls = API key errada no servidor
    if (res.status === 401) console.error("[ligacoes] ArendCalls recusou a ARENDCALLS_API_KEY");
    return NextResponse.json({ error: TRADUCOES[msg] ?? msg }, { status });
  }

  // Lista de contas: quem não é admin não vê QR code nem webhook.
  if (path.length === 1 && req.method === "GET" && user.perfil !== "admin") {
    const sessoes = (data as { sessions?: Record<string, unknown>[] } | null)?.sessions ?? [];
    data = { sessions: sessoes.map(sanitizarSessao) };
  }

  return NextResponse.json(data, { status: res.status });
}

export const GET = withErrorHandling(proxy);
export const POST = withErrorHandling(proxy);
export const PATCH = withErrorHandling(proxy);
export const DELETE = withErrorHandling(proxy);
