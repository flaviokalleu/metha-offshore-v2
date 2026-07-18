import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { prisma } from "@/lib/prisma";
import { signAccessToken } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const POST = withErrorHandling(async (req) => {
  const { refresh_token } = await req.json();
  if (!refresh_token) return NextResponse.json({ error: "refresh_token obrigatório" }, { status: 400 });

  const rt = await prisma.refreshToken.findFirst({
    where: { token: refresh_token, revogado: false, expiraEm: { gt: new Date() } },
    include: { usuario: true },
  });
  if (!rt) return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 401 });

  await prisma.refreshToken.update({ where: { id: rt.id }, data: { revogado: true } });

  const access = signAccessToken({ id: rt.usuario.id, email: rt.usuario.email, perfil: rt.usuario.perfil, nome: rt.usuario.nome });
  const refresh = uuid();
  await prisma.refreshToken.create({
    data: { usuarioId: rt.usuario.id, token: refresh, expiraEm: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });

  return NextResponse.json({ access_token: access, refresh_token: refresh });
});
