"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

type Props = {
  mostrarVolver: boolean;
  haySesionActual: boolean;
  vistaSesion: ReactNode;
  vistaSemana: ReactNode;
};

// Único pedazo interactivo de la página de caja: qué vista mostrar. El resto
// (las cards, la tabla) se renderiza en el servidor y llega ya armado acá
// como children — así no viaja como JS al navegador.
export function SelectorVistaCaja({ mostrarVolver, haySesionActual, vistaSesion, vistaSemana }: Props) {
  const [vista, setVista] = useState<"sesion" | "semana">(haySesionActual ? "sesion" : "semana");

  return (
    <>
      <div className="mb-[18px] flex items-center justify-between gap-3">
        {mostrarVolver ? (
          <Link href="/panel/cajas" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon className="h-4 w-4" />
            Cajas
          </Link>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1 rounded-full bg-muted p-1">
          <button
            type="button"
            onClick={() => setVista("sesion")}
            disabled={!haySesionActual}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              vista === "sesion" ? "bg-card shadow-sm" : "text-muted-foreground"
            }`}
          >
            Sesión actual
          </button>
          <button
            type="button"
            onClick={() => setVista("semana")}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${vista === "semana" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
          >
            Semana
          </button>
        </div>
      </div>

      {vista === "sesion" ? vistaSesion : vistaSemana}
    </>
  );
}
