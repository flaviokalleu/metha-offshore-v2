"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { FileText, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SignaturePad } from "@/components/signature-pad";
import { BackButton } from "@/components/back-button";
import { api, ApiClientError } from "@/lib/api-client";

type Presenca = {
  id: string;
  candidatoId: string;
  candidato_nome: string;
  diaSemana: string;
  status: string;
  assinatura: string | null;
};

const DIAS = ["segunda", "terca", "quarta", "quinta", "sexta"];
const DIA_LABEL: Record<string, string> = { segunda: "Segunda", terca: "Terça", quarta: "Quarta", quinta: "Quinta", sexta: "Sexta" };
const STATUS_OPTIONS = ["pendente", "presente", "ausente", "justificado"];

export default function PresencaPage() {
  const { id } = useParams<{ id: string }>();
  const [rows, setRows] = useState<Presenca[]>([]);
  const [saving, setSaving] = useState(false);
  const [rubricando, setRubricando] = useState<{ candidatoId: string; nome: string; dia: string } | null>(null);
  const [rubricaTemp, setRubricaTemp] = useState<string | null>(null);

  function reload() {
    api<Presenca[]>(`/adfs/${id}/presencas`).then(setRows);
  }
  useEffect(reload, [id]);

  const porCandidato = useMemo(() => {
    const map = new Map<string, { nome: string; dias: Record<string, Presenca> }>();
    for (const r of rows) {
      if (!map.has(r.candidatoId)) map.set(r.candidatoId, { nome: r.candidato_nome, dias: {} });
      map.get(r.candidatoId)!.dias[r.diaSemana] = r;
    }
    return Array.from(map.entries());
  }, [rows]);

  function setStatus(candidatoId: string, dia: string, status: string) {
    setRows((prev) => prev.map((r) => (r.candidatoId === candidatoId && r.diaSemana === dia ? { ...r, status } : r)));
  }

  async function salvar() {
    setSaving(true);
    try {
      await api(`/adfs/${id}/presencas`, {
        method: "PUT",
        body: JSON.stringify({
          presencas: rows.map((r) => ({ candidato_id: r.candidatoId, dia_semana: r.diaSemana, status: r.status })),
        }),
      });
      toast.success("Presença salva");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar presença");
    } finally {
      setSaving(false);
    }
  }

  async function confirmarRubrica() {
    if (!rubricando || !rubricaTemp) return;
    try {
      await api(`/adfs/${id}/presencas`, {
        method: "PUT",
        body: JSON.stringify({
          presencas: [
            {
              candidato_id: rubricando.candidatoId,
              dia_semana: rubricando.dia,
              status: rows.find((r) => r.candidatoId === rubricando.candidatoId && r.diaSemana === rubricando.dia)?.status ?? "pendente",
              assinatura: rubricaTemp,
            },
          ],
        }),
      });
      toast.success(`Rubrica de ${rubricando.nome} (${DIA_LABEL[rubricando.dia]}) registrada`);
      setRubricando(null);
      setRubricaTemp(null);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar rubrica");
    }
  }

  function RubricaCell({ candidatoId, nome, dia, p }: { candidatoId: string; nome: string; dia: string; p?: Presenca }) {
    if (p?.assinatura) {
      return (
        <button
          onClick={() => {
            setRubricando({ candidatoId, nome, dia });
            setRubricaTemp(null);
          }}
          className="flex h-9 w-full items-center justify-center overflow-hidden rounded-md border bg-white"
          aria-label="Refazer rubrica"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.assinatura} alt="Rubrica" className="h-8 max-w-full object-contain" />
        </button>
      );
    }
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-1 text-muted-foreground"
        onClick={() => {
          setRubricando({ candidatoId, nome, dia });
          setRubricaTemp(null);
        }}
      >
        <PenLine className="size-3.5" />
        Rubricar
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      <BackButton href={`/adfs/${id}`} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold sm:text-2xl">Presença</h1>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/adfs/${id}/presenca/relatorio` as any} />} className="gap-1.5">
          <FileText className="size-4" />
          Relatório
        </Button>
      </div>

      {porCandidato.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhum candidato cadastrado ainda.</CardContent>
        </Card>
      )}

      {/* Cards por candidato — mobile */}
      <div className="flex flex-col gap-3 md:hidden">
        {porCandidato.map(([candidatoId, c]) => (
          <Card key={candidatoId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{c.nome}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {DIAS.map((d) => (
                <div key={d} className="flex flex-col gap-1.5 rounded-md border p-2.5">
                  <span className="text-xs font-medium text-muted-foreground">{DIA_LABEL[d]}</span>
                  <div className="grid grid-cols-2 items-center gap-2">
                    <Select value={c.dias[d]?.status ?? "pendente"} onValueChange={(v) => setStatus(candidatoId, d, v ?? "pendente")}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <RubricaCell candidatoId={candidatoId} nome={c.nome} dia={d} p={c.dias[d]} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabela — desktop */}
      {porCandidato.length > 0 && (
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle className="text-base">Semana da ADF</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidato</TableHead>
                  {DIAS.map((d) => (
                    <TableHead key={d}>{DIA_LABEL[d]}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {porCandidato.map(([candidatoId, c]) => (
                  <TableRow key={candidatoId}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    {DIAS.map((d) => (
                      <TableCell key={d}>
                        <div className="flex w-36 flex-col gap-1.5">
                          <Select
                            value={c.dias[d]?.status ?? "pendente"}
                            onValueChange={(v) => setStatus(candidatoId, d, v ?? "pendente")}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <RubricaCell candidatoId={candidatoId} nome={c.nome} dia={d} p={c.dias[d]} />
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="sticky bottom-16 z-30 -mx-4 flex justify-end border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 md:bottom-0">
        <Button onClick={salvar} disabled={saving} className="w-full sm:w-auto">
          {saving ? "Salvando..." : "Salvar presença"}
        </Button>
      </div>

      {rubricando && (
        <Dialog open onOpenChange={(v) => !v && setRubricando(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Rubrica — {rubricando.nome} ({DIA_LABEL[rubricando.dia]})
              </DialogTitle>
            </DialogHeader>
            <SignaturePad value={rubricaTemp} onChange={setRubricaTemp} height={120} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRubricando(null)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button onClick={confirmarRubrica} disabled={!rubricaTemp} className="w-full sm:w-auto">
                Confirmar rubrica
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
