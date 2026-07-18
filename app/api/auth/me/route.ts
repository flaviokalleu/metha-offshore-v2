import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async (req) => {
  const authUser = requireAuth(req);
  const user = await prisma.usuario.findUnique({
    where: { id: authUser.id },
    select: { id: true, nome: true, email: true, perfil: true, registroIrata: true, status: true, ultimoLogin: true },
  });
  return NextResponse.json(user);
});
