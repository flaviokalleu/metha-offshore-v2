"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { api } from "@/lib/api-client";

type Relatorio = {
  adf: {
    numero_adf: string;
    status: string;
    associacao_nome: string;
    instrutor_nome: string;
    instrutor_registro: string;
    instrutor_nivel: number;
    instrutor_aux_nome: string | null;
    instrutor_aux_registro: string | null;
    data_inicio: string;
    data_termino: string;
  };
  candidatos: {
    id: string;
    candidato_nome: string;
    candidato_registro_tmc: string;
    nivel_irata: number;
    status: string;
    resultado: string | null;
    aprovado: boolean | null;
    qtd_disc_leves: number;
    qtd_disc_graves: number;
    assinatura_candidato: string | null;
    assinatura_instrutor: string | null;
    finalizada_em: string | null;
    avaliacoes: {
      modulo: string;
      nome: string;
      avaliado: boolean;
      disc_tipo: string | null;
      disc_codigos: { codigo: string; descricao: string | null }[];
      disc_observacao: string | null;
    }[];
  }[];
};

const RESULTADO_LABEL: Record<string, string> = {
  reprovado: "Reprovado",
  satisfatorio: "Satisfatório",
  bom: "Bom",
  muito_bom: "Muito bom",
  excelente: "Excelente",
};

export default function RelatorioAdfPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Relatorio | null>(null);

  useEffect(() => {
    api<Relatorio>(`/adfs/${id}/relatorio`).then(setData);
  }, [id]);

  if (!data) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  const { adf, candidatos } = data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <BackButton href={`/adfs/${id}`} />
        <Button onClick={() => window.print()} className="gap-1.5">
          <Printer className="size-4" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      <div className="rounded-lg border bg-white p-4 text-black sm:p-6 print:rounded-none print:border-0 print:p-0">
        {/* Cabeçalho */}
        <div className="mb-4 border-b-2 border-black pb-3 text-center">
          <h1 className="text-lg font-bold uppercase">Relatório Completo — ADF {adf.numero_adf}</h1>
          <p className="text-sm">{adf.associacao_nome}</p>
          <p className="text-sm">
            Início: {new Date(adf.data_inicio).toLocaleDateString("pt-BR")} · Término:{" "}
            {new Date(adf.data_termino).toLocaleDateString("pt-BR")} · Situação: {adf.status === "finalizada" ? "Fechada" : "Aberta"}
          </p>
          <p className="text-sm">
            Instrutor Nível {adf.instrutor_nivel}: {adf.instrutor_nome} ({adf.instrutor_registro})
            {adf.instrutor_aux_nome ? ` · Auxiliar: ${adf.instrutor_aux_nome} (${adf.instrutor_aux_registro})` : ""}
          </p>
        </div>

        {candidatos.length === 0 && <p className="text-sm">Nenhum candidato cadastrado.</p>}

        {/* Um bloco por aluno */}
        {candidatos.map((c) => (
          <div key={c.id} className="mb-6 break-inside-avoid-page rounded border-2 border-black p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-black pb-2">
              <div>
                <p className="text-base font-bold">{c.candidato_nome}</p>
                <p className="text-xs">
                  Registro TMC: {c.candidato_registro_tmc} · Nível IRATA {c.nivel_irata}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold uppercase">
                  {c.status !== "finalizada"
                    ? "Avaliação em aberto"
                    : c.aprovado
                      ? `Aprovado — ${RESULTADO_LABEL[c.resultado ?? ""] ?? c.resultado}`
                      : "Reprovado"}
                </p>
                <p className="text-xs">
                  {c.qtd_disc_leves} discrepância(s) leve(s) · {c.qtd_disc_graves} grave(s)
                  {c.finalizada_em ? ` · finalizada em ${new Date(c.finalizada_em).toLocaleDateString("pt-BR")}` : ""}
                </p>
              </div>
            </div>

            {/* Manobras */}
            {c.avaliacoes.length === 0 ? (
              <p className="text-sm">Nenhuma manobra avaliada.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="border border-black p-1 text-left">Módulo</th>
                      <th className="border border-black p-1 text-left">Manobra</th>
                      <th className="border border-black p-1">Avaliada</th>
                      <th className="border border-black p-1 text-left">Discrepância</th>
                      <th className="border border-black p-1 text-left">Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.avaliacoes.map((a, i) => (
                      <tr key={i} className="break-inside-avoid">
                        <td className="border border-black p-1">{a.modulo}</td>
                        <td className="border border-black p-1">{a.nome}</td>
                        <td className="border border-black p-1 text-center">{a.avaliado ? "Sim" : "Não"}</td>
                        <td className="border border-black p-1">
                          {a.disc_tipo ? (
                            <>
                              <span className="font-semibold uppercase">{a.disc_tipo}</span>
                              {a.disc_codigos.length > 0 && (
                                <ul className="mt-0.5 list-inside list-disc">
                                  {a.disc_codigos.map((dc) => (
                                    <li key={dc.codigo}>
                                      {dc.codigo}
                                      {dc.descricao ? ` — ${dc.descricao}` : ""}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="border border-black p-1">{a.disc_observacao ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Assinaturas */}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col items-center">
                {c.assinatura_instrutor ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.assinatura_instrutor} alt="Assinatura do instrutor" className="h-16 object-contain" />
                ) : (
                  <div className="h-16" />
                )}
                <span className="w-full max-w-56 border-t border-black pt-0.5 text-center text-xs">
                  Instrutor Nível 3 — {adf.instrutor_nome}
                </span>
              </div>
              <div className="flex flex-col items-center">
                {c.assinatura_candidato ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.assinatura_candidato} alt="Assinatura do aluno" className="h-16 object-contain" />
                ) : (
                  <div className="h-16" />
                )}
                <span className="w-full max-w-56 border-t border-black pt-0.5 text-center text-xs">Aluno — {c.candidato_nome}</span>
              </div>
            </div>
          </div>
        ))}

        <p className="mt-6 text-right text-xs text-gray-600">
          Emitido em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")} — Sistema Metha Offshore
        </p>
      </div>
    </div>
  );
}
