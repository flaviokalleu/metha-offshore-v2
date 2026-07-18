import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { withErrorHandling, assertAdfAberta } from "@/lib/api-handler";

const DIAS = ["segunda", "terca", "quarta", "quinta", "sexta"];

export const GET = withErrorHandling(async (req, { params }: { params: Promise<{ id: string }> }) => {
  requireAuth(req);
  const { id } = await params;
  const rows = await prisma.adfCandidato.findMany({ where: { adfId: id }, orderBy: { criadoEm: "asc" } });
  return NextResponse.json(rows);
});

export const POST = withErrorHandling(async (req, { params }: { params: Promise<{ id: string }> }) => {
  requireAuth(req);
  const { id: adfId } = await params;
  await assertAdfAberta(adfId);
  const body = await req.json();
  const { candidato_nome, candidato_registro_tmc, candidato_email, nivel_irata } = body;
  if (!candidato_nome || !candidato_registro_tmc || ![1, 2, 3].includes(Number(nivel_irata))) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const total = await prisma.adfCandidato.count({ where: { adfId } });
  if (total >= 14) return NextResponse.json({ error: "Limite de 14 candidatos por ADF atingido" }, { status: 409 });

  const adf = await prisma.adf.findUnique({ where: { id: adfId } });
  if (!adf) return NextResponse.json({ error: "ADF não encontrada" }, { status: 404 });

  const candidato = await prisma.$transaction(async (tx) => {
    const c = await tx.adfCandidato.create({
      data: {
        adfId,
        candidatoNome: candidato_nome,
        candidatoRegistroTmc: candidato_registro_tmc,
        candidatoEmail: candidato_email || null,
        nivelIrata: Number(nivel_irata),
      },
    });

    for (let i = 0; i < 5; i++) {
      const d = new Date(adf.dataInicio);
      d.setDate(d.getDate() + i);
      await tx.presenca.create({
        data: { adfId, candidatoId: c.id, diaSemana: DIAS[i], dataDia: d },
      });
    }

    return c;
  });

  return NextResponse.json(candidato, { status: 201 });
});
