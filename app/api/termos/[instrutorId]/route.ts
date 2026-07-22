import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async (req, { params }: { params: Promise<{ instrutorId: string }> }) => {
  requireAdmin(req);
  const { instrutorId } = await params;
  const instrutor = await prisma.instrutor.findUnique({ where: { id: instrutorId }, include: { termo: true } });
  if (!instrutor) return NextResponse.json({ error: "Instrutor não encontrado" }, { status: 404 });

  return NextResponse.json({
    nome: instrutor.nome,
    registro_irata: instrutor.registroIrata,
    cidade: instrutor.termo?.cidade ?? "Rio de Janeiro",
    assinatura_img: instrutor.termo?.assinaturaImg ?? null,
    assinado_em: instrutor.termo?.assinadoEm ?? null,
  });
});
