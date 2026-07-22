import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { enviarEmail, emailConfigurado } from "@/lib/email";

export const POST = withErrorHandling(async (req) => {
  requireAdmin(req);
  const { instrutor_ids } = await req.json();
  if (!Array.isArray(instrutor_ids) || instrutor_ids.length === 0) {
    return NextResponse.json({ error: "Selecione ao menos um instrutor" }, { status: 400 });
  }
  if (!emailConfigurado()) {
    return NextResponse.json({ error: "Servidor de e-mail não configurado" }, { status: 400 });
  }

  const instrutores = await prisma.instrutor.findMany({ where: { id: { in: instrutor_ids } } });
  const enviados: string[] = [];
  const semEmail: string[] = [];
  const falhas: string[] = [];

  const siteUrl = process.env.SITE_URL || "https://adf.168-231-97-94.sslip.io";

  for (const instr of instrutores) {
    if (!instr.email) {
      semEmail.push(instr.nome);
      continue;
    }
    await prisma.termoInstrutor.upsert({
      where: { instrutorId: instr.id },
      update: { enviadoEm: new Date() },
      create: { instrutorId: instr.id, enviadoEm: new Date() },
    });

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#111">
        <h2 style="color:#0E1B26">Metha Offshore</h2>
        <p>Olá, ${instr.nome}.</p>
        <p>Foi enviado a você o <strong>Termo de Ciência e Recebimento de Documentos</strong> (TACs, ICOP, Análise de risco do CT,
        Boletins de Segurança, Folhas de Tópicos e demais materiais de indução de instrutores).</p>
        <p>Acesse o sistema Metha Offshore, faça login e vá em <strong>Meu Termo</strong> para ler e assinar eletronicamente.</p>
        <p><a href="${siteUrl}/login" style="display:inline-block;background:#FF7420;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold">Acessar o sistema</a></p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
        <p style="font-size:12px;color:#64748b">E-mail enviado automaticamente pelo sistema Metha Offshore.</p>
      </div>`;

    try {
      await enviarEmail({ para: instr.email, assunto: "Metha Offshore — Termo de Ciência para assinatura", html });
      enviados.push(instr.nome);
    } catch (e) {
      console.error(`Falha ao enviar termo para ${instr.email}`, e);
      falhas.push(instr.nome);
    }
  }

  return NextResponse.json({ enviados, sem_email: semEmail, falhas });
});
