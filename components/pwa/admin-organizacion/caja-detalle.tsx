"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, HistoryIcon, SearchIcon } from "lucide-react";
import { formatearMontoPartes, formatearHora, formatearFecha, fechaLimaISO } from "@/lib/formato";
import { oscurecerColor, colorConAlpha } from "@/lib/color";
import { obtenerIcono } from "@/lib/iconos";
import { obtenerEstadoArqueo } from "@/lib/arqueo";
import { SheetRegistrarMovimiento } from "@/components/pwa/sheet-registrar-movimiento";
import { SheetAbrirCerrarCaja } from "@/components/pwa/sheet-abrir-cerrar-caja";
import { SheetDetalleMovimiento, type PrefillMovimiento } from "@/components/pwa/sheet-detalle-movimiento";
import type { CajaEmpresaDetalle, FlujoDia, MovimientoReciente, SesionDia, CategoriaOpcion } from "@/lib/consultas";

type Props = {
  caja: CajaEmpresaDetalle;
  flujoSemanal: FlujoDia[];
  movimientos: MovimientoReciente[];
  sesionesSemana: SesionDia[];
  categoriasIngreso: CategoriaOpcion[];
  categoriasEgreso: CategoriaOpcion[];
  // Si viene, el header muestra "Hola, {nombre}" + buscar en vez del botón
  // volver (vista de admin_empresa, que no tiene una lista de cajas a la que volver).
  nombreUsuario?: string;
};

const COLOR_POR_DEFECTO = "#006d36";

