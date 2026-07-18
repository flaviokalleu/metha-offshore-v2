"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton({ href, label = "Voltar" }: { href: string; label?: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      nativeButton={false}
      render={<Link href={href as any} />}
      className="-ml-2 w-fit gap-1.5 text-muted-foreground"
    >
      <ArrowLeft className="size-4" />
      {label}
    </Button>
  );
}
