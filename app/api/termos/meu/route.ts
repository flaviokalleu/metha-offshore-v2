import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ApiError } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

async function instrutorDoUsuario(userId: string) {
  const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
  if (!usuario?.instrutorId) throw new ApiError(403, "Este usuário não está vinculado a um cadastro de instrutor");
  const instrutor = await prisma.instrutor.findUnique({ where: { id: usuario.instrutorId }, include: { termo: true } });
  if (!instrutor) throw new ApiError(404, "Instrutor não encontrado");
  return instrutor;
}

export const GET = withErrorHandling(async (req) => {
  const user = requireAuth(req);
  const instrutor = await instrutorDoUsuario(user.id);
  return NextResponse.json({
    nome: instrutor.nome,
    registro_irata: instrutor.registroIrata,
    cidade: instrutor.termo?.cidade ?? "Rio de Janeiro",
    assinatura_img: instrutor.termo?.assinaturaImg ?? null,
    assinado_em: instrutor.termo?.assinadoEm ?? null,
  });
});

export const PUT = withErrorHandling(async (req) => {
  const user = requireAuth(req);
  const instrutor = await instrutorDoUsuario(user.id);
  const { cidade, assinatura_img } = await req.json();
  if (!assinatura_img) return NextResponse.json({ error: "Assinatura obrigatória" }, { status: 400 });

  const termo = await prisma.termoInstrutor.upsert({
    where: { instrutorId: instrutor.id },
    update: { cidade: cidade || "Rio de Janeiro", assinaturaImg: assinatura_img, assinadoEm: new Date() },
    create: { instrutorId: instrutor.id, cidade: cidade || "Rio de Janeiro", assinaturaImg: assinatura_img, assinadoEm: new Date() },
  });
  return NextResponse.json(termo);
});
