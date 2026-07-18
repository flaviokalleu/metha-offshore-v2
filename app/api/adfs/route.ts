import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async (req) => {
  const user = requireAuth(req);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  if (user.perfil !== "admin") {
    // instrutor vê apenas ADFs que criou ou onde é o instrutor responsável
    const usuario = await prisma.usuario.findUnique({ where: { id: user.id } });
    where.OR = [
      { criadoPor: user.id },
      usuario?.instrutorId ? { instrutorId: usuario.instrutorId } : { instrutorId: "__none__" },
    ];
  }

  const rows = await prisma.adf.findMany({
    where,
    orderBy: { criadoEm: "desc" },
    include: {
      associacao: true,
      instrutor: true,
      instrutorAuxiliar: true,
      _count: { select: { candidatos: true } },
    },
  });

  const out = rows.map((a) => ({
    ...a,
    associacao_nome: a.associacao.nome,
    instrutor_nome: a.instrutor.nome,
    instrutor_aux_nome: a.instrutorAuxiliar?.nome ?? null,
    total_candidatos: a._count.candidatos,
  }));

  return NextResponse.json(out);
});

export const POST = withErrorHandling(async (req) => {
  const user = requireAuth(req);
  const body = await req.json();
  const { numero_adf, associacao_id, data_inicio, data_termino, instrutor_id, instrutor_auxiliar_id } = body;
  if (!numero_adf || !associacao_id || !data_inicio || !data_termino || !instrutor_id) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const adf = await prisma.adf.create({
    data: {
      numeroAdf: numero_adf,
      associacaoId: associacao_id,
      dataInicio: new Date(data_inicio),
      dataTermino: new Date(data_termino),
      instrutorId: instrutor_id,
      instrutorAuxiliarId: instrutor_auxiliar_id || null,
      criadoPor: user.id,
      briefing: { create: {} },
    },
  });

  return NextResponse.json(adf, { status: 201 });
});
