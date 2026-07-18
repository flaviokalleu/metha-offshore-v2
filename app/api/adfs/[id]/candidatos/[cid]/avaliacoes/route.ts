import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { withErrorHandling, assertAdfAberta } from "@/lib/api-handler";

type TipoNivel = "tipoN1" | "tipoN2" | "tipoN3";

export const GET = withErrorHandling(async (req, { params }: { params: Promise<{ cid: string }> }) => {
  requireAuth(req);
  const { cid } = await params;

  const candidato = await prisma.adfCandidato.findUnique({ where: { id: cid } });
  if (!candidato) return NextResponse.json({ error: "Candidato não encontrado" }, { status: 404 });

  const nivel = candidato.nivelIrata;
  const candidato_nome = candidato.candidatoNome;
  const candidato_registro = candidato.candidatoRegistroTmc;
  const tipoCol: TipoNivel = nivel === 1 ? "tipoN1" : nivel === 2 ? "tipoN2" : "tipoN3";

  const manobras = await prisma.manobraCatalogo.findMany({
    where: { ativa: true },
    orderBy: [{ modulo: "asc" }, { ordem: "asc" }],
  });
  const avaliacoes = await prisma.avaliacaoManobra.findMany({ where: { candidatoId: cid } });
  const avaliacaoPorManobra = new Map(avaliacoes.map((a) => [a.manobraId, a]));

  const out = manobras.map((m) => {
    const av = avaliacaoPorManobra.get(m.id);
    return {
      manobra_id: m.id,
      modulo: m.modulo,
      ordem: m.ordem,
      nome: m.nome,
      tipo_n1: m.tipoN1,
      tipo_n2: m.tipoN2,
      tipo_n3: m.tipoN3,
      tipo_nivel: m[tipoCol],
      avaliado: av?.avaliado ?? false,
      disc_tipo: av?.discTipo ?? null,
      disc_codigos: av?.discCodigos ? JSON.parse(av.discCodigos) : null,
      disc_observacao: av?.discObservacao ?? null,
    };
  });

  return NextResponse.json({ nivel, candidato_nome, candidato_registro, manobras: out });
});

export const PUT = withErrorHandling(async (req, { params }: { params: Promise<{ id: string; cid: string }> }) => {
  requireAuth(req);
  const { id, cid } = await params;
  await assertAdfAberta(id);
  const { avaliacoes } = await req.json();
  if (!Array.isArray(avaliacoes)) return NextResponse.json({ error: "avaliacoes deve ser array" }, { status: 400 });

  for (const av of avaliacoes) {
    if (av.disc_tipo && !av.disc_observacao?.trim()) {
      return NextResponse.json({ error: `Observação obrigatória na discrepância da manobra ${av.manobra_id}` }, { status: 400 });
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const av of avaliacoes) {
      await tx.avaliacaoManobra.upsert({
        where: { candidatoId_manobraId: { candidatoId: cid, manobraId: av.manobra_id } },
        update: {
          avaliado: av.avaliado || false,
          discTipo: av.disc_tipo || null,
          discCodigos: av.disc_codigos ? JSON.stringify(av.disc_codigos) : null,
          discObservacao: av.disc_observacao || null,
        },
        create: {
          candidatoId: cid,
          manobraId: av.manobra_id,
          avaliado: av.avaliado || false,
          discTipo: av.disc_tipo || null,
          discCodigos: av.disc_codigos ? JSON.stringify(av.disc_codigos) : null,
          discObservacao: av.disc_observacao || null,
        },
      });
    }

    const [leves, graves] = await Promise.all([
      tx.avaliacaoManobra.count({ where: { candidatoId: cid, discTipo: "leve" } }),
      tx.avaliacaoManobra.count({ where: { candidatoId: cid, discTipo: "grave" } }),
    ]);

    await tx.adfCandidato.update({
      where: { id: cid },
      data: { qtdDiscLeves: leves, qtdDiscGraves: graves },
    });
  });

  return NextResponse.json({ message: "Avaliações salvas" });
});
