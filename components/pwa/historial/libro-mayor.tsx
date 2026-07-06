"use client";

import { useMemo, useState } from "react";
import { BanIcon } from "lucide-react";
import { formatearHora, formatearMontoPartes } from "@/lib/formato";
import { SheetAnularMovimiento, type MovimientoParaAnular } from "@/components/pwa/historial/sheet-anular-movimiento";
import type { MovimientoLibroMayor } from "@/lib/consultas";

type Props = {
  movimientos: MovimientoLibroMayor[];
  montoApertura: number;
  montoContado: number;
};

function parteMonto(monto: number) {
  const { entero, decimales } = formatearMontoPartes(monto);
  return `${entero}.${decimales}`;
}

export function LibroMayor({ movimientos, montoApertura, montoContado }: Props) {
  const [seleccionado, setSeleccionado] = useState<MovimientoParaAnular | null>(null);

  const filas = useMemo(
    () =>
      movimientos.reduce<{ movimiento: MovimientoLibroMayor; saldo: number }[]>((filasHastaAhora, movimiento) => {
        const saldoAnterior = filasHastaAhora.at(-1)?.saldo ?? montoApertura;
        const saldo = movimiento.anulado ? saldoAnterior : saldoAnterior + (movimiento.tipo === "ingreso" ? movimiento.monto : -movimiento.monto);
        return [...filasHastaAhora, { movimiento, saldo }];
      }, []),
    [movimientos, montoApertura],
  );

  return (
    <div className="mx-6 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-md shadow-gray-200">
      <div className="grid grid-cols-[1fr_60px_60px_74px] gap-2 border-b border-gray-100 px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">
        <span>Movimiento</span>
        <span className="text-right">Debe</span>
        <span className="text-right">Haber</span>
        <span className="text-right">Saldo</span>
      </div>

      <div className="grid grid-cols-[1fr_60px_60px_74px] items-center gap-2 border-b border-gray-50 px-4 py-3 text-xs text-gray-400 italic">
        <span>Apertura</span>
        <span />
        <span />
        <span className="text-right font-mono font-semibold text-gray-600 not-italic">{parteMonto(montoApertura)}</span>
      </div>

      {filas.map(({ movimiento, saldo }) => {
        const nombre = movimiento.categoriaNombre ?? movimiento.descripcion ?? "Movimiento";

        return (
          <button
            key={movimiento.id}
            type="button"
            disabled={movimiento.anulado}
            onClick={() =>
              setSeleccionado({
                id: movimiento.id,
                transferenciaId: movimiento.transferenciaId,
                tipo: movimiento.tipo,
                monto: movimiento.monto,
                nombre,
              })
            }
            className="grid w-full grid-cols-[1fr_60px_60px_74px] items-start gap-2 border-b border-gray-50 px-4 py-3 text-left last:border-b-0 active:bg-gray-50 disabled:active:bg-transparent"
          >
            <div className="min-w-0">
              <p className={`truncate text-sm font-semibold ${movimiento.anulado ? "text-gray-400 line-through" : "text-gray-800"}`}>{nombre}</p>
              <p className="text-xs text-gray-400">{formatearHora(movimiento.fecha)}</p>
              {movimiento.anulado && (
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500">
                  <BanIcon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{movimiento.motivoAnulacion}</span>
                </p>
              )}
            </div>
            <span className="text-right font-mono text-xs font-bold text-emerald-600">
              {!movimiento.anulado && movimiento.tipo === "ingreso" ? parteMonto(movimiento.monto) : ""}
            </span>
            <span className="text-right font-mono text-xs font-bold text-red-600">
              {!movimiento.anulado && movimiento.tipo === "egreso" ? parteMonto(movimiento.monto) : ""}
            </span>
            <span className="text-right font-mono text-xs text-gray-400">{!movimiento.anulado ? parteMonto(saldo) : ""}</span>
          </button>
        );
      })}

      <div className="grid grid-cols-[1fr_60px_60px_74px] items-center gap-2 border-t-4 border-double border-gray-300 px-4 py-3">
        <span className="text-xs font-bold text-gray-500 uppercase">Cierre</span>
        <span />
        <span />
        <span className="text-right font-mono text-sm font-bold text-gray-800">{parteMonto(montoContado)}</span>
      </div>

      <SheetAnularMovimiento movimiento={seleccionado} onOpenChange={(abierto) => !abierto && setSeleccionado(null)} />
    </div>
  );
}
