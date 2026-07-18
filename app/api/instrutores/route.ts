import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async (req) => {
  requireAuth(req);
  // ?todos=1 inclui inativos (usado na tela de administração)
  const todos = new URL(req.url).searchParams.get("todos") === "1";
  const rows = await prisma.instrutor.findMany({
    where: todos ? {} : { ativo: true },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });
  return NextResponse.json(rows);
});

export const POST = withErrorHandling(async (req) => {
  requireAdmin(req);
  const { nome, registro_irata, nivel, email, telefone } = await req.json();
  if (!nome || !registro_irata || ![1, 2, 3].includes(Number(nivel))) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const row = await prisma.instrutor.create({
    data: { nome, registroIrata: registro_irata, nivel: Number(nivel), email: email || null, telefone: telefone || null },
  });
  return NextResponse.json(row, { status: 201 });
});
