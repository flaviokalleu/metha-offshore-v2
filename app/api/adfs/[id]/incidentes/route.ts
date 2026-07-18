import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async (req, { params }: { params: Promise<{ id: string }> }) => {
  requireAuth(req);
  const { id } = await params;
  const rows = await prisma.incidente.findMany({
    where: { adfId: id },
    include: { criadoPorUsuario: { select: { nome: true } } },
    orderBy: { criadoEm: "asc" },
  });
  const out = rows.map((r) => ({ ...r, responsavel_nome: r.responsavelNome ?? r.criadoPorUsuario.nome }));
  return NextResponse.json(out);
});

export const POST = withErrorHandling(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const user = requireAuth(req);
  const { id: adfId } = await params;
  const body = await req.json();
  const { tipo_ocorrencia, relato, origem, medida_adotada, comunicado_direcao, data_comunicado, assinatura_instrutor } = body;

  if (!["incidente", "nao_conformidade"].includes(tipo_ocorrencia) || !relato) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  if (!assinatura_instrutor) {
    return NextResponse.json({ error: "Assinatura do instrutor responsável é obrigatória" }, { status: 400 });
  }

  const row = await prisma.incidente.create({
    data: {
      adfId,
      tipoOcorrencia: tipo_ocorrencia,
      relato,
      origem: origem || null,
      medidaAdotada: medida_adotada || null,
      comunicadoDirecao: comunicado_direcao || false,
      dataComunicado: data_comunicado ? new Date(data_comunicado) : null,
      responsavelNome: user.nome,
      assinaturaInstrutor: assinatura_instrutor,
      criadoPor: user.id,
    },
  });
  return NextResponse.json(row, { status: 201 });
});
