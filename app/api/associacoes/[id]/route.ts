import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const PUT = withErrorHandling(async (req, { params }: { params: Promise<{ id: string }> }) => {
  requireAdmin(req);
  const { id } = await params;
  const { nome, sigla, ativa } = await req.json();
  const existing = await prisma.associacao.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  const row = await prisma.associacao.update({
    where: { id },
    data: {
      nome: nome ?? existing.nome,
      sigla: sigla ?? existing.sigla,
      ativa: ativa ?? existing.ativa,
    },
  });
  return NextResponse.json(row);
});
