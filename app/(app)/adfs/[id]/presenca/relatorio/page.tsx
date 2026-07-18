"use client";

import { useEffect, useMemo, useState } from "react";
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
  instrutor_aux_nome: string | null;
  dataInicio: string;
  dataTermino: string;
};

type Presenca = {
  candidatoId: string;
  candidato_nome: string;
  nivel_irata: number;
  diaSemana: string;
  status: string;
  assinatura: string | null;
};

const DIAS = ["segunda", "terca", "quarta", "quinta", "sexta"];
const DIA_LABEL: Record<string, string> = { segunda: "Segunda", terca: "Terça", quarta: "Quarta", quinta: "Quinta", sexta: "Sexta" };
const STATUS_LABEL: Record<string, string> = { presente: "Presente", ausente: "Ausente", justificado: "Justificado", pendente: "—" };

export default function RelatorioPresencaPage() {
  const { id } = useParams<{ id: string }>();
  const [adf, setAdf] = useState<Adf | null>(null);
  const [rows, setRows] = useState<Presenca[]>([]);

  useEffect(() => {
    api<Adf>(`/adfs/${id}`).then(setAdf);
    api<Presenca[]>(`/adfs/${id}/presencas`).then(setRows);
  }, [id]);

  const porCandidato = useMemo(() => {
    const map = new Map<string, { nome: string; nivel: number; dias: Record<string, Presenca> }>();
    for (const r of rows) {
      if (!map.has(r.candidatoId)) map.set(r.candidatoId, { nome: r.candidato_nome, nivel: r.nivel_irata, dias: {} });
      map.get(r.candidatoId)!.dias[r.diaSemana] = r;
    }
    return Array.from(map.values());
  }, [rows]);

  if (!adf) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <BackButton href={`/adfs/${id}/presenca`} />
        <Button onClick={() => window.print()} className="gap-1.5">
          <Printer className="size-4" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      <div className="rounded-lg border bg-white p-4 text-black sm:p-6 print:rounded-none print:border-0 print:p-0">
        <div className="mb-4 border-b-2 border-black pb-3 text-center">
          <h1 className="text-lg font-bold uppercase">Relatório de Presença — ADF {adf.numeroAdf}</h1>
          <p className="text-sm">{adf.associacao_nome}</p>
          <p className="text-sm">
            Instrutor: {adf.instrutor_nome} ({adf.instrutor_registro})
            {adf.instrutor_aux_nome ? ` · Auxiliar: ${adf.instrutor_aux_nome}` : ""}
          </p>
          <p className="text-sm">
            Período: {new Date(adf.dataInicio).toLocaleDateString("pt-BR")} a {new Date(adf.dataTermino).toLocaleDateString("pt-BR")}
          </p>
        </div>

        {porCandidato.length === 0 && <p className="text-sm">Nenhum candidato cadastrado.</p>}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs sm:text-sm">
            <thead>
              <tr>
                <th className="border border-black p-1.5 text-left">Aluno</th>
                {DIAS.map((d) => (
                  <th key={d} className="border border-black p-1.5">
                    {DIA_LABEL[d]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {porCandidato.map((c) => (
                <tr key={c.nome} className="break-inside-avoid">
                  <td className="border border-black p-1.5 align-middle font-medium">
                    {c.nome}
                    <span className="block text-[10px] font-normal">Nível {c.nivel}</span>
                  </td>
                  {DIAS.map((d) => {
                    const p = c.dias[d];
                    return (
                      <td key={d} className="border border-black p-1.5 text-center align-middle">
                        <span className="block">{STATUS_LABEL[p?.status ?? "pendente"]}</span>
                        {p?.assinatura ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.assinatura} alt="Rubrica" className="mx-auto mt-1 h-8 object-contain" />
                        ) : (
                          <span className="mt-1 block text-[10px] text-gray-500">sem rubrica</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-right text-xs text-gray-600">
          Emitido em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")} — Sistema Metha Offshore
        </p>
      </div>
    </div>
  );
}
