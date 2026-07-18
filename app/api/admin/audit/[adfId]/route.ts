import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async (req, { params }: { params: Promise<{ adfId: string }> }) => {
  requireAdmin(req);
  const { adfId } = await params;
  const rows = await prisma.auditLog.findMany({
    where: { adfId },
    include: { usuario: true },
    orderBy: { criadoEm: "desc" },
  });
  const out = rows.map((r) => ({ ...r, usuario_nome: r.usuario?.nome ?? null }));
  return NextResponse.json(out);
});
