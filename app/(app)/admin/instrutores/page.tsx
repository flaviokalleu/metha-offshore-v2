"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FiltroSegmentado } from "@/components/filtro-segmentado";
import { api, ApiClientError } from "@/lib/api-client";

type Instrutor = {
  id: string;
  nome: string;
  registroIrata: string;
  nivel: number;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
};

export default function AdminInstrutoresPage() {
  const [rows, setRows] = useState<Instrutor[]>([]);
  const [filtro, setFiltro] = useState("ativos");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState("");
  const [registro, setRegistro] = useState("");
  const [nivel, setNivel] = useState("1");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  function reload() {
    api<Instrutor[]>("/instrutores?todos=1").then(setRows);
  }
  useEffect(reload, []);

  const visiveis = rows.filter((i) => (filtro === "ativos" ? i.ativo : filtro === "inativos" ? !i.ativo : true));

  async function criar() {
    setSaving(true);
    try {
      await api("/instrutores", {
        method: "POST",
        body: JSON.stringify({ nome, registro_irata: registro, nivel: Number(nivel), email: email || undefined, telefone: telefone || undefined }),
      });
      toast.success("Instrutor cadastrado");
      setNome("");
      setRegistro("");
      setEmail("");
      setTelefone("");
      setOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao cadastrar instrutor");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAtivo(i: Instrutor) {
    try {
      await api(`/instrutores/${i.id}`, { method: "PUT", body: JSON.stringify({ ativo: !i.ativo }) });
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao atualizar");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Instrutores</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="gap-1.5" />}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">Novo instrutor</span>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo instrutor</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Nome</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Registro IRATA</Label>
                <Input value={registro} onChange={(e) => setRegistro(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Nível</Label>
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
                <Label>E-mail</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Telefone</Label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={criar} disabled={saving || !nome || !registro} className="w-full sm:w-auto">
                {saving ? "Salvando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <FiltroSegmentado
        value={filtro}
        onChange={setFiltro}
        options={[
          { value: "ativos", label: "Ativos" },
          { value: "inativos", label: "Inativos" },
          { value: "todos", label: "Todos" },
        ]}
      />

      {/* Cards — mobile */}
      <div className="flex flex-col gap-3 md:hidden">
        {visiveis.map((i) => (
          <Card key={i.id}>
            <CardContent className="flex items-center justify-between gap-3 py-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{i.nome}</span>
                  <Badge variant="outline" className="text-xs">
                    N{i.nivel}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">IRATA {i.registroIrata}</p>
                {i.email && <p className="text-xs text-muted-foreground">{i.email}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={i.ativo ? "default" : "secondary"}>{i.ativo ? "ativo" : "inativo"}</Badge>
                <Button variant="outline" size="sm" onClick={() => toggleAtivo(i)}>
                  {i.ativo ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {visiveis.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhum instrutor nesse filtro.</CardContent>
          </Card>
        )}
      </div>

      {/* Tabela — desktop */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Registro IRATA</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.nome}</TableCell>
                  <TableCell>{i.registroIrata}</TableCell>
                  <TableCell>N{i.nivel}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{i.email ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={i.ativo ? "default" : "secondary"}>{i.ativo ? "ativo" : "inativo"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => toggleAtivo(i)}>
                      {i.ativo ? "Desativar" : "Ativar"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
