import { NextResponse, type NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { arendFetch, ligacoesHabilitadas, sanitizarEvento } from "@/lib/ligacoes";

/**
 * Repassa o stream de eventos (SSE) do ArendCalls para o navegador.
 * EventSource não envia headers, então o token vem em ?token=.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const user = verifyAccessToken(searchParams.get("token") ?? "");
  if (!user) return NextResponse.json({ error: "Token obrigatório ou inválido" }, { status: 401 });
  if (!ligacoesHabilitadas()) return NextResponse.json({ error: "Ligações não configuradas no servidor" }, { status: 503 });

  const clientId = searchParams.get("clientId");
  const upstream = new AbortController();
  req.signal.addEventListener("abort", () => upstream.abort());

  let res: Response;
  try {
    res = await arendFetch(`/api/events?clientId=${encodeURIComponent(clientId ?? "")}`, {
      clientId,
      signal: upstream.signal,
    });
  } catch {
    return NextResponse.json({ error: "Serviço de ligações indisponível" }, { status: 502 });
  }
  if (!res.ok || !res.body) {
    upstream.abort();
    return NextResponse.json({ error: "Serviço de ligações indisponível" }, { status: 502 });
  }

  const admin = user.perfil === "admin";
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  // Cada evento SSE termina em "\n\n". Filtra campo a campo o que o usuário pode ver.
  const filtro = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      let fim: number;
      while ((fim = buffer.indexOf("\n\n")) !== -1) {
        const bloco = buffer.slice(0, fim);
        buffer = buffer.slice(fim + 2);
        if (!bloco.startsWith("data: ")) {
          controller.enqueue(encoder.encode(bloco + "\n\n")); // keepalive (": ping")
          continue;
        }
        try {
          const ev = sanitizarEvento(JSON.parse(bloco.slice(6)), admin);
          if (ev) controller.enqueue(encoder.encode(`data: ${JSON.stringify(ev)}\n\n`));
        } catch {
          // evento malformado: descarta
        }
      }
    },
  });

  return new Response(res.body.pipeThrough(filtro), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // nginx: não bufferizar o stream
    },
  });
}
