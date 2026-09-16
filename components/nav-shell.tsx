"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Users, ShieldCheck, LogOut, Menu, X, FileSignature, FolderOpen } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard, bottom: true },
  { href: "/adfs", label: "ADFs", icon: ClipboardList, bottom: true },
  { href: "/termo", label: "Indução de Instrutores", icon: FileSignature, bottom: true },
  { href: "/admin/instrutores", label: "Instrutores", icon: Users, adminOnly: true, bottom: true },
  { href: "/admin/usuarios", label: "Usuários", icon: ShieldCheck, adminOnly: true },
  { href: "/admin/termos", label: "Indução de Instrutores", icon: FileSignature, adminOnly: true },
  { href: "/admin/documentos", label: "Documentos", icon: FolderOpen, adminOnly: true },
];

export function NavShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const items = NAV.filter((n) => !n.adminOnly || user?.perfil === "admin");
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      {/* Header mobile */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-sidebar px-4 pb-3.5 pt-3 text-sidebar-foreground md:hidden print:hidden">
        <div className="stripe-hazard absolute inset-x-0 bottom-0 h-1" />
        <div>
          <p className="font-display text-base font-semibold uppercase leading-none tracking-widest">
            Metha <span className="text-(--hivis)">Offshore</span>
          </p>
          <p className="font-display text-[11px] uppercase tracking-[0.2em] text-sidebar-foreground/50">ADF · IRATA</p>
        </div>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex size-9 items-center justify-center rounded-full hover:bg-white/10"
          aria-label="Menu"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 md:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute right-0 top-0 flex h-full w-64 flex-col gap-1 bg-sidebar p-4 pt-6 text-sidebar-foreground shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="truncate text-sm font-medium">{user?.nome}</p>
              <button
                onClick={() => setMenuOpen(false)}
                className="flex size-7 shrink-0 items-center justify-center rounded-full hover:bg-white/10"
                aria-label="Fechar menu"
              >
                <X className="size-4" />
              </button>
            </div>
            {NAV.filter((n) => !n.adminOnly || user?.perfil === "admin").map((n) => (
              <Link
                key={n.href}
                href={n.href as any}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "font-display flex items-center gap-3 rounded-md border-l-[3px] px-3 py-2.5 text-[15px] font-medium uppercase tracking-wider transition-colors",
                  isActive(n.href)
                    ? "border-sidebar-primary bg-white/10 font-medium text-white"
                    : "border-transparent text-sidebar-foreground/75 hover:bg-white/5 hover:text-white"
                )}
              >
                <n.icon className="size-4" />
                {n.label}
              </Link>
            ))}
            {user?.perfil === "admin" && (
              <Link
                href="/admin/adfs"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "font-display flex items-center gap-3 rounded-md border-l-[3px] px-3 py-2.5 text-[15px] font-medium uppercase tracking-wider transition-colors",
                  isActive("/admin/adfs")
                    ? "border-sidebar-primary bg-white/10 font-medium text-white"
                    : "border-transparent text-sidebar-foreground/75 hover:bg-white/5 hover:text-white"
                )}
              >
                <ShieldCheck className="size-4" />
                Admin ADFs
              </Link>
            )}
            <Button
              variant="ghost"
              className="mt-auto justify-start gap-3 px-3 text-sidebar-foreground/75 hover:bg-white/5 hover:text-white"
              onClick={logout}
            >
              <LogOut className="size-4" />
              Sair
            </Button>
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="relative hidden w-56 shrink-0 flex-col bg-sidebar p-4 pt-5 text-sidebar-foreground md:flex print:hidden">
        <div className="stripe-hazard absolute inset-x-0 top-0 h-1" />
        <div className="mb-6 px-2">
          <p className="font-display text-lg font-semibold uppercase leading-tight tracking-widest">
            Metha <span className="text-(--hivis)">Offshore</span>
          </p>
          <p className="font-display text-[11px] uppercase tracking-[0.2em] text-sidebar-foreground/50">ADF · IRATA</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map((n) => (
            <Link
              key={n.href}
              href={n.href as any}
              className={cn(
                "font-display flex items-center gap-2.5 rounded-md border-l-[3px] px-3 py-2 text-[15px] font-medium uppercase tracking-wider transition-colors",
                isActive(n.href)
                  ? "border-sidebar-primary bg-white/10 font-medium text-white"
                  : "border-transparent text-sidebar-foreground/75 hover:bg-white/5 hover:text-white"
              )}
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
          {user?.perfil === "admin" && (
            <Link
              href="/admin/adfs"
              className={cn(
                "font-display flex items-center gap-2.5 rounded-md border-l-[3px] px-3 py-2 text-[15px] font-medium uppercase tracking-wider transition-colors",
                isActive("/admin/adfs")
                  ? "border-sidebar-primary bg-white/10 font-medium text-white"
                  : "border-transparent text-sidebar-foreground/75 hover:bg-white/5 hover:text-white"
              )}
            >
              <ShieldCheck className="size-4" />
              Admin ADFs
            </Link>
          )}
        </nav>
        <div className="mt-auto border-t border-sidebar-border pt-4">
          <p className="truncate px-2 text-xs text-sidebar-foreground/50">{user?.nome}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 w-full justify-start gap-2 text-sidebar-foreground/75 hover:bg-white/5 hover:text-white"
            onClick={logout}
          >
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden bg-background pb-20 md:pb-0 print:pb-0">
        <div className="mx-auto max-w-6xl p-4 md:p-8 print:max-w-none print:p-0">{children}</div>
      </main>

      {/* Bottom tab bar mobile */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch bg-sidebar text-sidebar-foreground md:hidden print:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {items.filter((n) => n.bottom).map((n) => (
          <Link
            key={n.href}
            href={n.href as any}
            className={cn(
              "font-display flex flex-1 flex-col items-center justify-center gap-0.5 border-t-2 py-2.5 text-[11px] uppercase tracking-wider",
              isActive(n.href)
                ? "border-(--hivis) text-white"
                : "border-transparent text-sidebar-foreground/50"
            )}
          >
            <n.icon className={cn("size-5", isActive(n.href) && "text-(--hivis)")} />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
