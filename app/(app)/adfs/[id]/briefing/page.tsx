"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignaturePad } from "@/components/signature-pad";
import { BackButton } from "@/components/back-button";
import { api, ApiClientError } from "@/lib/api-client";
import { Mail } from "lucide-react";

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
];

type Candidato = { id: string; candidatoNome: string };
type Briefing = {
  itens_confirmados: boolean[];
  temas_abordados: string | null;
  observacoes: string | null;
  assinaturas_candidatos: { candidato_id: string; nome: string; assinatura_img: string; assinado_em: string }[];
  instrutor_assinatura: string | null;
};

export default function BriefingPage() {
  const { id } = useParams<{ id: string }>();
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [saving, setSaving] = useState(false);
  const [assinandoId, setAssinandoId] = useState<string | null>(null);
  const [assinaturaTemp, setAssinaturaTemp] = useState<string | null>(null);
  const [assinaturaInstrutor, setAssinaturaInstrutor] = useState<string | null>(null);
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  function reload() {
    api<Briefing>(`/adfs/${id}/briefing`).then((b) => {
      setBriefing(b);
      setAssinaturaInstrutor(b.instrutor_assinatura);
    });
    api<Candidato[]>(`/adfs/${id}/candidatos`).then(setCandidatos);
  }
  useEffect(reload, [id]);

  if (!briefing) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  function toggleItem(idx: number) {
    setBriefing((b) => {
      if (!b) return b;
      const copy = [...b.itens_confirmados];
      copy[idx] = !copy[idx];
      return { ...b, itens_confirmados: copy };
    });
  }

  async function salvar() {
    if (!briefing) return;
    setSaving(true);
    try {
      await api(`/adfs/${id}/briefing`, {
        method: "PUT",
        body: JSON.stringify({
          itens_confirmados: briefing.itens_confirmados,
          temas_abordados: briefing.temas_abordados,
          observacoes: briefing.observacoes,
          instrutor_assinatura: assinaturaInstrutor || undefined,
        }),
      });
      toast.success("Briefing salvo");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar briefing");
    } finally {
      setSaving(false);
    }
  }

  async function confirmarAssinaturaCandidato(candidatoId: string, nome: string) {
    if (!assinaturaTemp || !briefing) return;
    const semEsse = briefing.assinaturas_candidatos.filter((a) => a.candidato_id !== candidatoId);
    const novas = [...semEsse, { candidato_id: candidatoId, nome, assinatura_img: assinaturaTemp, assinado_em: new Date().toISOString() }];
    try {
      await api(`/adfs/${id}/briefing`, {
        method: "PUT",
        body: JSON.stringify({ assinaturas_candidatos: novas }),
      });
      toast.success(`Assinatura de ${nome} registrada`);
      setAssinandoId(null);
      setAssinaturaTemp(null);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar assinatura");
    }
  }

  async function enviarPorEmail() {
    setEnviandoEmail(true);
    try {
      const res = await api<{ enviados: string[]; falhas: string[]; sem_email: string[] }>(`/adfs/${id}/briefing/enviar-email`, {
        method: "POST",
      });
      let msg = `Briefing enviado para ${res.enviados.length} aluno(s)`;
      if (res.falhas.length > 0) msg += ` · ${res.falhas.length} falha(s)`;
      if (res.sem_email.length > 0) msg += ` · sem e-mail: ${res.sem_email.join(", ")}`;
      toast.success(msg, { duration: 6000 });
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao enviar e-mails");
    } finally {
      setEnviandoEmail(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <BackButton href={`/adfs/${id}`} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold sm:text-2xl">Briefing</h1>
        <Button variant="outline" size="sm" onClick={enviarPorEmail} disabled={enviandoEmail} className="gap-1.5">
          <Mail className="size-4" />
          {enviandoEmail ? "Enviando..." : "Enviar por e-mail"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Itens abordados</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {ITENS.map((item, idx) => (
            <label key={idx} className="flex items-center gap-2 text-sm">
              <Checkbox checked={Boolean(briefing.itens_confirmados[idx])} onCheckedChange={() => toggleItem(idx)} />
              {item}
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Temas abordados e observações</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Textarea
            placeholder="Temas abordados"
            value={briefing.temas_abordados ?? ""}
            onChange={(e) => setBriefing((b) => (b ? { ...b, temas_abordados: e.target.value } : b))}
          />
          <Textarea
            placeholder="Observações"
            value={briefing.observacoes ?? ""}
            onChange={(e) => setBriefing((b) => (b ? { ...b, observacoes: e.target.value } : b))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assinaturas dos candidatos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {candidatos.map((c) => {
            const assinado = briefing.assinaturas_candidatos.find((a) => a.candidato_id === c.id);
            return (
              <div key={c.id} className="flex flex-col gap-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{c.candidatoNome}</span>
                  {assinado ? (
                    <Badge>Assinado</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAssinandoId(c.id);
                        setAssinaturaTemp(null);
                      }}
                    >
                      Assinar
                    </Button>
                  )}
                </div>
                {assinandoId === c.id && (
                  <div className="flex flex-col gap-2">
                    <SignaturePad value={assinaturaTemp} onChange={setAssinaturaTemp} height={100} />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setAssinandoId(null)}>
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={() => confirmarAssinaturaCandidato(c.id, c.candidatoNome)} disabled={!assinaturaTemp}>
                        Confirmar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assinatura do instrutor</CardTitle>
        </CardHeader>
        <CardContent>
          <SignaturePad value={assinaturaInstrutor} onChange={setAssinaturaInstrutor} />
        </CardContent>
      </Card>

      <div className="sticky bottom-16 z-30 -mx-4 flex justify-end border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 md:bottom-0">
        <Button onClick={salvar} disabled={saving} className="w-full sm:w-auto">
          {saving ? "Salvando..." : "Salvar briefing"}
        </Button>
      </div>
    </div>
  );
}
