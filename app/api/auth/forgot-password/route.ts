import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/api-handler";

export const POST = withErrorHandling(async (req) => {
  const { email } = await req.json();
  const user = await prisma.usuario.findFirst({ where: { email: (email ?? "").toLowerCase() } });
  if (user) {
    const token = uuid();
    await prisma.usuario.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpira: new Date(Date.now() + 30 * 60 * 1000) },
    });
    // Em produção: enviar e-mail com link de reset
    console.log(`[RESET] Token para ${email}: ${token}`);
  }
  return NextResponse.json({ message: "Se o e-mail existir, um link será enviado." });
});
