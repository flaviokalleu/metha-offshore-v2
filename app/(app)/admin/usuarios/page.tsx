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

type Usuario = {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  registroIrata: string | null;
  status: string;
};

export default function AdminUsuariosPage() {
  const [rows, setRows] = useState<Usuario[]>([]);
  const [filtro, setFiltro] = useState("ativos");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState("instrutor");

  function reload() {
    api<Usuario[]>("/admin/usuarios").then(setRows);
  }
  useEffect(reload, []);

  const visiveis = rows.filter((u) => (filtro === "ativos" ? u.status === "ativo" : filtro === "inativos" ? u.status !== "ativo" : true));

  async function criar() {
    setSaving(true);
    try {
      await api("/admin/usuarios", {
        method: "POST",
        body: JSON.stringify({ nome, email, senha, perfil }),
      });
      toast.success("Usuário criado");
      setNome("");
      setEmail("");
      setSenha("");
      setOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao criar usuário");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(u: Usuario, status: string) {
    try {
      await api(`/admin/usuarios/${u.id}`, { method: "PUT", body: JSON.stringify({ status }) });
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao atualizar usuário");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Usuários</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="gap-1.5" />}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">Novo usuário</span>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo usuário</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Nome</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>E-mail</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Senha (mín. 8 caracteres)</Label>
                <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Perfil</Label>
                <Select value={perfil} onValueChange={(v) => setPerfil(v ?? "instrutor")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instrutor">Instrutor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={criar} disabled={saving || !nome || !email || senha.length < 8} className="w-full sm:w-auto">
                {saving ? "Salvando..." : "Criar"}
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
        {visiveis.map((u) => (
          <Card key={u.id}>
            <CardContent className="flex items-center justify-between gap-3 py-4">
              <div className="flex flex-col gap-1">
                <span className="font-semibold">{u.nome}</span>
                <p className="text-sm text-muted-foreground">{u.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{u.perfil}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={u.status === "ativo" ? "default" : u.status === "bloqueado" ? "destructive" : "secondary"}>
                  {u.status}
                </Badge>
                {u.status !== "ativo" ? (
                  <Button variant="outline" size="sm" onClick={() => setStatus(u, "ativo")}>
                    Ativar
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setStatus(u, "inativo")}>
                    Inativar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {visiveis.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhum usuário nesse filtro.</CardContent>
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
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.perfil}</TableCell>
                  <TableCell>
                    <Badge variant={u.status === "ativo" ? "default" : u.status === "bloqueado" ? "destructive" : "secondary"}>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2 text-right">
                    {u.status !== "ativo" && (
                      <Button variant="outline" size="sm" onClick={() => setStatus(u, "ativo")}>
                        Ativar
                      </Button>
                    )}
                    {u.status === "ativo" && (
                      <Button variant="outline" size="sm" onClick={() => setStatus(u, "inativo")}>
                        Inativar
                      </Button>
                    )}
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
