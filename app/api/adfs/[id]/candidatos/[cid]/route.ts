import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const PUT = withErrorHandling(async (req, { params }: { params: Promise<{ id: string; cid: string }> }) => {
  requireAuth(req);
  const { id, cid } = await params;
  const body = await req.json();

  const existing = await prisma.adfCandidato.findFirst({ where: { id: cid, adfId: id } });
  if (!existing) return NextResponse.json({ error: "Candidato não encontrado" }, { status: 404 });

  const row = await prisma.adfCandidato.update({
    where: { id: cid },
    data: {
      candidatoNome: body.candidato_nome ?? existing.candidatoNome,
      candidatoRegistroTmc: body.candidato_registro_tmc ?? existing.candidatoRegistroTmc,
      candidatoEmail: body.candidato_email !== undefined ? body.candidato_email : existing.candidatoEmail,
      nivelIrata: body.nivel_irata !== undefined ? Number(body.nivel_irata) : existing.nivelIrata,
      ativo: typeof body.ativo === "boolean" ? body.ativo : existing.ativo,
    },
  });
  return NextResponse.json(row);
});

export const DELETE = withErrorHandling(async (req, { params }: { params: Promise<{ id: string; cid: string }> }) => {
  requireAuth(req);
  const { id, cid } = await params;
  const existing = await prisma.adfCandidato.findFirst({ where: { id: cid, adfId: id } });
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (existing.status === "finalizada") return NextResponse.json({ error: "Candidato já finalizado" }, { status: 409 });

  await prisma.adfCandidato.delete({ where: { id: cid } });
  return NextResponse.json({ message: "Candidato removido" });
});
