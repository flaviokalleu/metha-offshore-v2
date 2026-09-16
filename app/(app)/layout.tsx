"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { NavShell } from "@/components/nav-shell";
import { LigacoesProvider } from "@/components/ligacoes/ligacoes-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando...</div>;
  }
  if (!user) return null;

  return (
    <LigacoesProvider>
      <NavShell>{children}</NavShell>
    </LigacoesProvider>
  );
}
