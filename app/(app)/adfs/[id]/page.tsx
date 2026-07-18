"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronRight, ClipboardCheck, FileText, FileWarning, Lock, Pencil, Plus, Trash2, UserCheck, Users2, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FiltroSegmentado } from "@/components/filtro-segmentado";
import { useAuth } from "@/lib/auth-context";
import { api, ApiClientError } from "@/lib/api-client";

type Adf = {
  id: string;
  numeroAdf: string;
  status: string;
  ativa: boolean;
  associacaoId: string;
  instrutorId: string;
  instrutorAuxiliarId: string | null;
  associacao_nome: string;
  instrutor_nome: string;
  instrutor_aux_nome: string | null;
  dataInicio: string;
  dataTermino: string;
};

type Candidato = {
  id: string;
  candidatoNome: string;
  candidatoRegistroTmc: string;
  candidatoEmail: string | null;
  nivelIrata: number;
  ativo: boolean;
  status: string;
  resultado: string | null;
  aprovado: boolean | null;
  qtdDiscLeves: number;
  qtdDiscGraves: number;
};

type Opcao = { id: string; nome: string };

export default function AdfDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [adf, setAdf] = useState<Adf | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [filtroCand, setFiltroCand] = useState("ativos");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editandoAdf, setEditandoAdf] = useState(false);
  const [editandoCand, setEditandoCand] = useState<Candidato | null>(null);

  const [nome, setNome] = useState("");
  const [registro, setRegistro] = useState("");
  const [nivel, setNivel] = useState("1");
  const [email, setEmail] = useState("");

  function reload() {
    api<Adf>(`/adfs/${id}`).then(setAdf);
    api<Candidato[]>(`/adfs/${id}/candidatos`).then(setCandidatos);
  }

  useEffect(reload, [id]);

  async function addCandidato() {
    setSaving(true);
    try {
      await api(`/adfs/${id}/candidatos`, {
        method: "POST",
        body: JSON.stringify({
          candidato_nome: nome,
          candidato_registro_tmc: registro,
          nivel_irata: Number(nivel),
          candidato_email: email || undefined,
        }),
      });
      toast.success("Candidato adicionado");
      setNome("");
      setRegistro("");
      setEmail("");
      setOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao adicionar candidato");
    } finally {
      setSaving(false);
    }
  }

  const [fechando, setFechando] = useState(false);

  async function toggleAtivaAdf() {
    if (!adf) return;
    if (adf.ativa && !confirm("Desativar esta ADF? Ela sai das listas padrão, mas pode ser reativada no filtro 'Desativadas'.")) return;
    try {
      await api(`/adfs/${id}/ativa`, { method: "POST", body: JSON.stringify({ ativa: !adf.ativa }) });
      toast.success(adf.ativa ? "ADF desativada" : "ADF ativada");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao atualizar ADF");
    }
  }

  async function toggleAtivoCandidato(c: Candidato) {
    if (c.ativo && !confirm(`Desativar ${c.candidatoNome}? Ele sai da presença, briefing e relatórios, mas pode ser reativado.`)) return;
    try {
      await api(`/adfs/${id}/candidatos/${c.id}`, { method: "PUT", body: JSON.stringify({ ativo: !c.ativo }) });
      toast.success(c.ativo ? "Candidato desativado" : "Candidato reativado");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao atualizar candidato");
    }
  }

  async function excluirAdf() {
    if (!adf) return;
    if (!confirm(`EXCLUIR a ADF ${adf.numeroAdf}? Todos os candidatos, avaliações, presenças, briefing e incidentes serão apagados. Essa ação NÃO pode ser desfeita.`)) return;
    if (!confirm("Tem certeza mesmo? Essa é a última confirmação.")) return;
    try {
      await api(`/adfs/${id}`, { method: "DELETE" });
      toast.success("ADF excluída");
      router.push("/adfs");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao excluir ADF");
    }
  }

  async function fecharAdf() {
    if (!confirm("Fechar esta ADF? Após o fechamento não será mais possível alterar avaliações, presenças ou briefing.")) return;
    setFechando(true);
    try {
      await api(`/adfs/${id}/finalizar`, { method: "POST" });
      toast.success("ADF fechada");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao fechar ADF");
    } finally {
      setFechando(false);
    }
  }

  async function removeCandidato(cid: string) {
    if (!confirm("Remover este candidato?")) return;
    try {
      await api(`/adfs/${id}/candidatos/${cid}`, { method: "DELETE" });
      toast.success("Candidato removido");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao remover candidato");
    }
  }

  if (!adf) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  const candidatosVisiveis = candidatos.filter((c) =>
    filtroCand === "ativos" ? c.ativo : filtroCand === "inativos" ? !c.ativo : true
  );

  const candidatoDialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" disabled={candidatos.length >= 14} className="gap-1.5" />}>
        <Plus className="size-4" />
        Adicionar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo candidato</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Registro TMC</Label>
            <Input placeholder="ex: 20 46" value={registro} onChange={(e) => setRegistro(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Nível IRATA</Label>
            <Select value={nivel} onValueChange={(v) => setNivel(v ?? "1")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Nível 1</SelectItem>
                <SelectItem value="2">Nível 2</SelectItem>
                <SelectItem value="3">Nível 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>E-mail (opcional)</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={addCandidato} disabled={saving || !nome || !registro} className="w-full sm:w-auto">
            {saving ? "Salvando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">ADF {adf.numeroAdf}</h1>
          <p className="text-sm text-muted-foreground">
            {adf.associacao_nome} · {adf.instrutor_nome}
            {adf.instrutor_aux_nome ? ` + ${adf.instrutor_aux_nome}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(adf.dataInicio).toLocaleDateString("pt-BR")} – {new Date(adf.dataTermino).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!adf.ativa && <Badge variant="secondary">desativada</Badge>}
          <Badge>{adf.status}</Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditandoAdf(true)} className="gap-1.5">
          <Pencil className="size-4" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={`/adfs/${id}/relatorio` as any} />}
          className="gap-1.5"
        >
          <FileText className="size-4" />
          Relatório da ADF
        </Button>
        {adf.status !== "finalizada" && (
          <Button variant="destructive" size="sm" onClick={fecharAdf} disabled={fechando} className="gap-1.5">
            <Lock className="size-4" />
            {fechando ? "Fechando..." : "Fechar ADF"}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={toggleAtivaAdf}>
          {adf.ativa ? "Desativar ADF" : "Ativar ADF"}
        </Button>
        {user?.perfil === "admin" && (
          <Button variant="destructive" size="sm" onClick={excluirAdf} className="gap-1.5">
            <Trash2 className="size-4" />
            Excluir
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/adfs/${id}/presenca` as any} />}
          className="h-auto flex-col gap-1.5 py-3"
        >
          <Users2 className="size-5" />
          <span className="text-xs">Presença</span>
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/adfs/${id}/briefing` as any} />}
          className="h-auto flex-col gap-1.5 py-3"
        >
          <ClipboardCheck className="size-5" />
          <span className="text-xs">Briefing</span>
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/adfs/${id}/incidentes` as any} />}
          className="h-auto flex-col gap-1.5 py-3"
        >
          <FileWarning className="size-5" />
          <span className="text-xs">Incidentes</span>
        </Button>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Candidatos ({candidatos.length}/14)</h2>
          {candidatoDialog}
        </div>

        <div className="mb-3">
          <FiltroSegmentado
            value={filtroCand}
            onChange={setFiltroCand}
            options={[
              { value: "ativos", label: "Ativos" },
              { value: "inativos", label: "Inativos" },
              { value: "todos", label: "Todos" },
            ]}
          />
        </div>

        {candidatosVisiveis.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhum candidato nesse filtro.</CardContent>
          </Card>
        )}

        {/* Cards — mobile */}
        <div className="flex flex-col gap-3 md:hidden">
          {candidatosVisiveis.map((c) => (
            <Card key={c.id} className={c.ativo ? undefined : "opacity-70"}>
              <CardContent className="flex items-center gap-3 py-4">
                <Link href={`/adfs/${id}/candidatos/${c.id}/avaliacao` as any} className="flex flex-1 flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{c.candidatoNome}</span>
                    <Badge variant="outline" className="text-xs">
                      N{c.nivelIrata}
                    </Badge>
                    {!c.ativo && (
                      <Badge variant="secondary" className="text-xs">
                        desativado
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Registro TMC: {c.candidatoRegistroTmc}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {c.qtdDiscLeves} leve(s) · {c.qtdDiscGraves} grave(s)
                    </span>
                    {c.status === "finalizada" ? (
                      <Badge variant={c.aprovado ? "success" : "destructive"} className="text-xs">
                        {c.aprovado ? c.resultado : "reprovado"}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        aberta
                      </Badge>
                    )}
                  </div>
                </Link>
                <div className="flex flex-col items-center gap-1">
                  <ChevronRight className="size-5 text-muted-foreground" />
                  <button
                    onClick={() => setEditandoCand(c)}
                    className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                    aria-label="Editar candidato"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => toggleAtivoCandidato(c)}
                    className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                    aria-label={c.ativo ? "Desativar candidato" : "Reativar candidato"}
                  >
                    {c.ativo ? <UserX className="size-4" /> : <UserCheck className="size-4 text-success" />}
                  </button>
                  {c.status !== "finalizada" && (
                    <button
                      onClick={() => removeCandidato(c.id)}
                      className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Remover candidato"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabela — desktop */}
        {candidatos.length > 0 && (
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Registro TMC</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Discrepâncias</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidatosVisiveis.map((c) => (
                    <TableRow key={c.id} className={c.ativo ? undefined : "opacity-70"}>
                      <TableCell className="font-medium">
                        {c.candidatoNome}
                        {!c.ativo && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            desativado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{c.candidatoRegistroTmc}</TableCell>
                      <TableCell>N{c.nivelIrata}</TableCell>
                      <TableCell className="text-sm">
                        {c.qtdDiscLeves} leve(s) · {c.qtdDiscGraves} grave(s)
                      </TableCell>
                      <TableCell>
                        {c.status === "finalizada" ? (
                          <Badge variant={c.aprovado ? "success" : "destructive"}>
                            {c.aprovado ? c.resultado : "reprovado"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">aberta</Badge>
                        )}
                      </TableCell>
                      <TableCell className="flex justify-end gap-2 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          nativeButton={false}
                          render={<Link href={`/adfs/${id}/candidatos/${c.id}/avaliacao` as any} />}
                        >
                          Avaliar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditandoCand(c)}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => toggleAtivoCandidato(c)}>
                          {c.ativo ? "Desativar" : "Reativar"}
                        </Button>
                        {c.status !== "finalizada" && (
                          <Button variant="ghost" size="sm" onClick={() => removeCandidato(c.id)}>
                            Remover
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {editandoAdf && adf && (
        <EditarAdfDialog
          adf={adf}
          onClose={() => setEditandoAdf(false)}
          onSaved={() => {
            setEditandoAdf(false);
            reload();
          }}
        />
      )}
      {editandoCand && (
        <EditarCandidatoDialog
          adfId={id}
          candidato={editandoCand}
          onClose={() => setEditandoCand(null)}
          onSaved={() => {
            setEditandoCand(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function EditarAdfDialog({ adf, onClose, onSaved }: { adf: Adf; onClose: () => void; onSaved: () => void }) {
  const [numero, setNumero] = useState(adf.numeroAdf);
  const [associacaoId, setAssociacaoId] = useState(adf.associacaoId);
  const [instrutorId, setInstrutorId] = useState(adf.instrutorId);
  const [instrutorAuxId, setInstrutorAuxId] = useState(adf.instrutorAuxiliarId ?? "nenhum");
  const [dataInicio, setDataInicio] = useState(adf.dataInicio.slice(0, 10));
  const [dataTermino, setDataTermino] = useState(adf.dataTermino.slice(0, 10));
  const [associacoes, setAssociacoes] = useState<Opcao[]>([]);
  const [instrutores, setInstrutores] = useState<Opcao[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<Opcao[]>("/associacoes").then(setAssociacoes);
    api<Opcao[]>("/instrutores?todos=1").then(setInstrutores);
  }, []);

  async function salvar() {
    setSaving(true);
    try {
      await api(`/adfs/${adf.id}`, {
        method: "PUT",
        body: JSON.stringify({
          numero_adf: numero,
          associacao_id: associacaoId,
          data_inicio: dataInicio,
          data_termino: dataTermino,
          instrutor_id: instrutorId,
          instrutor_auxiliar_id: instrutorAuxId === "nenhum" ? null : instrutorAuxId,
        }),
      });
      toast.success("ADF atualizada");
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao atualizar ADF");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar ADF</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Número da ADF</Label>
            <Input value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Associação</Label>
            <Select value={associacaoId} onValueChange={(v) => v && setAssociacaoId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue>{associacoes.find((a) => a.id === associacaoId)?.nome ?? adf.associacao_nome}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {associacoes.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Início</Label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Término</Label>
              <Input type="date" value={dataTermino} onChange={(e) => setDataTermino(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Instrutor responsável</Label>
            <Select value={instrutorId} onValueChange={(v) => v && setInstrutorId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue>{instrutores.find((i) => i.id === instrutorId)?.nome ?? adf.instrutor_nome}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {instrutores.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Instrutor auxiliar</Label>
            <Select value={instrutorAuxId} onValueChange={(v) => setInstrutorAuxId(v ?? "nenhum")}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {instrutorAuxId === "nenhum" ? "Sem auxiliar" : (instrutores.find((i) => i.id === instrutorAuxId)?.nome ?? adf.instrutor_aux_nome)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhum">Sem auxiliar</SelectItem>
                {instrutores.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={saving || !numero} className="w-full sm:w-auto">
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditarCandidatoDialog({
  adfId,
  candidato,
  onClose,
  onSaved,
}: {
  adfId: string;
  candidato: Candidato;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(candidato.candidatoNome);
  const [registro, setRegistro] = useState(candidato.candidatoRegistroTmc);
  const [email, setEmail] = useState(candidato.candidatoEmail ?? "");
  const [nivel, setNivel] = useState(String(candidato.nivelIrata));
  const [saving, setSaving] = useState(false);

  async function salvar() {
    setSaving(true);
    try {
      await api(`/adfs/${adfId}/candidatos/${candidato.id}`, {
        method: "PUT",
        body: JSON.stringify({
          candidato_nome: nome,
          candidato_registro_tmc: registro,
          candidato_email: email || null,
          nivel_irata: Number(nivel),
        }),
      });
      toast.success("Candidato atualizado");
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao atualizar candidato");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar candidato</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Registro TMC</Label>
            <Input value={registro} onChange={(e) => setRegistro(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Nível IRATA</Label>
            <Select value={nivel} onValueChange={(v) => setNivel(v ?? "1")} disabled={candidato.status === "finalizada"}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Nível 1</SelectItem>
                <SelectItem value="2">Nível 2</SelectItem>
                <SelectItem value="3">Nível 3</SelectItem>
              </SelectContent>
            </Select>
            {candidato.status === "finalizada" && (
              <p className="text-xs text-muted-foreground">Nível bloqueado: avaliação já finalizada.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={saving || !nome || !registro} className="w-full sm:w-auto">
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
