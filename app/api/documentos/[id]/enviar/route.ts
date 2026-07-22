import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { enviarEmail, emailConfigurado } from "@/lib/email";
import { documentoPath } from "@/lib/storage";

export const POST = withErrorHandling(async (req, { params }: { params: Promise<{ id: string }> }) => {
  requireAdmin(req);
  const { id } = await params;
  const body = await req.json();
  const { destinatarios, mensagem } = body as { destinatarios: { email: string; nome: string }[]; mensagem?: string };

  if (!emailConfigurado()) {
    return NextResponse.json({ error: "Servidor de e-mail não configurado" }, { status: 400 });
  }
  if (!Array.isArray(destinatarios) || destinatarios.length === 0) {
    return NextResponse.json({ error: "Selecione ao menos um destinatário" }, { status: 400 });
  }

  const doc = await prisma.documento.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#111">
      <h2 style="color:#0E1B26">Metha Offshore</h2>
      <p>Segue em anexo o documento <strong>${doc.nome}</strong>.</p>
      ${mensagem ? `<p>${mensagem.replace(/\n/g, "<br/>")}</p>` : ""}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
      <p style="font-size:12px;color:#64748b">E-mail enviado automaticamente pelo sistema Metha Offshore.</p>
    </div>`;

  const enviados: string[] = [];
  const falhas: string[] = [];
  for (const dest of destinatarios) {
    if (!dest.email) continue;
    try {
      await enviarEmail({
        para: dest.email,
        assunto: `Metha Offshore — ${doc.nome}`,
        html,
        anexos: [{ filename: doc.nome, path: documentoPath(doc.arquivoNome) }],
      });
      enviados.push(dest.nome || dest.email);
    } catch (e) {
      console.error(`Falha ao enviar documento para ${dest.email}`, e);
      falhas.push(dest.nome || dest.email);
    }
  }

  return NextResponse.json({ enviados, falhas });
});
