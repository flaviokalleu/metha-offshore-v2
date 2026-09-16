"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { History, Loader2, LogOut, Phone, PhoneIncoming, PhoneOutgoing, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { ligacoesApi } from "@/lib/ligacoes-audio";
import { useLigacoes, type EstadoSessao, type Sessao } from "@/components/ligacoes/ligacoes-provider";
import { formatarDuracao, formatarTelefone, normalizarTelefone } from "@/components/ligacoes/formatar";

const ESTADOS: Record<EstadoSessao, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  open: { label: "Conectado", variant: "success" },
  connecting: { label: "Conectando…", variant: "secondary" },
  qr: { label: "Aguardando QR", variant: "warning" },
  stopped: { label: "Parado", variant: "secondary" },
  logged_out: { label: "Desconectado", variant: "destructive" },
};

const MOTIVOS: Record<string, string> = {
  user_ended: "Encerrada",
  declined: "Recusada",
  timeout: "Sem resposta",
  busy: "Ocupado",
  cancelled: "Cancelada",
  failed: "Falhou",
  do_not_disturb: "Não perturbe",
  unknown: "Encerrada",
};

type LinhaHistorico = {
  callId: string;
  direction: "outbound" | "inbound";
  peer: string;
  peerName?: string;
  startedAt: number;
  endedAt?: number;
  endReason?: string;
};

function erro(e: unknown, padrao: string) {
  return e instanceof ApiClientError || e instanceof Error ? e.message : padrao;
}

function Discador({
  sessao,
  numero,
  setNumero,
}: {
  sessao: Sessao | undefined;
  numero: string;
  setNumero: (v: string) => void;
}) {
  const { ligar } = useLigacoes();
  const [ligando, setLigando] = useState(false);

  const pronto = sessao?.state === "open";

  async function discar() {
    const tel = normalizarTelefone(numero);
    if (!sessao || !pronto || tel.length < 10 || ligando) return;
    setLigando(true);
    try {
      await ligar(sessao.id, tel);
      setNumero("");
    } catch {
      // toast já exibido pelo provider
    } finally {
      setLigando(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discador</CardTitle>
        <CardDescription>
          Ligação de voz pelo WhatsApp{sessao ? ` da conta ${sessao.name}` : ""}. DDD + número; o +55 é adicionado automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void discar();
          }}
        >
          <Input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="(21) 99999-9999"
            inputMode="tel"
            autoComplete="tel"
            disabled={!pronto}
            className="h-11 text-base sm:flex-1"
          />
          <Button type="submit" size="lg" variant="success" disabled={!pronto || ligando || normalizarTelefone(numero).length < 10}>
            {ligando ? <Loader2 className="animate-spin" /> : <Phone />}
            {ligando ? "Ligando…" : "Ligar"}
          </Button>
        </form>
        {sessao && !pronto && (
          <p className="mt-2 text-sm text-warning">A conta {sessao.name} não está conectada ao WhatsApp.</p>
        )}
      </CardContent>
    </Card>
  );
}

