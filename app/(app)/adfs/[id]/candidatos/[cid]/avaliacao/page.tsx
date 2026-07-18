"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SignaturePad } from "@/components/signature-pad";
import { BackButton } from "@/components/back-button";
import { api, ApiClientError } from "@/lib/api-client";

type Manobra = {
  manobra_id: string;
  modulo: string;
  ordem: number;
  nome: string;
  tipo_nivel: "branca" | "cinza" | "na";
  avaliado: boolean;
  disc_tipo: "leve" | "grave" | null;
  disc_codigos: string[] | null;
  disc_observacao: string | null;
};

type Discrepancia = { id: string; tipo: string; codigo: string; descricao: string };

const RESULTADOS = [
  { value: "satisfatorio", label: "Satisfatório" },
  { value: "bom", label: "Bom" },
  { value: "muito_bom", label: "Muito bom" },
  { value: "excelente", label: "Excelente" },
];

export default function AvaliacaoPage() {
  const { id, cid } = useParams<{ id: string; cid: string }>();
  const router = useRouter();
  const [nivel, setNivel] = useState<number | null>(null);
  const [candidatoNome, setCandidatoNome] = useState<string>("");
  const [manobras, setManobras] = useState<Manobra[]>([]);
  const [discrepancias, setDiscrepancias] = useState<Discrepancia[]>([]);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Manobra | null>(null);

  const [finalizando, setFinalizando] = useState(false);
  const [resultado, setResultado] = useState("satisfatorio");
  const [assinaturaCandidato, setAssinaturaCandidato] = useState<string | null>(null);
  const [assinaturaInstrutor, setAssinaturaInstrutor] = useState<string | null>(null);

  function reload() {
    api<{ nivel: number; candidato_nome: string; manobras: Manobra[] }>(`/adfs/${id}/candidatos/${cid}/avaliacoes`).then((d) => {
      setNivel(d.nivel);
      setCandidatoNome(d.candidato_nome);
      setManobras(d.manobras);
    });
    api<Discrepancia[]>("/catalogo/discrepancias").then(setDiscrepancias);
  }
  useEffect(reload, [id, cid]);

  const porModulo = useMemo(() => {
    const map = new Map<string, Manobra[]>();
    for (const m of manobras) {
      if (m.tipo_nivel === "na") continue;
      if (!map.has(m.modulo)) map.set(m.modulo, []);
      map.get(m.modulo)!.push(m);
    }
    return Array.from(map.entries());
  }, [manobras]);

  const totalLeves = manobras.filter((m) => m.disc_tipo === "leve").length;
  const totalGraves = manobras.filter((m) => m.disc_tipo === "grave").length;
  const reprovaAutomaticamente = totalGraves > 0 || totalLeves >= 3;

  function updateManobra(updated: Manobra) {
    setManobras((prev) => prev.map((m) => (m.manobra_id === updated.manobra_id ? updated : m)));
  }

  async function salvar() {
    setSaving(true);
    try {
      await api(`/adfs/${id}/candidatos/${cid}/avaliacoes`, {
        method: "PUT",
        body: JSON.stringify({
          avaliacoes: manobras
            .filter((m) => m.tipo_nivel !== "na")
            .map((m) => ({
              manobra_id: m.manobra_id,
              avaliado: m.avaliado,
              disc_tipo: m.disc_tipo,
              disc_codigos: m.disc_codigos,
              disc_observacao: m.disc_observacao,
            })),
        }),
      });
      toast.success("Avaliação salva");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar avaliação");
    } finally {
      setSaving(false);
    }
  }

  async function finalizar() {
    if (!assinaturaCandidato || !assinaturaInstrutor) {
      toast.error("As duas assinaturas são obrigatórias");
      return;
    }
    setFinalizando(true);
    try {
      const res = await api<{ aprovado: boolean; resultado: string }>(`/adfs/${id}/candidatos/${cid}/finalizar`, {
        method: "POST",
        body: JSON.stringify({
          resultado,
          assinatura_candidato: assinaturaCandidato,
          assinatura_instrutor: assinaturaInstrutor,
        }),
      });
      toast.success(res.aprovado ? "Candidato aprovado!" : "Candidato reprovado");
      router.push(`/adfs/${id}`);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao finalizar candidato");
    } finally {
      setFinalizando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <BackButton href={`/adfs/${id}`} />

      <div className="sticky top-0 z-40 -mx-4 border-b bg-background/95 px-4 py-2 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <p className="text-lg font-bold sm:text-xl">{candidatoNome || "…"}</p>
        <p className="text-xs text-muted-foreground sm:text-sm">Avaliação de manobras · Nível IRATA {nivel ?? "…"}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Badge variant={totalLeves > 0 ? "warning" : "outline"}>{totalLeves} leve(s)</Badge>
          <Badge variant={totalGraves > 0 ? "destructive" : "outline"}>{totalGraves} grave(s)</Badge>
        </div>
      </div>

      <div className="flex flex-col gap-4 pb-4">
        {porModulo.map(([modulo, ms]) => (
          <Card key={modulo}>
            <CardHeader>
              <CardTitle className="text-base">{modulo}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col divide-y">
              {ms
                .sort((a, b) => a.ordem - b.ordem)
                .map((m) => (
                  <div key={m.manobra_id} className="flex flex-col gap-2.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={m.avaliado}
                        onCheckedChange={(v) => updateManobra({ ...m, avaliado: Boolean(v) })}
                        className="size-5 sm:size-4"
                      />
                      <span className="text-sm">{m.nome}</span>
                      {m.tipo_nivel === "cinza" && (
                        <Badge variant="outline" className="text-xs">
                          opcional
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant={m.disc_tipo ? (m.disc_tipo === "grave" ? "destructive" : "warning") : "outline"}
                      size="sm"
                      onClick={() => setEditing(m)}
                      className="w-full sm:w-auto"
                    >
                      {m.disc_tipo ? `Discrepância: ${m.disc_tipo}` : "Sem discrepância"}
                    </Button>
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Barra de ação fixa no mobile */}
      <div className="sticky bottom-16 z-30 -mx-4 flex justify-end border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 md:bottom-0">
        <Button onClick={salvar} disabled={saving} className="w-full sm:w-auto">
          {saving ? "Salvando..." : "Salvar avaliação"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Finalizar candidato</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {reprovaAutomaticamente && (
            <p className="text-sm font-medium text-destructive">
              Este candidato será marcado como reprovado automaticamente (regra: 0 graves e menos de 3 leves para aprovação).
            </p>
          )}
          <div className="flex flex-col gap-2 sm:max-w-xs">
            <Select value={resultado} onValueChange={(v) => setResultado(v ?? "satisfatorio")} disabled={reprovaAutomaticamente}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESULTADOS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">Assinatura do candidato</p>
              <SignaturePad value={assinaturaCandidato} onChange={setAssinaturaCandidato} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Assinatura do instrutor</p>
              <SignaturePad value={assinaturaInstrutor} onChange={setAssinaturaInstrutor} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={finalizar} disabled={finalizando} className="w-full sm:w-auto">
              {finalizando ? "Finalizando..." : "Finalizar candidato"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {editing && (
        <DiscrepanciaDialog
          manobra={editing}
          discrepancias={discrepancias}
          onClose={() => setEditing(null)}
          onSave={(updated) => {
            updateManobra(updated);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function DiscrepanciaDialog({
  manobra,
  discrepancias,
  onClose,
  onSave,
}: {
  manobra: Manobra;
  discrepancias: Discrepancia[];
  onClose: () => void;
  onSave: (m: Manobra) => void;
}) {
  const [tipo, setTipo] = useState<"nenhuma" | "leve" | "grave">(manobra.disc_tipo ?? "nenhuma");
  const [codigos, setCodigos] = useState<string[]>(manobra.disc_codigos ?? []);
  const [observacao, setObservacao] = useState(manobra.disc_observacao ?? "");

  const opcoes = discrepancias.filter((d) => d.tipo === tipo);

  function toggle(codigo: string) {
    setCodigos((prev) => (prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo]));
  }

  function save() {
    if (tipo !== "nenhuma" && !observacao.trim()) {
      toast.error("Observação obrigatória quando há discrepância");
      return;
    }
    onSave({
      ...manobra,
      disc_tipo: tipo === "nenhuma" ? null : tipo,
      disc_codigos: tipo === "nenhuma" ? null : codigos,
      disc_observacao: tipo === "nenhuma" ? null : observacao,
    });
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{manobra.nome}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Select value={tipo} onValueChange={(v) => setTipo((v ?? "nenhuma") as any)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nenhuma">Sem discrepância</SelectItem>
              <SelectItem value="leve">Discrepância leve</SelectItem>
              <SelectItem value="grave">Discrepância grave</SelectItem>
            </SelectContent>
          </Select>

          {tipo !== "nenhuma" && (
            <>
              <div className="flex max-h-56 flex-col gap-2 overflow-y-auto rounded-md border p-3">
                {opcoes.map((o) => (
                  <label key={o.id} className="flex items-start gap-2 text-sm">
                    <Checkbox checked={codigos.includes(o.codigo)} onCheckedChange={() => toggle(o.codigo)} className="mt-0.5" />
                    <span>
                      <span className="font-medium">{o.codigo}</span> — {o.descricao}
                    </span>
                  </label>
                ))}
              </div>
              <Textarea
                placeholder="Observação (obrigatória)"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={save} className="w-full sm:w-auto">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
