"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SignaturePad } from "@/components/signature-pad";
import { BackButton } from "@/components/back-button";
import { useAuth } from "@/lib/auth-context";
import { api, ApiClientError } from "@/lib/api-client";

type Incidente = {
  id: string;
  tipoOcorrencia: string;
  relato: string;
  origem: string | null;
  medidaAdotada: string | null;
  comunicadoDirecao: boolean;
  responsavel_nome: string;
  assinaturaInstrutor: string | null;
  criadoEm: string;
};

export default function IncidentesPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [rows, setRows] = useState<Incidente[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [tipo, setTipo] = useState("incidente");
  const [relato, setRelato] = useState("");
  const [origem, setOrigem] = useState("");
  const [medida, setMedida] = useState("");
  const [assinatura, setAssinatura] = useState<string | null>(null);

  function reload() {
    api<Incidente[]>(`/adfs/${id}/incidentes`).then(setRows);
  }
  useEffect(reload, [id]);

  async function criar() {
    if (!assinatura) {
      toast.error("Assinatura do responsável é obrigatória");
      return;
    }
    setSaving(true);
    try {
      await api(`/adfs/${id}/incidentes`, {
        method: "POST",
        body: JSON.stringify({
          tipo_ocorrencia: tipo,
          relato,
          origem: origem || undefined,
          medida_adotada: medida || undefined,
          assinatura_instrutor: assinatura,
        }),
      });
      toast.success("Registrado com sucesso");
      setRelato("");
      setOrigem("");
      setMedida("");
      setAssinatura(null);
      setOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao registrar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <BackButton href={`/adfs/${id}`} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold sm:text-2xl">Incidentes / Não conformidades</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/adfs/${id}/incidentes/relatorio` as any} />}
            className="gap-1.5"
          >
            <FileText className="size-4" />
            Relatório
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>Registrar</DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo registro</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={(v) => setTipo(v ?? "incidente")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incidente">Incidente</SelectItem>
                      <SelectItem value="nao_conformidade">Não conformidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Relato</Label>
                  <Textarea value={relato} onChange={(e) => setRelato(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Origem (opcional)</Label>
                  <Input value={origem} onChange={(e) => setOrigem(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Medida adotada (opcional)</Label>
                  <Textarea value={medida} onChange={(e) => setMedida(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2 rounded-md border p-3">
                  <p className="text-sm font-medium">
                    Responsável pelo relatório: <span className="font-bold">{user?.nome ?? "—"}</span>
                  </p>
                  <Label>Assinatura do responsável</Label>
                  <SignaturePad value={assinatura} onChange={setAssinatura} height={120} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={criar} disabled={saving || !relato || !assinatura} className="w-full sm:w-auto">
                  {saving ? "Salvando..." : "Registrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">
                <Badge variant={r.tipoOcorrencia === "nao_conformidade" ? "secondary" : "default"}>
                  {r.tipoOcorrencia === "nao_conformidade" ? "Não conformidade" : "Incidente"}
                </Badge>
              </CardTitle>
              <span className="text-xs text-muted-foreground">{new Date(r.criadoEm).toLocaleString("pt-BR")}</span>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
              <p>{r.relato}</p>
              {r.origem && <p className="text-muted-foreground">Origem: {r.origem}</p>}
              {r.medidaAdotada && <p className="text-muted-foreground">Medida adotada: {r.medidaAdotada}</p>}
              <div className="mt-1 flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Responsável: {r.responsavel_nome}</p>
                {r.assinaturaInstrutor && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.assinaturaInstrutor} alt="Assinatura" className="h-8 rounded border bg-white object-contain" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">Nenhum registro.</p>}
      </div>
    </div>
  );
}