function ContaCard({ sessao }: { sessao: Sessao }) {
  const { qrs } = useLigacoes();
  const [acao, setAcao] = useState<string | null>(null);
  const qr = qrs[sessao.id];
  const estado = ESTADOS[sessao.state] ?? { label: sessao.state, variant: "secondary" as const };
  const numero = sessao.jid ? formatarTelefone(sessao.jid) : null;

  async function executar(nome: string, path: string, method: string, confirmar?: string) {
    if (confirmar && !window.confirm(confirmar)) return;
    setAcao(nome);
    try {
      await ligacoesApi(`/sessions/${encodeURIComponent(sessao.id)}${path}`, { method });
    } catch (e) {
      toast.error(erro(e, "Erro ao executar ação"));
    } finally {
      setAcao(null);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{sessao.name}</p>
            <p className="text-sm text-muted-foreground">{numero ?? "Sem número pareado"}</p>
          </div>
          <Badge variant={estado.variant}>{estado.label}</Badge>
        </div>

        {!sessao.paired && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-4 text-center">
            {qr ? (
              <>
                <div className="rounded-lg bg-white p-3">
                  <QRCodeSVG value={qr} size={220} marginSize={1} />
                </div>
                <p className="text-sm text-muted-foreground">
                  No celular: WhatsApp → Aparelhos conectados → Conectar um aparelho → leia o código.
                </p>
              </>
            ) : sessao.state === "logged_out" || sessao.state === "stopped" ? (
              <p className="text-sm text-muted-foreground">Clique em “Gerar QR code” para conectar esta conta.</p>
            ) : (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Aguardando QR code…
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {!sessao.paired && (
            <Button size="sm" variant="outline" disabled={!!acao} onClick={() => executar("pair", "/pair", "POST")}>
              <RefreshCw className={acao === "pair" ? "animate-spin" : ""} /> Gerar QR code
            </Button>
          )}
          {sessao.paired && (
            <Button size="sm" variant="outline" disabled={!!acao} onClick={() => executar("restart", "/restart", "POST")}>
              <RefreshCw className={acao === "restart" ? "animate-spin" : ""} /> Reiniciar
            </Button>
          )}
          {sessao.paired && (
            <Button
              size="sm"
              variant="outline"
              disabled={!!acao}
              onClick={() => executar("logout", "/logout", "POST", `Desconectar o WhatsApp da conta ${sessao.name}?`)}
            >
              <LogOut /> Desconectar
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            disabled={!!acao}
            onClick={() => executar("delete", "", "DELETE", `Excluir a conta ${sessao.name}? Será preciso ler o QR code de novo.`)}
          >
            <Trash2 /> Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NovaConta() {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function criar() {
    setSalvando(true);
    try {
      await ligacoesApi("/sessions", { method: "POST", body: JSON.stringify({ name: nome.trim() }) });
      setAberto(false);
      setNome("");
    } catch (e) {
      toast.error(erro(e, "Erro ao criar conta"));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="size-4" /> Nova conta
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova conta de WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label>Nome</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Secretaria" onKeyDown={(e) => e.key === "Enter" && nome.trim() && criar()} />
        </div>
        <DialogFooter>
          <Button onClick={criar} disabled={salvando || !nome.trim()} className="w-full sm:w-auto">
            {salvando ? "Criando..." : "Criar e mostrar QR code"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Historico({ sessao, onRediscar }: { sessao: Sessao; onRediscar: (numero: string) => void }) {
  const { chamadas } = useLigacoes();
  const [linhas, setLinhas] = useState<LinhaHistorico[] | null>(null);

  // Recarrega quando alguma chamada começa ou termina.
  useEffect(() => {
    ligacoesApi<{ rows: LinhaHistorico[] }>(`/sessions/${encodeURIComponent(sessao.id)}/history`)
      .then((r) => setLinhas(r.rows ?? []))
      .catch(() => setLinhas([]));
  }, [sessao.id, chamadas.length]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="size-4" /> Últimas ligações
        </CardTitle>
        <CardDescription>Guardado pelo serviço de ligações desde a última reinicialização.</CardDescription>
      </CardHeader>
      <CardContent>
        {linhas === null ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : linhas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma ligação ainda.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {linhas.map((l) => (
              <li key={l.callId} className="flex items-center gap-3 py-2.5">
                {l.direction === "inbound" ? (
                  <PhoneIncoming className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <PhoneOutgoing className="size-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.peerName || formatarTelefone(l.peer)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(l.startedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    {l.endedAt ? ` · ${formatarDuracao(l.endedAt - l.startedAt)}` : ""}
                    {l.endReason ? ` · ${MOTIVOS[l.endReason] ?? l.endReason}` : ""}
                  </p>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Ligar de novo"
                  onClick={() => onRediscar(l.peer.split("@")[0].split(":")[0])}
                >
                  <Phone />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function LigacoesPage() {
  const { user } = useAuth();
  const { habilitado, conectado, sessoes, receberNesteDispositivo, setReceberNesteDispositivo } = useLigacoes();
  const [sessaoId, setSessaoId] = useState<string | null>(null);
  // /ligacoes?numero=... (ex.: botão "Ligar" na lista de instrutores)
  const [numero, setNumero] = useState(() =>
    typeof window === "undefined" ? "" : (new URLSearchParams(window.location.search).get("numero") ?? ""),
  );
  const admin = user?.perfil === "admin";

  const conectadas = sessoes.filter((s) => s.state === "open");
  const sessao = sessoes.find((s) => s.id === sessaoId) ?? conectadas[0] ?? sessoes[0];

  if (!habilitado) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Ligações</h1>
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            O serviço de ligações não está configurado neste servidor (ARENDCALLS_URL / ARENDCALLS_API_KEY).
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Ligações</h1>
          <p className="text-sm text-muted-foreground">Ligações de voz pelo WhatsApp, direto do navegador.</p>
        </div>
        <Badge variant={conectado ? "success" : "warning"}>{conectado ? "Serviço online" : "Conectando ao serviço…"}</Badge>
      </div>

      {sessoes.length > 1 && (
        <div className="flex flex-col gap-2 sm:max-w-xs">
          <Label>Conta de WhatsApp</Label>
          <Select value={sessao?.id ?? ""} onValueChange={(v) => setSessaoId(v)}>
            <SelectTrigger className="w-full">
              <SelectValue>{sessao?.name}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sessoes.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} {s.state !== "open" ? `(${ESTADOS[s.state]?.label ?? s.state})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {sessoes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {admin ? "Nenhuma conta de WhatsApp conectada. Crie uma abaixo e leia o QR code." : "Nenhuma conta de WhatsApp conectada. Peça a um administrador."}
          </CardContent>
        </Card>
      ) : (
        <Discador sessao={sessao} numero={numero} setNumero={setNumero} />
      )}

      <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3 text-sm">
        <Checkbox checked={receberNesteDispositivo} onCheckedChange={(v) => setReceberNesteDispositivo(v === true)} />
        <span>
          <span className="font-medium">Receber chamadas neste dispositivo</span>
          <span className="block text-muted-foreground">Toca e mostra o aviso quando alguém ligar para o WhatsApp da empresa.</span>
        </span>
      </label>

      {sessao && (
        <Historico
          sessao={sessao}
          onRediscar={(n) => {
            setNumero(`+${n}`);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      {admin && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Contas de WhatsApp</h2>
            <NovaConta />
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {sessoes.map((s) => (
              <ContaCard key={s.id} sessao={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
