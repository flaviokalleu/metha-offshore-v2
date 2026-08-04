"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { api, ApiClientError } from "@/lib/api-client";

const ITENS = [
  "Objetivo e cronograma da ADF",
  "Regras gerais de segurança do local",
  "Rotas de fuga e pontos de encontro",
  "Uso obrigatório de EPI",
  "Procedimentos de emergência e resgate",
  "Comunicação durante os exercícios",
  "Critérios de avaliação e discrepâncias",
  "Política de reprovação e reavaliação",
  "Cuidados com o equipamento",
  "Condições climáticas e suspensão de atividades",
  "Áreas restritas e sinalização",
  "Contatos de emergência",
  "Dúvidas e esclarecimentos gerais",
  "Primeiros Socorros",
  "Avaliação de Risco (banner no CT)",
  "Planos de Socorro",
];

const LINKS = [
  { titulo: "Prevenção de Problemas Fatais", url: "https://irata.org/media/videos/report-a-problem-prevent-a-fatality-videos" },
  { titulo: "Cultura de Gerenciamento de Segurança", url: "https://irata.org/media/videos/management-and-safety-culture-videos" },
  { titulo: "Gerenciamento de Limite em Acesso por Cordas", url: "https://irata.org/media/videos/edge-and-rope-management-videos" },
  { titulo: "Pesquisa de Satisfação", url: "https://pt.surveymonkey.com/r/3GPGZFQ" },
];

type Adf = {
  numeroAdf: string;
  associacao_nome: string;
  instrutor_nome: string;
  instrutor_registro: string;
  instrutor_aux_nome: string | null;
  dataInicio: string;
  dataTermino: string;
};

type Briefing = {
  itens_confirmados: boolean[];
  temas_abordados: string | null;
  observacoes: string | null;
  assinaturas_candidatos: { candidato_id: string; nome: string; assinatura_img: string; assinado_em: string }[];
  instrutor_assinatura: string | null;
};

export default function RelatorioBriefingPage() {
  const { id } = useParams<{ id: string }>();
  const [adf, setAdf] = useState<Adf | null>(null);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api<Adf>(`/adfs/${id}`).then(setAdf);
    api<Briefing>(`/adfs/${id}/briefing`)
      .then(setBriefing)
      .catch((err) => setErro(err instanceof ApiClientError ? err.message : "Erro ao carregar briefing"));
  }, [id]);

  if (!adf) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <BackButton href={`/adfs/${id}/briefing`} />
        <Button onClick={() => window.print()} className="gap-1.5" disabled={!briefing}>
          <Printer className="size-4" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      {erro && !briefing && (
        <div className="rounded-lg border bg-white p-6 text-center text-sm text-black">{erro}</div>
      )}

      {briefing && (
        <div className="rounded-lg border bg-white p-4 text-black sm:p-6 print:rounded-none print:border-0 print:p-0">
          <div className="mb-4 border-b-2 border-black pb-3 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-metha.webp" alt="Metha Treinamentos Offshore" className="mx-auto mb-2 h-14 w-auto object-contain" />
            <h1 className="text-lg font-bold uppercase">Relatório de Briefing — ADF {adf.numeroAdf}</h1>
            <p className="text-sm">{adf.associacao_nome}</p>
            <p className="text-sm">
              Instrutor: {adf.instrutor_nome} ({adf.instrutor_registro})
              {adf.instrutor_aux_nome ? ` · Auxiliar: ${adf.instrutor_aux_nome}` : ""}
            </p>
            <p className="text-sm">
              Período: {new Date(adf.dataInicio).toLocaleDateString("pt-BR")} a {new Date(adf.dataTermino).toLocaleDateString("pt-BR")}
            </p>
          </div>

          <div className="mb-5 break-inside-avoid">
            <h2 className="mb-1.5 border-b border-black pb-1 text-sm font-bold uppercase">Itens abordados</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {ITENS.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-bold">{briefing.itens_confirmados[idx] ? "☑" : "☐"}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-5 break-inside-avoid">
            <h2 className="mb-1.5 border-b border-black pb-1 text-sm font-bold uppercase">Links importantes</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {LINKS.map((l) => (
                <li key={l.url}>
                  <span className="font-medium">{l.titulo}:</span>{" "}
                  <span className="break-all underline">{l.url}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-5 break-inside-avoid">
            <h2 className="mb-1.5 border-b border-black pb-1 text-sm font-bold uppercase">Assinaturas dos candidatos</h2>
            {briefing.assinaturas_candidatos.length === 0 ? (
              <p className="text-sm text-gray-600">Nenhuma assinatura registrada.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {briefing.assinaturas_candidatos.map((a) => (
                  <div key={a.candidato_id} className="flex break-inside-avoid flex-col items-center rounded border border-black p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.assinatura_img} alt={`Assinatura de ${a.nome}`} className="h-14 object-contain" />
                    <span className="mt-1 border-t border-black pt-1 text-center text-xs font-medium">{a.nome}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 break-inside-avoid">
            <h2 className="mb-1.5 text-sm font-bold uppercase">Assinatura do instrutor</h2>
            {briefing.instrutor_assinatura ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={briefing.instrutor_assinatura} alt="Assinatura do instrutor" className="h-16 object-contain" />
            ) : (
              <div className="h-16" />
            )}
            <p className="max-w-xs border-t border-black pt-1 text-xs font-medium">
              {adf.instrutor_nome} ({adf.instrutor_registro})
            </p>
          </div>

          <p className="mt-6 text-right text-xs text-gray-600">
            Emitido em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")} — Sistema Metha Offshore
          </p>
        </div>
      )}
    </div>
  );
}
