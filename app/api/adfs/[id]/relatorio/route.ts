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

  const [candidatos, discrepancias] = await Promise.all([
    prisma.adfCandidato.findMany({
      where: { adfId: id },
      orderBy: { candidatoNome: "asc" },
      include: {
        avaliacoes: { include: { manobra: true } },
      },
    }),
    prisma.discrepanciaCatalogo.findMany(),
  ]);

  const descPorCodigo = new Map(discrepancias.map((d) => [`${d.tipo}:${d.codigo}`, d.descricao]));

  const out = candidatos.map((c) => {
    const tipoCol = c.nivelIrata === 1 ? "tipoN1" : c.nivelIrata === 2 ? "tipoN2" : "tipoN3";
    const avaliacoes = c.avaliacoes
      .filter((a) => (a.manobra as any)[tipoCol] !== "na")
      .sort((a, b) => a.manobra.modulo.localeCompare(b.manobra.modulo) || a.manobra.ordem - b.manobra.ordem)
      .map((a) => {
        const codigos: string[] = a.discCodigos ? JSON.parse(a.discCodigos) : [];
        return {
          modulo: a.manobra.modulo,
          nome: a.manobra.nome,
          avaliado: a.avaliado,
          disc_tipo: a.discTipo,
          disc_codigos: codigos.map((cod) => ({
            codigo: cod,
            descricao: descPorCodigo.get(`${a.discTipo}:${cod}`) ?? null,
          })),
          disc_observacao: a.discObservacao,
        };
      });
    return {
      id: c.id,
      candidato_nome: c.candidatoNome,
      candidato_registro_tmc: c.candidatoRegistroTmc,
      nivel_irata: c.nivelIrata,
      status: c.status,
      resultado: c.resultado,
      aprovado: c.aprovado,
      qtd_disc_leves: c.qtdDiscLeves,
      qtd_disc_graves: c.qtdDiscGraves,
      assinatura_candidato: c.assinaturaCandidato,
      assinatura_candidato_em: c.assinaturaCandidatoEm,
      assinatura_instrutor: c.assinaturaInstrutor,
      assinatura_instrutor_em: c.assinaturaInstrutorEm,
      finalizada_em: c.finalizadaEm,
      avaliacoes,
    };
  });

  return NextResponse.json({
    adf: {
      numero_adf: adf.numeroAdf,
      status: adf.status,
      associacao_nome: adf.associacao.nome,
      instrutor_nome: adf.instrutor.nome,
      instrutor_registro: adf.instrutor.registroIrata,
      instrutor_nivel: adf.instrutor.nivel,
      instrutor_aux_nome: adf.instrutorAuxiliar?.nome ?? null,
      instrutor_aux_registro: adf.instrutorAuxiliar?.registroIrata ?? null,
      data_inicio: adf.dataInicio,
      data_termino: adf.dataTermino,
    },
    candidatos: out,
  });
});
