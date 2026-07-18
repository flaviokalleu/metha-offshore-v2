import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { prisma } from "@/lib/prisma";
import { signAccessToken } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

async function generateTokens(user: { id: string; email: string; perfil: string; nome: string }) {
  const access = signAccessToken(user);
  const refresh = uuid();
  await prisma.refreshToken.create({
    data: { usuarioId: user.id, token: refresh, expiraEm: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });
  return { access, refresh };
}

export const POST = withErrorHandling(async (req) => {
  const { login, senha } = await req.json();
  if (!login || !senha) {
    return NextResponse.json({ error: "Login e senha são obrigatórios" }, { status: 400 });
  }

  // Emails são sempre armazenados em minúsculo (ver criação de usuário); registro IRATA é comparado como veio.
  const user = await prisma.usuario.findFirst({
    where: {
      OR: [{ email: login.toLowerCase() }, { registroIrata: login }],
      NOT: { status: "bloqueado" },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }
  if (user.status === "inativo") {
    return NextResponse.json({ error: "Conta inativa. Contate o administrador." }, { status: 401 });
  }

  const ok = await bcrypt.compare(senha, user.senhaHash);
  if (!ok) {
    const tentativas = user.tentativasLogin + 1;
    const novoStatus = tentativas >= 5 ? "bloqueado" : user.status;
    await prisma.usuario.update({ where: { id: user.id }, data: { tentativasLogin: tentativas, status: novoStatus } });
    const msg = novoStatus === "bloqueado" ? "Conta bloqueada após 5 tentativas. Contate o admin." : "Credenciais inválidas";
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  await prisma.usuario.update({ where: { id: user.id }, data: { tentativasLogin: 0, ultimoLogin: new Date() } });
  const tokens = await generateTokens({ id: user.id, email: user.email, perfil: user.perfil, nome: user.nome });

  return NextResponse.json({
    access_token: tokens.access,
    refresh_token: tokens.refresh,
    user: { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil, registro_irata: user.registroIrata },
  });
});
