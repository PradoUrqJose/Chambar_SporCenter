"use client";

import type { ReactNode } from "react";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";

type Props<Campo extends string> = {
  campo: Campo;
  ordenPor: Campo;
  ordenAsc: boolean;
  onOrdenar: (campo: Campo) => void;
  alinear?: "left" | "right";
  children: ReactNode;
};

export function ThOrdenable<Campo extends string>({ campo, ordenPor, ordenAsc, onOrdenar, alinear = "left", children }: Props<Campo>) {
  const activo = ordenPor === campo;

  return (
    <th className={`border-b border-border p-3 text-[13px] font-medium text-muted-foreground ${alinear === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => onOrdenar(campo)}
        className={`inline-flex items-center gap-1 transition hover:text-foreground ${activo ? "text-foreground" : ""} ${alinear === "right" ? "flex-row-reverse" : ""}`}
      >
        {children}
        {activo ? (
          ordenAsc ? (
            <ArrowUpIcon className="h-3 w-3" />
          ) : (
            <ArrowDownIcon className="h-3 w-3" />
          )
        ) : (
          <ChevronsUpDownIcon className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );
}
