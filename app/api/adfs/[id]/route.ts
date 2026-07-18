import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async (req, { params }: { params: Promise<{ id: string }> }) => {
  requireAuth(req);
  const { id } = await params;
  const adf = await prisma.adf.findUnique({
    where: { id },
    include: { associacao: true, instrutor: true, instrutorAuxiliar: true },
  });
  if (!adf) return NextResponse.json({ error: "ADF não encontrada" }, { status: 404 });

  return NextResponse.json({
    ...adf,
    associacao_nome: adf.associacao.nome,
    instrutor_nome: adf.instrutor.nome,
    instrutor_registro: adf.instrutor.registroIrata,
    instrutor_aux_nome: adf.instrutorAuxiliar?.nome ?? null,
    instrutor_aux_registro: adf.instrutorAuxiliar?.registroIrata ?? null,
  });
});

export const PUT = withErrorHandling(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const user = requireAuth(req);
  const { id } = await params;
  const body = await req.json();

  const current = await prisma.adf.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  if (current.status === "finalizada" && user.perfil !== "admin") {
    return NextResponse.json({ error: "Ficha finalizada. Somente admin pode reabrir." }, { status: 403 });
  }

  const adf = await prisma.adf.update({
    where: { id },
    data: {
      numeroAdf: body.numero_adf ?? current.numeroAdf,
      associacaoId: body.associacao_id ?? current.associacaoId,
      dataInicio: body.data_inicio ? new Date(body.data_inicio) : current.dataInicio,
      dataTermino: body.data_termino ? new Date(body.data_termino) : current.dataTermino,
      instrutorId: body.instrutor_id ?? current.instrutorId,
      instrutorAuxiliarId: body.instrutor_auxiliar_id !== undefined ? body.instrutor_auxiliar_id : current.instrutorAuxiliarId,
    },
  });
  return NextResponse.json(adf);
});
