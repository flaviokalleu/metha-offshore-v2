"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { api } from "@/lib/api-client";

type Termo = {
  nome: string;
  registro_irata: string;
  cidade: string;
  assinatura_img: string | null;
  assinado_em: string | null;
};

export default function VerTermoPage() {
  const { instrutorId } = useParams<{ instrutorId: string }>();
  const [termo, setTermo] = useState<Termo | null>(null);

  useEffect(() => {
    api<Termo>(`/termos/${instrutorId}`).then(setTermo);
  }, [instrutorId]);

  if (!termo) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  const data = termo.assinado_em ? new Date(termo.assinado_em) : new Date();
  const dia = data.getDate();
  const mes = data.toLocaleDateString("pt-BR", { month: "long" });
  const ano = data.getFullYear();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <BackButton href="/admin/termos" />
        <Button onClick={() => window.print()} className="gap-1.5">
          <Printer className="size-4" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      <div className="mx-auto w-full max-w-2xl rounded-lg border bg-white p-6 text-black sm:p-10 print:rounded-none print:border-0 print:p-0">
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-metha.webp" alt="Metha Treinamentos Offshore" className="mx-auto mb-2 h-14 w-auto object-contain" />
          <h1 className="text-base font-bold uppercase">Termo de Ciência e Recebimento de Documentos</h1>
        </div>

        <div className="flex flex-col gap-4 text-sm leading-relaxed">
          <p>
            <strong>Eu, {termo.nome}</strong>, Nº IRATA <strong>{termo.registro_irata}</strong>:
          </p>
          <p>Declaro para os devidos fins que me foi enviado pela Metha Treinamentos Offshore.</p>
          <p>
            E que recebi os documentos TACs, ICOP; Análise de risco do CT; Boletins de Segurança; Folhas de Tópicos; Histórico de
            Boletins de Segurança e apresentação de indução de Instrutores em procedimentos administrativos e de treinamento da
            escola acima declarada e tenho total ciência e me comprometo em cumprir e apresentar aos alunos informações
            referentes aos documentos acima.
          </p>
          <p>
            Declaro também que participei de treinamento de resgate em equipe ministrado pela escola e procedimentos de indução
            de instrutores da empresa.
          </p>

          <p className="mt-4">
            {termo.cidade}, {dia} de {mes} de {ano}.
          </p>

          <div className="mt-6 flex flex-col items-center">
            {termo.assinatura_img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={termo.assinatura_img} alt="Assinatura" className="h-20 object-contain" />
            ) : (
              <div className="h-20 w-64 border-b border-black" />
            )}
            <span className="mt-1 w-64 border-t border-black pt-1 text-center text-xs">Assinatura — {termo.nome}</span>
            {!termo.assinatura_img && <p className="mt-2 text-xs text-red-700">Ainda não assinado pelo instrutor.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
