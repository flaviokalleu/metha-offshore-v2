import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async (req) => {
  requireAuth(req);
  const rows = await prisma.associacao.findMany({ where: { ativa: true }, orderBy: { nome: "asc" } });
  return NextResponse.json(rows);
});

export const POST = withErrorHandling(async (req) => {
  requireAdmin(req);
  const { nome, sigla } = await req.json();
  if (!nome) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  const row = await prisma.associacao.create({ data: { nome, sigla: sigla || null } });
  return NextResponse.json(row, { status: 201 });
});
