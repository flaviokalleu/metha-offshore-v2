import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { withErrorHandling, assertAdfAberta } from "@/lib/api-handler";

const RESULTADOS = ["reprovado", "satisfatorio", "bom", "muito_bom", "excelente"];

export const POST = withErrorHandling(async (req, { params }: { params: Promise<{ id: string; cid: string }> }) => {
  const user = requireAuth(req);
  const { id: adfId, cid } = await params;
  await assertAdfAberta(adfId);
  const body = await req.json();
  let { resultado } = body;
  const { assinatura_candidato, assinatura_instrutor } = body;

  if (!RESULTADOS.includes(resultado)) return NextResponse.json({ error: "Resultado inválido" }, { status: 400 });
  if (!assinatura_candidato) return NextResponse.json({ error: "Assinatura do candidato obrigatória" }, { status: 400 });
  if (!assinatura_instrutor) return NextResponse.json({ error: "Assinatura do instrutor obrigatória" }, { status: 400 });

  const candidato = await prisma.adfCandidato.findFirst({ where: { id: cid, adfId } });
  if (!candidato) return NextResponse.json({ error: "Candidato não encontrado" }, { status: 404 });

  const aprovado = candidato.qtdDiscGraves === 0 && candidato.qtdDiscLeves < 3;
  if (!aprovado) resultado = "reprovado";

  const now = new Date();
  await prisma.$transaction([
    prisma.adfCandidato.update({
      where: { id: cid },
      data: {
        status: "finalizada",
        resultado,
        aprovado,
        assinaturaCandidato: assinatura_candidato,
        assinaturaCandidatoEm: now,
        assinaturaInstrutor: assinatura_instrutor,
        assinaturaInstrutorEm: now,
        cienciaDocumentos: true,
        cienciaDocumentosEm: now,
        finalizadaEm: now,
      },
    }),
    prisma.auditLog.create({
      data: { adfId, candidatoId: cid, usuarioId: user.id, acao: "finalizar_candidato", statusAnterior: "aberta", statusNovo: "finalizada" },
    }),
  ]);

  return NextResponse.json({
    aprovado,
    resultado,
    disc_leves: candidato.qtdDiscLeves,
    disc_graves: candidato.qtdDiscGraves,
  });
});
