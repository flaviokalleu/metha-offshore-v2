import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const PUT = withErrorHandling(async (req, { params }: { params: Promise<{ id: string }> }) => {
  requireAdmin(req);
  const { id } = await params;
  const { nova_senha } = await req.json();
  if (!nova_senha || nova_senha.length < 8) {
    return NextResponse.json({ error: "Senha mínima: 8 caracteres" }, { status: 400 });
  }
  const senhaHash = await bcrypt.hash(nova_senha, 12);
  await prisma.usuario.update({ where: { id }, data: { senhaHash } });
  return NextResponse.json({ message: "Senha atualizada" });
});
