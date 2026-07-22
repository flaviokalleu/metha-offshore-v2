"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FiltroSegmentado } from "@/components/filtro-segmentado";
import { api, ApiClientError } from "@/lib/api-client";

type Instrutor = {
  id: string;
  nome: string;
  registroIrata: string;
  email: string | null;
  ativo: boolean;
  termo_assinado: boolean;
  termo_assinado_em: string | null;
  termo_enviado_em: string | null;
};

export default function AdminTermosPage() {
  const [rows, setRows] = useState<Instrutor[]>([]);
  const [filtro, setFiltro] = useState("pendentes");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [enviando, setEnviando] = useState(false);

  function reload() {
    api<Instrutor[]>("/termos").then(setRows);
  }
  useEffect(reload, []);

  const visiveis = rows.filter((i) => {
    if (filtro === "pendentes") return i.ativo && !i.termo_assinado;
    if (filtro === "assinados") return i.termo_assinado;
    return true;
  });

  function toggle(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function enviarSelecionados() {
    if (selecionados.size === 0) return;
    setEnviando(true);
    try {
      const res = await api<{ enviados: string[]; sem_email: string[]; falhas: string[] }>("/termos/enviar", {
        method: "POST",
        body: JSON.stringify({ instrutor_ids: Array.from(selecionados) }),
      });
      let msg = `Termo enviado para ${res.enviados.length} instrutor(es)`;
      if (res.falhas.length > 0) msg += ` · ${res.falhas.length} falha(s)`;
      if (res.sem_email.length > 0) msg += ` · sem e-mail: ${res.sem_email.join(", ")}`;
      toast.success(msg, { duration: 6000 });
      setSelecionados(new Set());
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao enviar termos");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Indução de Instrutores</h1>
          <p className="text-sm text-muted-foreground">Recebimento de documentos e indução de instrutores</p>
        </div>
        <Button onClick={enviarSelecionados} disabled={enviando || selecionados.size === 0} className="gap-1.5">
          <Mail className="size-4" />
          {enviando ? "Enviando..." : `Enviar por e-mail (${selecionados.size})`}
        </Button>
      </div>

      <FiltroSegmentado
        value={filtro}
        onChange={setFiltro}
        options={[
          { value: "pendentes", label: "Pendentes" },
          { value: "assinados", label: "Assinados" },
          { value: "todos", label: "Todos" },
        ]}
      />

      <div className="flex flex-col gap-3 md:hidden">
        {visiveis.map((i) => (
          <Card key={i.id}>
            <CardContent className="flex items-center gap-3 py-4">
              <Checkbox checked={selecionados.has(i.id)} onCheckedChange={() => toggle(i.id)} disabled={!i.email} />
              <div className="flex flex-1 flex-col gap-1">
                <span className="font-semibold">{i.nome}</span>
                <p className="text-sm text-muted-foreground">IRATA {i.registroIrata}</p>
                {!i.email && <p className="text-xs text-destructive">Sem e-mail cadastrado</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={i.termo_assinado ? "success" : "secondary"}>{i.termo_assinado ? "assinado" : "pendente"}</Badge>
                <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/termos/${i.id}` as any} />}>
                  Ver
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

      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Registro IRATA</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <Checkbox checked={selecionados.has(i.id)} onCheckedChange={() => toggle(i.id)} disabled={!i.email} />
                  </TableCell>
                  <TableCell className="font-medium">{i.nome}</TableCell>
                  <TableCell>{i.registroIrata}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{i.email ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={i.termo_assinado ? "success" : "secondary"}>{i.termo_assinado ? "assinado" : "pendente"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      nativeButton={false}
                      render={<Link href={`/admin/termos/${i.id}` as any} />}
                    >
                      <FileText className="size-4" />
                      Ver / Imprimir
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
