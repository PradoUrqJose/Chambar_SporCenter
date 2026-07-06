"use client";

import type { ReactNode } from "react";
import { SearchIcon } from "lucide-react";

type Props = {
  titulo: string;
  contador: string;
  buscar: string;
  onBuscarChange: (valor: string) => void;
  placeholderBuscar: string;
  children?: ReactNode;
};

export function EncabezadoAdmin({ titulo, contador, buscar, onBuscarChange, placeholderBuscar, children }: Props) {
  return (
    <div className="mb-[22px] flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[32px] font-extrabold">{titulo}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{contador}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={buscar}
            onChange={(evento) => onBuscarChange(evento.target.value)}
            placeholder={placeholderBuscar}
            className="w-[240px] rounded-full border border-border bg-card py-2 pr-3.5 pl-9 text-sm focus:border-ring focus:outline-none"
          />
        </div>
        {children}
      </div>
    </div>
  );
}
