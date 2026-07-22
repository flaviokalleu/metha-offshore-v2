import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { documentoPath } from "@/lib/storage";

export const GET = withErrorHandling(async (req, { params }: { params: Promise<{ id: string }> }) => {
  // Autenticação via header (fetch) OU via ?token= (link direto/abrir em nova aba)
  const { searchParams } = new URL(req.url);
  const tokenParam = searchParams.get("token");
  const authedByHeader = getAuthUser(req);
  if (!authedByHeader && !tokenParam) {
    return NextResponse.json({ error: "Token obrigatório ou inválido" }, { status: 401 });
  }
  if (tokenParam) {
    const { verifyAccessToken } = await import("@/lib/auth");
    if (!verifyAccessToken(tokenParam)) return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const { id } = await params;
  const doc = await prisma.documento.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });

  const buffer = await readFile(documentoPath(doc.arquivoNome));
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.nome)}"`,
    },
  });
});
