"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignaturePad } from "@/components/signature-pad";
import { api, ApiClientError } from "@/lib/api-client";

type Termo = {
  nome: string;
  registro_irata: string;
  cidade: string;
  assinatura_img: string | null;
  assinado_em: string | null;
};

export default function MeuTermoPage() {
  const [termo, setTermo] = useState<Termo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [cidade, setCidade] = useState("Rio de Janeiro");
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reload() {
    api<Termo>("/termos/meu")
      .then((t) => {
        setTermo(t);
        setCidade(t.cidade);
        setAssinatura(t.assinatura_img);
      })
      .catch((err) => setErro(err instanceof ApiClientError ? err.message : "Erro ao carregar termo"));
  }
  useEffect(reload, []);

  async function assinar() {
    if (!assinatura) {
      toast.error("Assine no campo abaixo antes de confirmar");
      return;
    }
    setSaving(true);
    try {
      await api("/termos/meu", { method: "PUT", body: JSON.stringify({ cidade, assinatura_img: assinatura }) });
      toast.success("Termo assinado com sucesso");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao assinar termo");
    } finally {
      setSaving(false);
    }
  }

  if (erro) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">{erro}</CardContent>
      </Card>
    );
  }
  if (!termo) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  const hoje = new Date();
  const dataExtenso = termo.assinado_em
    ? new Date(termo.assinado_em)
    : hoje;
  const dia = dataExtenso.getDate();
  const mes = dataExtenso.toLocaleDateString("pt-BR", { month: "long" });
  const ano = dataExtenso.getFullYear();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold sm:text-2xl">Termo de Ciência</h1>
        {termo.assinado_em && <Badge variant="success">Assinado</Badge>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Declaração</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm leading-relaxed">
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

          <div className="mt-2 flex flex-col gap-2 sm:max-w-xs">
            <Label>Cidade</Label>
            <Input value={cidade} onChange={(e) => setCidade(e.target.value)} disabled={Boolean(termo.assinado_em)} />
          </div>
          <p className="text-sm text-muted-foreground">
            {cidade}, {dia} de {mes} de {ano}.
          </p>

          <div className="mt-2">
            <p className="mb-2 text-sm font-medium">Assinatura</p>
            <SignaturePad value={assinatura} onChange={setAssinatura} height={140} />
          </div>

          {termo.assinado_em ? (
            <p className="text-xs text-muted-foreground">
              Assinado em {new Date(termo.assinado_em).toLocaleString("pt-BR")}. Para assinar novamente (ex: nova versão dos
              documentos), refaça a assinatura acima e confirme.
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button onClick={assinar} disabled={saving} className="w-full sm:w-auto">
              {saving ? "Salvando..." : termo.assinado_em ? "Assinar novamente" : "Confirmar e assinar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
