import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { withErrorHandling, assertAdfAberta } from "@/lib/api-handler";

export const GET = withErrorHandling(async (req, { params }: { params: Promise<{ id: string }> }) => {
  requireAuth(req);
  const { id } = await params;
  const rows = await prisma.presenca.findMany({
    where: { adfId: id, candidato: { ativo: true } },
    include: { candidato: true },
    orderBy: [{ candidato: { candidatoNome: "asc" } }, { diaSemana: "asc" }],
  });
  const out = rows.map((p) => ({
    ...p,
    candidato_nome: p.candidato.candidatoNome,
    nivel_irata: p.candidato.nivelIrata,
  }));
  return NextResponse.json(out);
});

export const PUT = withErrorHandling(async (req, { params }: { params: Promise<{ id: string }> }) => {
  requireAuth(req);
  const { id } = await params;
  await assertAdfAberta(id);
  const { presencas, instrutor_assinatura } = await req.json();
  if (presencas !== undefined && !Array.isArray(presencas)) {
    return NextResponse.json({ error: "presencas deve ser array" }, { status: 400 });
  }

  const ops = [];
  if (Array.isArray(presencas)) {
    ops.push(
      ...presencas.map((p) =>
        prisma.presenca.updateMany({
          where: { adfId: id, candidatoId: p.candidato_id, diaSemana: p.dia_semana },
          data: {
            status: p.status || "pendente",
            observacao: p.observacao || null,
            ...(p.assinatura !== undefined
              ? { assinatura: p.assinatura, assinaturaEm: p.assinatura ? new Date() : null }
              : {}),
          },
        })
      )
    );
  }
  if (instrutor_assinatura !== undefined) {
    ops.push(
      prisma.adf.update({
        where: { id },
        data: {
          presencaAssinaturaInstrutor: instrutor_assinatura || null,
          presencaAssinaturaInstrutorEm: instrutor_assinatura ? new Date() : null,
        },
      })
    );
  }

  await prisma.$transaction(ops);

  return NextResponse.json({ message: "Presença salva" });
});
