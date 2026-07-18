"use client";

import { useEffect, useState } from "react";
import { X, Share, SquarePlus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "metha_install_dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return; // já instalado

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIos) {
      setShowIos(true);
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  async function instalar() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    setDeferred(null);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 rounded-lg border border-(--hivis)/40 bg-sidebar p-3 text-sidebar-foreground shadow-xl md:left-auto md:right-6 md:bottom-6 md:w-96 print:hidden">
      <button onClick={dismiss} className="absolute right-2 top-2 rounded-full p-1 hover:bg-white/10" aria-label="Fechar">
        <X className="size-4" />
      </button>
      <p className="font-display pr-6 text-sm font-semibold uppercase tracking-wider">
        Instalar <span className="text-(--hivis)">Metha ADF</span>
      </p>
      {showIos ? (
        <p className="mt-1.5 text-sm text-sidebar-foreground/80">
          Toque em <Share className="inline size-4 align-text-bottom" /> <strong>Compartilhar</strong> e depois em{" "}
          <SquarePlus className="inline size-4 align-text-bottom" /> <strong>Adicionar à Tela de Início</strong> para usar como
          aplicativo.
        </p>
      ) : (
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-sm text-sidebar-foreground/80">Use como aplicativo, direto da tela inicial.</p>
          <Button size="sm" onClick={instalar} className="shrink-0 gap-1.5 bg-(--hivis) text-white hover:bg-(--hivis)/85">
            <Download className="size-4" />
            Instalar
          </Button>
        </div>
      )}
    </div>
  );
}
