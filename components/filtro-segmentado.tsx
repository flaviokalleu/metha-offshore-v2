"use client";

import { cn } from "@/lib/utils";

export function FiltroSegmentado({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex w-fit max-w-full items-stretch overflow-x-auto rounded-md border border-input bg-card p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "font-display shrink-0 rounded-[4px] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
            value === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
