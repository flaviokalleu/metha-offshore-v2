"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { api } from "@/lib/api-client";

type Adf = {
  numeroAdf: string;
  associacao_nome: string;
  instrutor_nome: string;
  instrutor_registro: string;
  dataInicio: string;
  dataTermino: string;
};

type Incidente = {
  id: string;
  tipoOcorrencia: string;
  relato: string;
  origem: string | null;
  medidaAdotada: string | null;
  comunicadoDirecao: boolean;
  dataComunicado: string | null;
  responsavel_nome: string;
  assinaturaInstrutor: string | null;
  direcaoTipoCorrecao: string | null;
  direcaoRelato: string | null;
  direcaoData: string | null;
  direcaoCoordenador: string | null;
  criadoEm: string;
};

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <p className="text-sm">
      <span className="font-semibold">{label}:</span> {valor}
    </p>
  );
}

export default function RelatorioIncidentesPage() {
  const { id } = useParams<{ id: string }>();
  const [adf, setAdf] = useState<Adf | null>(null);
  const [rows, setRows] = useState<Incidente[]>([]);

  useEffect(() => {
    api<Adf>(`/adfs/${id}`).then(setAdf);
    api<Incidente[]>(`/adfs/${id}/incidentes`).then(setRows);
  }, [id]);

  if (!adf) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <BackButton href={`/adfs/${id}/incidentes`} />
        <Button onClick={() => window.print()} className="gap-1.5">
          <Printer className="size-4" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      <div className="rounded-lg border bg-white p-4 text-black sm:p-6 print:rounded-none print:border-0 print:p-0">
        <div className="mb-4 border-b-2 border-black pb-3 text-center">
          <h1 className="text-lg font-bold uppercase">Relatório de Incidentes / Não Conformidades — ADF {adf.numeroAdf}</h1>
          <p className="text-sm">{adf.associacao_nome}</p>
          <p className="text-sm">
            Instrutor: {adf.instrutor_nome} ({adf.instrutor_registro}) · Período:{" "}
            {new Date(adf.dataInicio).toLocaleDateString("pt-BR")} a {new Date(adf.dataTermino).toLocaleDateString("pt-BR")}
          </p>
        </div>

        {rows.length === 0 && <p className="text-sm">Nenhum incidente ou não conformidade registrado nesta ADF.</p>}

        <div className="flex flex-col gap-4">
          {rows.map((r, i) => (
            <div key={r.id} className="break-inside-avoid rounded border border-black p-3">
              <p className="mb-2 border-b border-black pb-1 text-sm font-bold uppercase">
                Registro {i + 1} — {r.tipoOcorrencia === "nao_conformidade" ? "Não conformidade" : "Incidente"}
              </p>
              <Campo label="Data do registro" valor={new Date(r.criadoEm).toLocaleString("pt-BR")} />
              <Campo label="Relato" valor={r.relato} />
              {r.origem && <Campo label="Origem" valor={r.origem} />}
              {r.medidaAdotada && <Campo label="Medida adotada" valor={r.medidaAdotada} />}
              <Campo
                label="Comunicado à direção"
                valor={r.comunicadoDirecao ? `Sim${r.dataComunicado ? ` em ${new Date(r.dataComunicado).toLocaleDateString("pt-BR")}` : ""}` : "Não"}
              />
              {r.direcaoTipoCorrecao && <Campo label="Tipo de correção (direção)" valor={r.direcaoTipoCorrecao} />}
              {r.direcaoRelato && <Campo label="Parecer da direção" valor={r.direcaoRelato} />}
              {r.direcaoCoordenador && <Campo label="Coordenador" valor={r.direcaoCoordenador} />}
              {r.direcaoData && <Campo label="Data (direção)" valor={new Date(r.direcaoData).toLocaleDateString("pt-BR")} />}

              <div className="mt-3 flex flex-col items-start gap-1">
                <p className="text-sm font-semibold">Responsável pelo relatório: {r.responsavel_nome}</p>
                {r.assinaturaInstrutor ? (
                  <div className="flex flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.assinaturaInstrutor} alt="Assinatura do instrutor" className="h-16 object-contain" />
                    <span className="w-48 border-t border-black pt-0.5 text-center text-xs">Assinatura do instrutor</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">Sem assinatura registrada</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-right text-xs text-gray-600">
          Emitido em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")} — Sistema Metha Offshore
        </p>
      </div>
    </div>
  );
}
