"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FiltroSegmentado } from "@/components/filtro-segmentado";
import { api } from "@/lib/api-client";

type Adf = {
  id: string;
  numeroAdf: string;
  status: string;
  total_candidatos: number;
  associacao_nome: string;
  instrutor_nome: string;
  dataInicio: string;
  dataTermino: string;
};

const STATUS_VARIANT: Record<string, string> = {
  aberta: "default",
  reaberta: "secondary",
  finalizada: "outline",
};

export default function AdfsListPage() {
  const [adfs, setAdfs] = useState<Adf[]>([]);
  const [filtro, setFiltro] = useState<string>("andamento");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<Adf[]>("/adfs")
      .then(setAdfs)
      .finally(() => setLoading(false));
  }, []);

  const visiveis = adfs.filter((a) =>
    filtro === "andamento" ? a.status !== "finalizada" : filtro === "finalizadas" ? a.status === "finalizada" : true
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">ADFs</h1>
          <p className="text-sm text-muted-foreground">Avaliações de Desempenho de Campo</p>
        </div>
        <Button nativeButton={false} render={<Link href="/adfs/novo" />} className="gap-1.5">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nova ADF</span>
        </Button>
      </div>

      <FiltroSegmentado
        value={filtro}
        onChange={setFiltro}
        options={[
          { value: "andamento", label: "Em andamento" },
          { value: "finalizadas", label: "Finalizadas" },
          { value: "todas", label: "Todas" },
        ]}
      />

      {!loading && visiveis.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhuma ADF encontrada.</CardContent>
        </Card>
      )}

      {/* Cards — mobile */}
      <div className="flex flex-col gap-3 md:hidden">
        {visiveis.map((a) => (
          <Link key={a.id} href={`/adfs/${a.id}` as any}>
            <Card className="active:bg-muted/50">
              <CardContent className="flex items-center justify-between gap-3 py-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{a.numeroAdf}</span>
                    <Badge variant={(STATUS_VARIANT[a.status] as any) ?? "default"}>{a.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {a.instrutor_nome} · {a.associacao_nome}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.dataInicio).toLocaleDateString("pt-BR")} – {new Date(a.dataTermino).toLocaleDateString("pt-BR")} ·{" "}
                    {a.total_candidatos}/14 candidatos
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Tabela — desktop */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Associação</TableHead>
                <TableHead>Instrutor</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Candidatos</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map((a) => (
                <TableRow key={a.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/adfs/${a.id}` as any} className="font-medium hover:underline">
                      {a.numeroAdf}
                    </Link>
                  </TableCell>
                  <TableCell>{a.associacao_nome}</TableCell>
                  <TableCell>{a.instrutor_nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(a.dataInicio).toLocaleDateString("pt-BR")} – {new Date(a.dataTermino).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>{a.total_candidatos}/14</TableCell>
                  <TableCell>
                    <Badge variant={(STATUS_VARIANT[a.status] as any) ?? "default"}>{a.status}</Badge>
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
