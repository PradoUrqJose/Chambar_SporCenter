"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

type Props = {
  paginaActual: number;
  totalPaginas: number;
  onCambiarPagina: (pagina: number) => void;
};

export function Paginacion({ paginaActual, totalPaginas, onCambiarPagina }: Props) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 py-3 text-[13px] text-muted-foreground min-[1513px]:text-[15px]">
      <span>
        Página {paginaActual} de {totalPaginas}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={paginaActual === 1}
          onClick={() => onCambiarPagina(paginaActual - 1)}
          aria-label="Página anterior"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border transition hover:border-ring disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={paginaActual === totalPaginas}
          onClick={() => onCambiarPagina(paginaActual + 1)}
          aria-label="Página siguiente"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border transition hover:border-ring disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
