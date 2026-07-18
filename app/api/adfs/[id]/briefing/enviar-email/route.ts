import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { enviarEmail, emailConfigurado } from "@/lib/email";

const ITENS = [
  "Objetivo e cronograma da ADF",
  "Regras gerais de segurança do local",
  "Rotas de fuga e pontos de encontro",
  "Uso obrigatório de EPI",
  "Procedimentos de emergência e resgate",
  "Comunicação durante os exercícios",
  "Critérios de avaliação e discrepâncias",
  "Política de reprovação e reavaliação",
  "Cuidados com o equipamento",
  "Condições climáticas e suspensão de atividades",
  "Áreas restritas e sinalização",
  "Contatos de emergência",
  "Dúvidas e esclarecimentos gerais",
];

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const POST = withErrorHandling(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const user = requireAuth(req);
  const { id } = await params;

  if (!emailConfigurado()) {
    return NextResponse.json(
      { error: "Servidor de e-mail não configurado. Defina SMTP_HOST, SMTP_USER e SMTP_PASS no .env" },
      { status: 400 }
    );
  }

  const adf = await prisma.adf.findUnique({ where: { id }, include: { associacao: true, instrutor: true } });
  if (!adf) return NextResponse.json({ error: "ADF não encontrada" }, { status: 404 });

  const briefing = await prisma.briefing.findUnique({ where: { adfId: id } });
  if (!briefing) return NextResponse.json({ error: "Briefing não encontrado" }, { status: 404 });

  const candidatos = await prisma.adfCandidato.findMany({ where: { adfId: id, ativo: true }, orderBy: { candidatoNome: "asc" } });
  const comEmail = candidatos.filter((c) => c.candidatoEmail);
  const semEmail = candidatos.filter((c) => !c.candidatoEmail).map((c) => c.candidatoNome);

  if (comEmail.length === 0) {
    return NextResponse.json({ error: "Nenhum candidato possui e-mail cadastrado" }, { status: 400 });
  }

  const confirmados: boolean[] = JSON.parse(briefing.itensConfirmados);
  const itensHtml = ITENS.map(
    (item, i) =>
      `<li style="margin:4px 0">${confirmados[i] ? "✅" : "⬜"} ${esc(item)}</li>`
  ).join("");

  const periodo = `${adf.dataInicio.toLocaleDateString("pt-BR")} a ${adf.dataTermino.toLocaleDateString("pt-BR")}`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#111">
      <h2 style="color:#0f172a">Briefing de Segurança — ADF ${esc(adf.numeroAdf)}</h2>
      <p><strong>Associação:</strong> ${esc(adf.associacao.nome)}<br/>
      <strong>Instrutor:</strong> ${esc(adf.instrutor.nome)} (IRATA ${esc(adf.instrutor.registroIrata)})<br/>
      <strong>Período:</strong> ${periodo}</p>
      <h3>Itens abordados no briefing</h3>
      <ul style="list-style:none;padding-left:0">${itensHtml}</ul>
      ${briefing.temasAbordados ? `<h3>Temas abordados</h3><p>${esc(briefing.temasAbordados)}</p>` : ""}
      ${briefing.observacoes ? `<h3>Observações</h3><p>${esc(briefing.observacoes)}</p>` : ""}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
      <p style="font-size:12px;color:#64748b">E-mail enviado automaticamente pelo sistema Metha Offshore por ${esc(user.nome)}.</p>
    </div>`;

  const enviados: string[] = [];
  const falhas: string[] = [];
  for (const c of comEmail) {
    try {
      await enviarEmail({
        para: c.candidatoEmail!,
        assunto: `Briefing de Segurança — ADF ${adf.numeroAdf}`,
        html,
      });
      enviados.push(c.candidatoNome);
    } catch (e) {
      console.error(`Falha ao enviar briefing para ${c.candidatoEmail}`, e);
      falhas.push(c.candidatoNome);
    }
  }

  await prisma.auditLog.create({
    data: { adfId: id, usuarioId: user.id, acao: "enviar_briefing_email", justificativa: `Enviados: ${enviados.length}, falhas: ${falhas.length}` },
  });

  return NextResponse.json({ enviados, falhas, sem_email: semEmail });
});
