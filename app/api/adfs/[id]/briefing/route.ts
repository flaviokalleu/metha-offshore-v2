import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { withErrorHandling, assertAdfAberta } from "@/lib/api-handler";

function serialize(b: Awaited<ReturnType<typeof prisma.briefing.findUnique>>) {
  if (!b) return null;
  return {
    ...b,
    itens_confirmados: JSON.parse(b.itensConfirmados),
    assinaturas_candidatos: JSON.parse(b.assinaturasCandidatos),
  };
}

export const GET = withErrorHandling(async (req, { params }: { params: Promise<{ id: string }> }) => {
  requireAuth(req);
  const { id } = await params;
  const briefing = await prisma.briefing.findUnique({ where: { adfId: id } });
  if (!briefing) return NextResponse.json({ error: "Briefing não encontrado" }, { status: 404 });
  return NextResponse.json(serialize(briefing));
});

export const PUT = withErrorHandling(async (req, { params }: { params: Promise<{ id: string }> }) => {
  requireAuth(req);
  const { id } = await params;
  await assertAdfAberta(id);
  const body = await req.json();
  const { itens_confirmados, temas_abordados, observacoes, assinaturas_candidatos, instrutor_assinatura } = body;

  const existing = await prisma.briefing.findUnique({ where: { adfId: id } });
  if (!existing) return NextResponse.json({ error: "Briefing não encontrado" }, { status: 404 });

  const briefing = await prisma.briefing.update({
    where: { adfId: id },
    data: {
      itensConfirmados: itens_confirmados ? JSON.stringify(itens_confirmados) : existing.itensConfirmados,
      temasAbordados: temas_abordados ?? existing.temasAbordados,
      observacoes: observacoes ?? existing.observacoes,
      assinaturasCandidatos: assinaturas_candidatos ? JSON.stringify(assinaturas_candidatos) : existing.assinaturasCandidatos,
      instrutorAssinatura: instrutor_assinatura ?? existing.instrutorAssinatura,
      instrutorAssinadoEm: instrutor_assinatura ? new Date() : existing.instrutorAssinadoEm,
    },
  });
  return NextResponse.json(serialize(briefing));
});
