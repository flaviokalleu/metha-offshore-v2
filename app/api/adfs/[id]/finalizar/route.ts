import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const POST = withErrorHandling(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const user = requireAuth(req);
  const { id } = await params;

  const adf = await prisma.adf.findUnique({
    where: { id },
    include: { candidatos: { where: { ativo: true }, select: { status: true, candidatoNome: true } } },
  });
  if (!adf) return NextResponse.json({ error: "ADF não encontrada" }, { status: 404 });
  if (adf.status === "finalizada") return NextResponse.json({ error: "ADF já está fechada" }, { status: 400 });

  const pendentes = adf.candidatos.filter((c) => c.status !== "finalizada");
  if (pendentes.length > 0) {
    return NextResponse.json(
      { error: `Há ${pendentes.length} candidato(s) sem avaliação finalizada: ${pendentes.map((c) => c.candidatoNome).join(", ")}` },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.adf.update({ where: { id }, data: { status: "finalizada" } }),
    prisma.auditLog.create({
      data: { adfId: id, usuarioId: user.id, acao: "fechar_adf", statusAnterior: adf.status, statusNovo: "finalizada" },
    }),
  ]);

  return NextResponse.json({ message: "ADF fechada" });
});
