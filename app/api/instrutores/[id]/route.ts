import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const PUT = withErrorHandling(async (req, { params }: { params: Promise<{ id: string }> }) => {
  requireAdmin(req);
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.nome !== undefined) data.nome = body.nome;
  if (body.registro_irata !== undefined) data.registroIrata = body.registro_irata;
  if (body.nivel !== undefined) data.nivel = Number(body.nivel);
  if (body.email !== undefined) data.email = body.email;
  if (body.telefone !== undefined) data.telefone = body.telefone;
  if (body.ativo !== undefined) data.ativo = body.ativo;

  const existing = await prisma.instrutor.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Instrutor não encontrado" }, { status: 404 });

  const row = await prisma.instrutor.update({ where: { id }, data });
  return NextResponse.json(row);
});
