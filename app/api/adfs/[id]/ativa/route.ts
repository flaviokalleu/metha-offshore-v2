import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const POST = withErrorHandling(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const user = requireAuth(req);
  const { id } = await params;
  const { ativa } = await req.json();
  if (typeof ativa !== "boolean") return NextResponse.json({ error: "ativa deve ser true ou false" }, { status: 400 });

  const adf = await prisma.adf.findUnique({ where: { id } });
  if (!adf) return NextResponse.json({ error: "ADF não encontrada" }, { status: 404 });

  await prisma.$transaction([
    prisma.adf.update({ where: { id }, data: { ativa } }),
    prisma.auditLog.create({
      data: { adfId: id, usuarioId: user.id, acao: ativa ? "ativar_adf" : "desativar_adf" },
    }),
  ]);

  return NextResponse.json({ message: ativa ? "ADF ativada" : "ADF desativada" });
});
