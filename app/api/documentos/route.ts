import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { ensureDocumentosDir, documentoPath } from "@/lib/storage";

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export const GET = withErrorHandling(async (req) => {
  requireAuth(req);
  const rows = await prisma.documento.findMany({ orderBy: { criadoEm: "desc" } });
  return NextResponse.json(rows);
});

export const POST = withErrorHandling(async (req) => {
  const user = requireAdmin(req);
  const form = await req.formData();
  const file = form.get("arquivo");
  const nome = (form.get("nome") as string) || "";

  if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
  if (!nome.trim()) return NextResponse.json({ error: "Nome do documento obrigatório" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Arquivo maior que 20MB" }, { status: 400 });

  ensureDocumentosDir();
  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const arquivoNome = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(documentoPath(arquivoNome), buffer);

  const row = await prisma.documento.create({
    data: {
      nome: nome.trim(),
      arquivoNome,
      mimeType: file.type || "application/octet-stream",
      tamanho: file.size,
      criadoPor: user.id,
    },
  });
  return NextResponse.json(row, { status: 201 });
});
