import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const PUT = withErrorHandling(async (req, { params }: { params: Promise<{ id: string }> }) => {
  requireAdmin(req);
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.usuario.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  if (
    body.nome === undefined &&
    body.email === undefined &&
    body.perfil === undefined &&
    body.registro_irata === undefined &&
    body.status === undefined &&
    body.instrutor_id === undefined
  ) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const row = await prisma.usuario.update({
    where: { id },
    data: {
      nome: body.nome ?? existing.nome,
      email: body.email ? body.email.toLowerCase() : existing.email,
      perfil: body.perfil ?? existing.perfil,
      registroIrata: body.registro_irata !== undefined ? body.registro_irata : existing.registroIrata,
      status: body.status ?? existing.status,
      tentativasLogin: body.status ? 0 : existing.tentativasLogin,
      instrutorId: body.instrutor_id !== undefined ? body.instrutor_id : existing.instrutorId,
    },
    select: { id: true, nome: true, email: true, perfil: true, status: true },
  });
  return NextResponse.json(row);
});
