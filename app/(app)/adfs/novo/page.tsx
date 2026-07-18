"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, ApiClientError } from "@/lib/api-client";

type Associacao = { id: string; nome: string };
type Instrutor = { id: string; nome: string; registroIrata: string };

export default function NovaAdfPage() {
  const router = useRouter();
  const [associacoes, setAssociacoes] = useState<Associacao[]>([]);
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);
  const [loading, setLoading] = useState(false);

  const [numeroAdf, setNumeroAdf] = useState("");
  const [associacaoId, setAssociacaoId] = useState("");
  const [instrutorId, setInstrutorId] = useState("");
  const [instrutorAuxiliarId, setInstrutorAuxiliarId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataTermino, setDataTermino] = useState("");

  useEffect(() => {
    api<Associacao[]>("/associacoes").then(setAssociacoes);
    api<Instrutor[]>("/instrutores").then(setInstrutores);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const adf = await api<{ id: string }>("/adfs", {
        method: "POST",
        body: JSON.stringify({
          numero_adf: numeroAdf,
          associacao_id: associacaoId,
          instrutor_id: instrutorId,
          instrutor_auxiliar_id: instrutorAuxiliarId || undefined,
          data_inicio: dataInicio,
          data_termino: dataTermino,
        }),
      });
      toast.success("ADF criada com sucesso");
      router.push(`/adfs/${adf.id}`);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao criar ADF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Nova ADF</h1>
        <p className="text-sm text-muted-foreground">Avaliação de Desempenho de Campo</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Dados da ADF</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="numero">Número da ADF</Label>
              <Input id="numero" value={numeroAdf} onChange={(e) => setNumeroAdf(e.target.value)} required />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Associação</Label>
              <Select value={associacaoId} onValueChange={(v) => setAssociacaoId(v ?? "")} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a associação" />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="inicio">Data início</Label>
                <Input id="inicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="termino">Data término</Label>
                <Input id="termino" type="date" value={dataTermino} onChange={(e) => setDataTermino(e.target.value)} required />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Instrutor responsável</Label>
              <Select value={instrutorId} onValueChange={(v) => setInstrutorId(v ?? "")} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o instrutor" />
                </SelectTrigger>
                <SelectContent>
                  {instrutores.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.nome} ({i.registroIrata})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Instrutor auxiliar (opcional)</Label>
              <Select value={instrutorAuxiliarId} onValueChange={(v) => setInstrutorAuxiliarId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  {instrutores.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.nome} ({i.registroIrata})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={loading} className="mt-2 w-full">
              {loading ? "Criando..." : "Criar ADF"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
