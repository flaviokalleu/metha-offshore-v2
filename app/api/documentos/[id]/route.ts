import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { documentoPath } from "@/lib/storage";

export const DELETE = withErrorHandling(async (req, { params }: { params: Promise<{ id: string }> }) => {
  requireAdmin(req);
  const { id } = await params;
  const doc = await prisma.documento.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });

  await prisma.documento.delete({ where: { id } });
  await unlink(documentoPath(doc.arquivoNome)).catch(() => {});
  return NextResponse.json({ message: "Documento removido" });
});
