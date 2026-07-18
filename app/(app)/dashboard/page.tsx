"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

type Adf = {
  id: string;
  numeroAdf: string;
  status: string;
  total_candidatos: number;
  associacao_nome: string;
  instrutor_nome: string;
  dataInicio: string;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [adfs, setAdfs] = useState<Adf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Adf[]>("/adfs")
      .then(setAdfs)
      .finally(() => setLoading(false));
  }, []);

  const abertas = adfs.filter((a) => a.status === "aberta" || a.status === "reaberta").length;
  const finalizadas = adfs.filter((a) => a.status === "finalizada").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Olá, {user?.nome?.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">Resumo das Avaliações de Desempenho de Campo (ADFs).</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de ADFs</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{loading ? "…" : adfs.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abertas</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{loading ? "…" : abertas}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Finalizadas</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{loading ? "…" : finalizadas}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ADFs recentes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          {adfs.slice(0, 8).map((a) => (
            <Link
              key={a.id}
              href={`/adfs/${a.id}` as any}
              className="flex items-center justify-between py-2 text-sm hover:opacity-70"
            >
              <span className="font-medium">{a.numeroAdf}</span>
              <span className="text-muted-foreground">
                {a.instrutor_nome} · {a.total_candidatos} candidato(s) · {a.status}
              </span>
            </Link>
          ))}
          {!loading && adfs.length === 0 && <p className="py-4 text-sm text-muted-foreground">Nenhuma ADF cadastrada ainda.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
