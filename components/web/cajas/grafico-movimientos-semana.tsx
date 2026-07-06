"use client";

import { useState, useTransition } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { formatearFecha, formatearMontoPartes } from "@/lib/formato";
import { obtenerFlujoSemanalAccion } from "@/lib/acciones/dashboard";
import type { FlujoDia } from "@/lib/consultas";

type Props = {
  flujoInicial: FlujoDia[];
};

export function GraficoMovimientosSemana({ flujoInicial }: Props) {
  const [semana, setSemana] = useState(0);
  const [flujo, setFlujo] = useState(flujoInicial);
  const [isPending, startTransition] = useTransition();

  function cambiarSemana(delta: number) {
    const siguiente = semana + delta;
    if (siguiente < 0) return;

    startTransition(async () => {
      const datos = siguiente === 0 ? flujoInicial : await obtenerFlujoSemanalAccion(siguiente);
      setSemana(siguiente);
      setFlujo(datos);
    });
  }

  const totalesPorDia = flujo.map((dia) => dia.ingresos + dia.egresos);
  const maxTotal = Math.max(...totalesPorDia, 1);
  // Solo la semana actual (offset 0) tiene un "hoy" real; en semanas pasadas
  // el último día únicamente recibe el color destacado, sin el rótulo fijo.
  const ultimoIndex = flujo.length - 1;
  const penultimoIndex = flujo.length - 2;
  const esSemanaActual = semana === 0;

  const rangoLabel = esSemanaActual ? "Esta semana" : `${formatearFecha(flujo[0].fecha)} – ${formatearFecha(flujo[ultimoIndex].fecha)}`;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 rounded-[22px] bg-card p-[22px_22px_12px] shadow-[0_1px_0_rgba(0,0,0,0.02)] duration-500 ease-out transition-shadow hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)] motion-reduce:animate-none">
      <div className="mb-[18px] flex items-center justify-between gap-2">
        <h3 className="text-lg font-bold">Movimientos de la semana</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-[12.5px] font-semibold text-muted-foreground">{rangoLabel}</span>
          <button
            type="button"
            onClick={() => cambiarSemana(-1)}
            aria-label="Semana anterior"
            disabled={isPending}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-ring hover:text-foreground disabled:opacity-40"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => cambiarSemana(1)}
            aria-label="Semana siguiente"
            disabled={isPending || esSemanaActual}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-ring hover:text-foreground disabled:opacity-40"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        className={`flex h-[180px] items-end justify-between gap-[14px] pt-5 transition-opacity duration-200 ${
          isPending ? "opacity-40" : "opacity-100"
        }`}
      >
        {flujo.map((dia, indice) => {
          const total = totalesPorDia[indice];
          const monto = formatearMontoPartes(total);
          const alturaPct = Math.max(8, Math.round((total / maxTotal) * 100));
          const esDestacado = indice === ultimoIndex;
          const esAnterior = indice === penultimoIndex;
          const mostrarEtiquetaFija = esDestacado && esSemanaActual;

          return (
            <div key={dia.fecha} className="group flex h-full flex-1 flex-col items-center justify-end gap-2.5">
              <div
                className="relative w-full max-w-[72px] rounded-[40px] transition-[height] duration-500 ease-out"
                style={{
                  height: `${alturaPct}%`,
                  background: esDestacado ? "#176a41" : esAnterior ? "#57bd8a" : "repeating-linear-gradient(135deg, #dfe3e6 0 6px, #eef1f3 6px 12px)",
                }}
              >
                {mostrarEtiquetaFija ? (
                  <span className="absolute -top-[30px] left-1/2 -translate-x-1/2 rounded-lg border border-border bg-card px-2 py-[3px] text-[11px] font-bold whitespace-nowrap shadow-[0_4px_10px_rgba(0,0,0,0.08)]">
                    S/ {monto.entero}.{monto.decimales}
                  </span>
                ) : (
                  <span className="pointer-events-none absolute -top-[30px] left-1/2 -translate-x-1/2 scale-90 rounded-lg border border-border bg-card px-2 py-[3px] text-[11px] font-bold whitespace-nowrap opacity-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] transition-all duration-150 group-hover:scale-100 group-hover:opacity-100">
                    S/ {monto.entero}.{monto.decimales}
                  </span>
                )}
              </div>
              <span className="text-[13px] font-semibold text-muted-foreground">{dia.dia}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
