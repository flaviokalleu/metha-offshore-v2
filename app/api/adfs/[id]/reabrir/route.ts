import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const POST = withErrorHandling(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const user = requireAdmin(req);
  const { id } = await params;
  const { justificativa } = await req.json();
  if (!justificativa?.trim()) return NextResponse.json({ error: "Justificativa obrigatória" }, { status: 400 });

  await prisma.adf.update({ where: { id }, data: { status: "reaberta" } });
  await prisma.auditLog.create({
    data: {
      adfId: id,
      usuarioId: user.id,
      acao: "reabrir",
      statusAnterior: "finalizada",
      statusNovo: "reaberta",
      justificativa,
    },
  });
  return NextResponse.json({ message: "ADF reaberta" });
});
