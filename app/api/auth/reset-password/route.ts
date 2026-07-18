import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/api-handler";

export const POST = withErrorHandling(async (req) => {
  const { token, nova_senha } = await req.json();
  if (!token || !nova_senha || nova_senha.length < 8) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const user = await prisma.usuario.findFirst({
    where: { resetToken: token, resetTokenExpira: { gt: new Date() } },
  });
  if (!user) return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 });

  const senhaHash = await bcrypt.hash(nova_senha, 12);
  await prisma.usuario.update({
    where: { id: user.id },
    data: { senhaHash, resetToken: null, resetTokenExpira: null },
  });
  return NextResponse.json({ message: "Senha alterada com sucesso" });
});
