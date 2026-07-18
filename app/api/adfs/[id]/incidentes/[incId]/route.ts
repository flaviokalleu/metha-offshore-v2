import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const PUT = withErrorHandling(async (req, { params }: { params: Promise<{ id: string; incId: string }> }) => {
  requireAuth(req);
  const { id, incId } = await params;
  const body = await req.json();

  const existing = await prisma.incidente.findFirst({ where: { id: incId, adfId: id } });
  if (!existing) return NextResponse.json({ error: "Incidente não encontrado" }, { status: 404 });

  const row = await prisma.incidente.update({
    where: { id: incId },
    data: {
      relato: body.relato ?? existing.relato,
      origem: body.origem ?? existing.origem,
      medidaAdotada: body.medida_adotada ?? existing.medidaAdotada,
      comunicadoDirecao: body.comunicado_direcao ?? existing.comunicadoDirecao,
      dataComunicado: body.data_comunicado ? new Date(body.data_comunicado) : existing.dataComunicado,
      assinaturaInstrutor: body.assinatura_instrutor ?? existing.assinaturaInstrutor,
      assinaturaCandidato: body.assinatura_candidato ?? existing.assinaturaCandidato,
      direcaoTipoCorrecao: body.direcao_tipo_correcao ?? existing.direcaoTipoCorrecao,
      direcaoRelato: body.direcao_relato ?? existing.direcaoRelato,
      direcaoData: body.direcao_data ? new Date(body.direcao_data) : existing.direcaoData,
      direcaoCoordenador: body.direcao_coordenador ?? existing.direcaoCoordenador,
    },
  });
  return NextResponse.json(row);
});