export function CajaDetalleAdminOrganizacion({ caja, flujoSemanal, movimientos, sesionesSemana, categoriasIngreso, categoriasEgreso, nombreUsuario }: Props) {
  const color = caja.color ?? COLOR_POR_DEFECTO;
  const maxActividad = Math.max(...flujoSemanal.map((dia) => dia.ingresos + dia.egresos), 0);

  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState<MovimientoReciente | null>(null);
  const [prefillMovimiento, setPrefillMovimiento] = useState<PrefillMovimiento | null>(null);

  const fechaHoy = flujoSemanal[flujoSemanal.length - 1]?.fecha ?? "";
  const [diaSeleccionado, setDiaSeleccionado] = useState(fechaHoy);
  const esHoySeleccionado = fechaLimaISO(diaSeleccionado) === fechaLimaISO(fechaHoy);
  const movimientosDelDia = movimientos.filter((movimiento) => fechaLimaISO(movimiento.fecha) === fechaLimaISO(diaSeleccionado));

  // Cada barra representa "su" sesión, no un saldo en vivo genérico: si esa
  // sesión ya cerró, el monto queda congelado (monto_contado) para siempre,
  // igual que en Historial — solo la sesión todavía abierta usa el saldo vivo.
  const sesionDelDia = sesionesSemana.find((sesion) => fechaLimaISO(sesion.aperturaAt) === fechaLimaISO(diaSeleccionado));
  const estadoDia: "abierta" | "cerrada" | "sin-sesion" = !sesionDelDia ? "sin-sesion" : sesionDelDia.cierreAt === null ? "abierta" : "cerrada";
  const montoMostrado = formatearMontoPartes(estadoDia === "abierta" ? caja.saldo : estadoDia === "cerrada" ? (sesionDelDia!.montoContado ?? 0) : 0);
  const selloDia = estadoDia === "cerrada" && sesionDelDia?.diferencia != null ? obtenerEstadoArqueo(sesionDelDia.diferencia) : null;

  return (
    <div className="flex flex-col">
      {nombreUsuario ? (
        <header className="flex items-start justify-between px-6 pt-12 mb-8">
          <div>
            <h1 className="text-3xl leading-tight font-bold text-gray-800">Hola,</h1>
            <h1 className="text-3xl leading-tight font-bold text-gray-800">{nombreUsuario}</h1>
          </div>
          <Link href="/historial?buscar=1" aria-label="Buscar movimientos" className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm">
            <SearchIcon className="h-5 w-5 text-gray-600" />
          </Link>
        </header>
      ) : (
        <header className="flex items-center px-6 pt-8 pb-2">
          <Link href="/cajas" aria-label="Volver a Cajas" className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm">
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
        </header>
      )}

      <section className="relative px-6 pt-2 pb-4">
        <div
          className="relative flex aspect-[1.58/1] w-full flex-col justify-between overflow-hidden rounded-[28px] p-6 text-white shadow-xl"
          style={{ background: `linear-gradient(135deg, ${color}, ${oscurecerColor(color, 0.3)}, ${oscurecerColor(color, 0.65)})` }}
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] opacity-10" />
          <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />

          <span className="absolute top-6 right-6 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase">
            {estadoDia === "abierta" ? "Abierta" : estadoDia === "cerrada" ? "Cerrada" : "Sin sesión"}
          </span>

          <div className="relative z-10">
            <p className="mb-1 text-sm font-medium text-white/60">{caja.nombre}</p>
            <h2 className="mb-1 text-3xl font-bold">
              S/ {montoMostrado.entero}.{montoMostrado.decimales}
            </h2>
            <div className="mb-4 flex items-center gap-2">
              <p className="text-xs font-medium text-white/50">
                {estadoDia === "abierta" ? "Saldo actual" : estadoDia === "cerrada" ? `Cerrada el ${formatearFecha(diaSeleccionado)}` : `Sin sesión el ${formatearFecha(diaSeleccionado)}`}
              </p>
              {selloDia && selloDia.label !== "Cuadrada" && (
                <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-black uppercase" style={{ color: selloDia.color }}>
                  {selloDia.label}
                </span>
              )}
            </div>
          </div>

          <div className="relative z-10 mb-2 flex h-24 items-end justify-between gap-1">
            {flujoSemanal.map((dia, indice) => {
              const actividad = dia.ingresos + dia.egresos;
              const alturaPorcentaje = maxActividad > 0 ? Math.max((actividad / maxActividad) * 100, 10) : 10;
              const seleccionado = fechaLimaISO(dia.fecha) === fechaLimaISO(diaSeleccionado);

              return (
                <button
                  key={`${dia.dia}-${indice}`}
                  type="button"
                  onClick={() => setDiaSeleccionado(dia.fecha)}
                  aria-label={`Ver movimientos del ${formatearFecha(dia.fecha)}`}
                  className="flex flex-1 flex-col items-center"
                >
                  <div className="mb-2 flex h-14 w-8 items-end">
                    <div className={`w-full rounded-full ${seleccionado ? "bg-emerald-500" : "bg-white/10"}`} style={{ height: `${alturaPorcentaje}%` }} />
                  </div>
                  <span className={`text-[10px] ${seleccionado ? "font-medium text-white" : "text-white/40"}`}>{dia.dia}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-4 gap-2 px-3 py-4">
        <div className="flex flex-col items-center">
          <Link
            href={`/historial?caja=${caja.cajaId}`}
            aria-label="Historial"
            className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-500 shadow-md shadow-gray-200 transition-transform active:scale-[0.94]"
          >
            <HistoryIcon className="h-6 w-6" />
          </Link>
          <span className="text-center text-[10px] leading-tight font-bold text-gray-500">Historial</span>
        </div>

        <SheetAbrirCerrarCaja cajaId={caja.cajaId} sesionAbiertaId={caja.sesionAbiertaId} abierta={caja.abierta} montoReferencia={caja.saldo} color={color} />

        <SheetRegistrarMovimiento cajaId={caja.cajaId} categoriasIngreso={categoriasIngreso} categoriasEgreso={categoriasEgreso} deshabilitado={!caja.abierta} prefill={prefillMovimiento} />
      </section>

      <section className="flex flex-col gap-6 px-8 pb-8">
        <h3 className="text-sm font-medium text-gray-400">{esHoySeleccionado ? "Movimientos de hoy" : `Movimientos del ${formatearFecha(diaSeleccionado)}`}</h3>

        {movimientosDelDia.length === 0 && <p className="text-sm text-gray-400">No hay movimientos ese día.</p>}

        {movimientosDelDia.map((movimiento) => {
          const colorCategoria = movimiento.categoriaColor ?? "#9ca3af";
          const Icono = obtenerIcono(movimiento.categoriaIcono);
          const nombre = movimiento.categoriaNombre ?? movimiento.descripcion ?? "Movimiento";
          const signo = movimiento.tipo === "egreso" ? "−" : "+";
          const monto = formatearMontoPartes(movimiento.monto);

          return (
            <button key={movimiento.id} type="button" onClick={() => setMovimientoSeleccionado(movimiento)} className="flex w-full items-center justify-between text-left active:opacity-70">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: colorConAlpha(colorCategoria, 0.12), color: colorCategoria }}>
                  <Icono className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{nombre}</h4>
                  <p className="text-xs text-gray-400">{formatearHora(movimiento.fecha)}</p>
                </div>
              </div>
              <p className="font-mono font-bold text-gray-800">
                {signo} S/ {monto.entero}.{monto.decimales}
              </p>
            </button>
          );
        })}
      </section>

      <SheetDetalleMovimiento
        movimiento={movimientoSeleccionado}
        cajaId={caja.cajaId}
        onOpenChange={(abierto) => !abierto && setMovimientoSeleccionado(null)}
        onAnuladoParaRecrear={setPrefillMovimiento}
      />
    </div>
  );
}
