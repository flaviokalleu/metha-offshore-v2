"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FiltroSegmentado } from "@/components/filtro-segmentado";
import { api, ApiClientError } from "@/lib/api-client";

type Adf = {
  id: string;
  numeroAdf: string;
  status: string;
  ativa: boolean;
  associacao_nome: string;
  instrutor_nome: string;
};

export default function AdminAdfsPage() {
  const [rows, setRows] = useState<Adf[]>([]);
  const [filtro, setFiltro] = useState("todas");
  const [reabrindo, setReabrindo] = useState<Adf | null>(null);
  const [justificativa, setJustificativa] = useState("");
  const [saving, setSaving] = useState(false);

  function reload() {
    api<Adf[]>("/adfs").then(setRows);
  }
  useEffect(reload, []);

  const visiveis = rows.filter((a) => {
    if (filtro === "andamento") return a.ativa && a.status !== "finalizada";
    if (filtro === "finalizadas") return a.ativa && a.status === "finalizada";
    if (filtro === "desativadas") return !a.ativa;
    return true;
  });

  async function toggleAtiva(a: Adf) {
    try {
      await api(`/adfs/${a.id}/ativa`, { method: "POST", body: JSON.stringify({ ativa: !a.ativa }) });
      toast.success(a.ativa ? "ADF desativada" : "ADF ativada");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao atualizar ADF");
    }
  }

  async function reabrir() {
    if (!reabrindo || !justificativa.trim()) return;
    setSaving(true);
    try {
      await api(`/adfs/${reabrindo.id}/reabrir`, { method: "POST", body: JSON.stringify({ justificativa }) });
      toast.success("ADF reaberta");
      setReabrindo(null);
      setJustificativa("");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao reabrir ADF");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Admin — Todas as ADFs</h1>

      <FiltroSegmentado
        value={filtro}
        onChange={setFiltro}
        options={[
          { value: "todas", label: "Todas" },
          { value: "andamento", label: "Em andamento" },
          { value: "finalizadas", label: "Finalizadas" },
          { value: "desativadas", label: "Desativadas" },
        ]}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Associação</TableHead>
                <TableHead>Instrutor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Link href={`/adfs/${a.id}` as any} className="font-medium hover:underline">
                      {a.numeroAdf}
                    </Link>
                  </TableCell>
                  <TableCell>{a.associacao_nome}</TableCell>
                  <TableCell>{a.instrutor_nome}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge>{a.status}</Badge>
                      {!a.ativa && <Badge variant="secondary">desativada</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2 text-right">
                    {a.status === "finalizada" && (
                      <Button variant="outline" size="sm" onClick={() => setReabrindo(a)}>
                        Reabrir
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => toggleAtiva(a)}>
                      {a.ativa ? "Desativar" : "Ativar"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!reabrindo} onOpenChange={(v) => !v && setReabrindo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reabrir ADF {reabrindo?.numeroAdf}</DialogTitle>
          </DialogHeader>
          <Textarea placeholder="Justificativa (obrigatória)" value={justificativa} onChange={(e) => setJustificativa(e.target.value)} />
          <DialogFooter>
            <Button onClick={reabrir} disabled={saving || !justificativa.trim()}>
              {saving ? "Salvando..." : "Confirmar reabertura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
