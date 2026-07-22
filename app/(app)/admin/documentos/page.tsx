"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Mail, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api, ApiClientError, getAccessToken } from "@/lib/api-client";

type Documento = { id: string; nome: string; mimeType: string; tamanho: number; criadoEm: string };
type Instrutor = { id: string; nome: string; email: string | null };
type Adf = { id: string; numeroAdf: string };
type Candidato = { id: string; candidatoNome: string; candidatoEmail: string | null };

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdminDocumentosPage() {
  const [docs, setDocs] = useState<Documento[]>([]);
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);
  const [adfs, setAdfs] = useState<Adf[]>([]);
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [enviarDoc, setEnviarDoc] = useState<Documento | null>(null);

  function reload() {
    api<Documento[]>("/documentos").then(setDocs);
  }
  useEffect(() => {
    reload();
    api<Instrutor[]>("/instrutores?todos=1").then(setInstrutores);
    api<Adf[]>("/adfs").then(setAdfs);
  }, []);

  async function upload() {
    if (!arquivo || !nome.trim()) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append("nome", nome.trim());
      form.append("arquivo", arquivo);
      await api("/documentos", { method: "POST", body: form });
      toast.success("Documento enviado");
      setNome("");
      setArquivo(null);
      setOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao enviar documento");
    } finally {
      setSaving(false);
    }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este documento? Ele será removido do armazenamento.")) return;
    try {
      await api(`/documentos/${id}`, { method: "DELETE" });
      toast.success("Documento removido");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao remover documento");
    }
  }

  function baixar(doc: Documento) {
    const token = getAccessToken();
    window.open(`/api/documentos/${doc.id}/arquivo?token=${encodeURIComponent(token ?? "")}`, "_blank");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Documentos</h1>
          <p className="text-sm text-muted-foreground">Apostilas, manuais e materiais para envio por e-mail</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="gap-1.5" />}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">Enviar documento</span>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo documento</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Nome do documento</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Apostila IRATA Nível 1" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Arquivo (PDF, imagem, etc. — até 20MB)</Label>
                <input
                  type="file"
                  onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
                  className="rounded-md border border-input bg-card p-2 text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={upload} disabled={saving || !arquivo || !nome.trim()} className="w-full gap-1.5 sm:w-auto">
                <Upload className="size-4" />
                {saving ? "Enviando..." : "Enviar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {docs.map((d) => (
          <Card key={d.id}>
            <CardContent className="flex flex-col gap-2 py-4">
              <span className="font-semibold">{d.nome}</span>
              <p className="text-xs text-muted-foreground">
                {formatBytes(d.tamanho)} · {new Date(d.criadoEm).toLocaleDateString("pt-BR")}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => baixar(d)}>
                  <Download className="size-4" />
                  Baixar
                </Button>
                <Button size="sm" className="flex-1 gap-1.5" onClick={() => setEnviarDoc(d)}>
                  <Mail className="size-4" />
                  Enviar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => excluir(d.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {docs.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhum documento enviado ainda.</CardContent>
          </Card>
        )}
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Enviado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatBytes(d.tamanho)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(d.criadoEm).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="flex justify-end gap-2 text-right">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => baixar(d)}>
                      <Download className="size-4" />
                      Baixar
                    </Button>
                    <Button size="sm" className="gap-1.5" onClick={() => setEnviarDoc(d)}>
                      <Mail className="size-4" />
                      Enviar por e-mail
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => excluir(d.id)}>
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {enviarDoc && (
        <EnviarDocumentoDialog
          documento={enviarDoc}
          instrutores={instrutores}
          adfs={adfs}
          onClose={() => setEnviarDoc(null)}
        />
      )}
    </div>
  );
}

function EnviarDocumentoDialog({
  documento,
  instrutores,
  adfs,
  onClose,
}: {
  documento: Documento;
  instrutores: Instrutor[];
  adfs: Adf[];
  onClose: () => void;
}) {
  const [instrutoresSel, setInstrutoresSel] = useState<Set<string>>(new Set());
  const [adfId, setAdfId] = useState<string>("");
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [candidatosSel, setCandidatosSel] = useState<Set<string>>(new Set());
  const [emailAvulso, setEmailAvulso] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!adfId) {
      setCandidatos([]);
      return;
    }
    api<Candidato[]>(`/adfs/${adfId}/candidatos`).then(setCandidatos);
  }, [adfId]);

  function toggleInstrutor(id: string) {
    setInstrutoresSel((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleCandidato(id: string) {
    setCandidatosSel((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function enviar() {
    const destinatarios = [
      ...instrutores.filter((i) => instrutoresSel.has(i.id) && i.email).map((i) => ({ email: i.email!, nome: i.nome })),
      ...candidatos.filter((c) => candidatosSel.has(c.id) && c.candidatoEmail).map((c) => ({ email: c.candidatoEmail!, nome: c.candidatoNome })),
      ...(emailAvulso.trim() ? [{ email: emailAvulso.trim(), nome: emailAvulso.trim() }] : []),
    ];
    if (destinatarios.length === 0) {
      toast.error("Selecione ao menos um destinatário com e-mail cadastrado");
      return;
    }
    setEnviando(true);
    try {
      const res = await api<{ enviados: string[]; falhas: string[] }>(`/documentos/${documento.id}/enviar`, {
        method: "POST",
        body: JSON.stringify({ destinatarios, mensagem: mensagem.trim() || undefined }),
      });
      let msg = `Enviado para ${res.enviados.length} destinatário(s)`;
      if (res.falhas.length > 0) msg += ` · ${res.falhas.length} falha(s)`;
      toast.success(msg);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao enviar documento");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar &quot;{documento.nome}&quot; por e-mail</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Instrutores</Label>
            <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-md border p-2">
              {instrutores.map((i) => (
                <label key={i.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={instrutoresSel.has(i.id)} onCheckedChange={() => toggleInstrutor(i.id)} disabled={!i.email} />
                  {i.nome} {!i.email && <span className="text-xs text-muted-foreground">(sem e-mail)</span>}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Alunos de uma ADF (opcional)</Label>
            <Select value={adfId} onValueChange={(v) => setAdfId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a ADF" />
              </SelectTrigger>
              <SelectContent>
                {adfs.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.numeroAdf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {candidatos.length > 0 && (
              <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-md border p-2">
                {candidatos.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={candidatosSel.has(c.id)}
                      onCheckedChange={() => toggleCandidato(c.id)}
                      disabled={!c.candidatoEmail}
                    />
                    {c.candidatoNome} {!c.candidatoEmail && <span className="text-xs text-muted-foreground">(sem e-mail)</span>}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Outro e-mail (opcional)</Label>
            <Input type="email" value={emailAvulso} onChange={(e) => setEmailAvulso(e.target.value)} placeholder="alguem@exemplo.com" />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Mensagem (opcional)</Label>
            <Textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={enviar} disabled={enviando} className="w-full gap-1.5 sm:w-auto">
            <Mail className="size-4" />
            {enviando ? "Enviando..." : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
