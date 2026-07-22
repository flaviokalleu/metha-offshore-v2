"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { ApiClientError } from "@/lib/api-client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const [loginValue, setLoginValue] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginValue, senha, searchParams.get("next") ?? undefined);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Erro ao entrar";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-(--sidebar) p-4">
      <Card className="w-full max-w-sm pt-0 shadow-2xl ring-0">
        <div className="stripe-hazard h-1.5" />
        <CardContent className="pt-4">
          <div className="mb-6 flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-metha.webp" alt="Metha Treinamentos Offshore" className="h-20 w-auto object-contain" />
            <p className="font-display mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Avaliação de Desempenho de Campo · IRATA
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="login" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                E-mail ou registro IRATA
              </Label>
              <Input
                id="login"
                value={loginValue}
                onChange={(e) => setLoginValue(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="senha" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Senha
              </Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="mt-2 w-full">
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
