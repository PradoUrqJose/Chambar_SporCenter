"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { formatearFecha, formatearHora, formatearMontoPartes, obtenerIniciales } from "@/lib/formato";
import { oscurecerColor, colorConAlpha } from "@/lib/color";
import { obtenerEstadoArqueo } from "@/lib/arqueo";
import { obtenerIcono } from "@/lib/iconos";
import { BuscadorHistorial } from "@/components/pwa/historial/buscador-historial";
import { useNavegarConTransicion } from "@/components/pwa/view-transitions";
import type { CajaFiltro, ResultadoBusquedaMovimiento, SesionHistorial } from "@/lib/consultas";

type Props = {
  cajas: CajaFiltro[];
  sesiones: SesionHistorial[];
  cajaSeleccionadaId: string | null;
  resultadosBusqueda: ResultadoBusquedaMovimiento[] | null;
};

const COLOR_POR_DEFECTO = "#006d36";

export function HistorialAdminOrganizacion({ cajas, sesiones, cajaSeleccionadaId, resultadosBusqueda }: Props) {
  const navegar = useNavegarConTransicion();

  return (
    <div className="flex flex-col">
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Historial</h1>
        <p className="text-base font-medium text-gray-400">Sesiones de caja cerradas</p>
      </header>

      <div className="px-6">
        <Suspense fallback={<div className="mb-2 h-[46px] rounded-2xl bg-gray-50" />}>
          <BuscadorHistorial />
        </Suspense>
      </div>

      {resultadosBusqueda ? (
        <section className="flex flex-col gap-3 px-6 pb-8">
          {resultadosBusqueda.length === 0 && <p className="text-sm text-gray-400">No hay movimientos con esa descripción.</p>}

          {resultadosBusqueda.map((resultado) => {
            const Icono = obtenerIcono(resultado.categoriaIcono);
            const colorCategoria = resultado.categoriaColor ?? "#9ca3af";
            const nombre = resultado.categoriaNombre ?? resultado.descripcion ?? "Movimiento";
            const monto = formatearMontoPartes(resultado.monto);

            return (
              <Link
                key={resultado.id}
                href={`/historial/${resultado.sesionId}`}
                className="flex items-center gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-md shadow-gray-200 transition-transform active:scale-[0.97]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: colorConAlpha(colorCategoria, 0.12), color: colorCategoria }}>
                  <Icono className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-800">{nombre}</p>
                  <p className="truncate text-xs text-gray-400">
                    {resultado.cajaNombre} · {formatearFecha(resultado.fecha)} {formatearHora(resultado.fecha)}
                  </p>
                </div>

                <span className={`shrink-0 font-mono text-sm font-bold ${resultado.tipo === "ingreso" ? "text-emerald-600" : "text-red-600"}`}>
                  {resultado.tipo === "egreso" ? "−" : "+"} S/ {monto.entero}.{monto.decimales}
                </span>

                <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-300" />
              </Link>
            );
          })}
        </section>
      ) : (
        <>
          <div className="mb-2 flex gap-2 overflow-x-auto px-6 pb-2">
            <Link
              href="/historial"
              className="shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold shadow-sm"
              style={
                !cajaSeleccionadaId
                  ? { backgroundColor: "#eef9ec", borderColor: "#eef9ec", color: "#15803d" }
                  : { borderColor: "#e5e7eb", color: "#4b5563", backgroundColor: "#fff" }
              }
            >
              Todas
            </Link>

            {cajas.map((caja) => {
              const color = caja.color ?? COLOR_POR_DEFECTO;
              const activo = caja.id === cajaSeleccionadaId;

              return (
                <Link
                  key={caja.id}
                  href={`/historial?caja=${caja.id}`}
                  className="shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold shadow-sm"
                  style={
                    activo
                      ? { backgroundColor: colorConAlpha(color, 0.12), borderColor: colorConAlpha(color, 0.12), color }
                      : { borderColor: "#e5e7eb", color: "#4b5563", backgroundColor: "#fff" }
                  }
                >
                  {caja.nombre}
                </Link>
              );
            })}
          </div>

          <section className="flex flex-col gap-3 px-6 pb-8">
            {sesiones.length === 0 && <p className="text-sm text-gray-400">Todavía no hay sesiones cerradas.</p>}

            {sesiones.map((sesion) => {
              const color = sesion.cajaColor ?? COLOR_POR_DEFECTO;
              const estado = obtenerEstadoArqueo(sesion.diferencia);
              const monto = formatearMontoPartes(sesion.montoContado);

              return (
                <button
                  key={sesion.id}
                  type="button"
                  onClick={() => navegar(`/historial/${sesion.id}`)}
                  className="flex w-full items-center gap-3 rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-md shadow-gray-200 transition-transform active:scale-[0.97]"
                >
                  <div
                    style={{
                      viewTransitionName: `sesion-banner-${sesion.id}`,
                      background: `linear-gradient(135deg, ${color}, ${oscurecerColor(color, 0.55)})`,
                    }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-bold text-white"
                  >
                    {obtenerIniciales(sesion.cajaNombre)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-800">{sesion.cajaNombre}</p>
                    <p className="text-xs text-gray-400">
                      {formatearFecha(sesion.aperturaAt)} → {formatearFecha(sesion.cierreAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{ backgroundColor: colorConAlpha(estado.color, 0.12), color: estado.color }}
                    >
                      {estado.label}
                    </span>
                    <span className="font-mono text-sm font-bold text-gray-800">
                      S/ {monto.entero}.{monto.decimales}
                    </span>
                  </div>

                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-300" />
                </button>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}
