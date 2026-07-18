import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async (req) => {
  requireAdmin(req);
  const rows = await prisma.usuario.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, email: true, perfil: true, registroIrata: true, status: true, criadoEm: true, ultimoLogin: true },
  });
  return NextResponse.json(rows);
});

export const POST = withErrorHandling(async (req) => {
  requireAdmin(req);
  const body = await req.json();
  const { nome, email, senha, perfil, registro_irata, instrutor_id } = body;

  if (!nome || !email || !senha || senha.length < 8 || !["instrutor", "admin"].includes(perfil)) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const senhaHash = await bcrypt.hash(senha, 12);
  const row = await prisma.usuario.create({
    data: {
      nome,
      email: email.toLowerCase(),
      senhaHash,
      perfil,
      registroIrata: registro_irata || null,
      instrutorId: instrutor_id || null,
    },
    select: { id: true, nome: true, email: true, perfil: true, status: true },
  });
  return NextResponse.json(row, { status: 201 });
});
