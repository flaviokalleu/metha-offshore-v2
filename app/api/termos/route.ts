import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async (req) => {
  requireAdmin(req);
  const instrutores = await prisma.instrutor.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    include: { termo: true },
  });
  const out = instrutores.map((i) => ({
    id: i.id,
    nome: i.nome,
    registroIrata: i.registroIrata,
    email: i.email,
    ativo: i.ativo,
    termo_assinado: Boolean(i.termo?.assinadoEm),
    termo_assinado_em: i.termo?.assinadoEm ?? null,
    termo_enviado_em: i.termo?.enviadoEm ?? null,
  }));
  return NextResponse.json(out);
});
