"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BanIcon, PaperclipIcon, XIcon } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { formatearFecha, formatearHora, formatearMontoPartes, obtenerIniciales } from "@/lib/formato";
import { colorConAlpha, oscurecerColor } from "@/lib/color";
import { obtenerEstadoArqueo } from "@/lib/arqueo";
import { obtenerIcono } from "@/lib/iconos";
import type { SesionDetalle } from "@/lib/consultas";

type Props = {
  sesion: SesionDetalle | null;
  urlsComprobantes: Map<string, string>;
};

const COLOR_POR_DEFECTO = "#1f7a4d";
const INGRESO = "#1f7a4d";
const EGRESO = "#dc2626";
const CATEGORIA_POR_DEFECTO = "#9ca3af";

function parteMonto(monto: number) {
  const { entero, decimales } = formatearMontoPartes(monto);
  return `${entero}.${decimales}`;
}

export function SheetDetalleSesion({ sesion, urlsComprobantes }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filas = useMemo(() => {
    if (!sesion) return [];
    let saldo = sesion.montoApertura;

    return sesion.movimientos.map((movimiento) => {
      if (!movimiento.anulado) saldo += movimiento.tipo === "ingreso" ? movimiento.monto : -movimiento.monto;
      return { movimiento, saldo };
    });
  }, [sesion]);

  function cerrar() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("sesion");
    const query = params.toString();
    router.push(query ? `/panel/historial?${query}` : "/panel/historial");
  }

  const color = sesion?.cajaColor ?? COLOR_POR_DEFECTO;
  const estado = sesion ? obtenerEstadoArqueo(sesion.diferencia ?? 0) : null;

  return (
    <Sheet open={sesion !== null} onOpenChange={(abierto) => !abierto && cerrar()}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[800px]" showCloseButton={false}>
        {sesion && (
          <>
            <div
              className="relative overflow-hidden p-7 text-white"
              style={{
                background: `radial-gradient(130% 160% at 15% -20%, rgba(255,255,255,0.22), transparent 55%), linear-gradient(135deg, ${color} 0%, ${oscurecerColor(color, 0.7)} 100%)`,
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.12]"
                style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "14px 14px" }}
              />

              <SheetClose className="absolute top-6 right-6 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25">
                <XIcon className="h-4 w-4" />
                <span className="sr-only">Cerrar</span>
              </SheetClose>

              <div className="relative z-10">
                <div className="mb-5 flex items-start gap-3.5 pr-12">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-base font-bold backdrop-blur-sm">
                    {obtenerIniciales(sesion.cajaNombre)}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <SheetTitle className="truncate text-xl text-white">{sesion.cajaNombre}</SheetTitle>
                    <p className="text-[13px] text-white/70">
                      {formatearFecha(sesion.aperturaAt)} {formatearHora(sesion.aperturaAt)}
                      {sesion.cierreAt ? ` → ${formatearFecha(sesion.cierreAt)} ${formatearHora(sesion.cierreAt)}` : ""}
                    </p>
                  </div>
                  {estado && (
                    <div className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-center shadow-sm" style={{ color: estado.color, transform: "rotate(-4deg)" }}>
                      <p className="text-[11px] font-black tracking-wide uppercase">{estado.label}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 border-t border-white/15 pt-4">
                  {[
                    { label: "Apertura", valor: sesion.montoApertura },
                    { label: "Esperado", valor: sesion.montoEsperado ?? 0 },
                    { label: "Contado", valor: sesion.montoContado ?? 0 },
                  ].map(({ label, valor }) => (
                    <div key={label}>
                      <p className="text-[11px] font-medium text-white/60 uppercase">{label}</p>
                      <p className="font-mono text-base font-bold">{parteMonto(valor)}</p>
                    </div>
                  ))}
                </div>

                {(sesion.abiertaPor || sesion.cerradaPor) && (
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-white/15 pt-3 text-[13px] text-white/70">
                    {sesion.abiertaPor && (
                      <span>
                        Abierta por <b className="font-semibold text-white">{sesion.abiertaPor}</b>
                      </span>
                    )}
                    {sesion.cerradaPor && (
                      <span>
                        Cerrada por <b className="font-semibold text-white">{sesion.cerradaPor}</b>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-5 p-6">
              {(sesion.observacionesApertura || sesion.observacionesCierre) && (
                <div className="flex flex-col gap-2.5">
                  {sesion.observacionesApertura && (
                    <p className="rounded-2xl bg-muted p-4 text-[14px] leading-snug text-muted-foreground">
                      <span className="font-semibold text-foreground">Apertura: </span>
                      {sesion.observacionesApertura}
                    </p>
                  )}
                  {sesion.observacionesCierre && (
                    <p className="rounded-2xl bg-muted p-4 text-[14px] leading-snug text-muted-foreground">
                      <span className="font-semibold text-foreground">Cierre: </span>
                      {sesion.observacionesCierre}
                    </p>
                  )}
                </div>
              )}

              <div>
                <h3 className="mb-3 text-[15px] font-bold">Movimientos</h3>

                <div className="overflow-hidden rounded-2xl border border-border shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between border-b border-border bg-muted/60 px-5 py-3 text-[13px] text-muted-foreground italic">
                    <span>Apertura</span>
                    <span className="font-mono font-semibold not-italic">{parteMonto(sesion.montoApertura)}</span>
                  </div>

                  {filas.map(({ movimiento, saldo }) => {
                    const nombre = movimiento.categoriaNombre ?? movimiento.descripcion ?? "Movimiento";
                    const colorCategoria = movimiento.categoriaColor ?? CATEGORIA_POR_DEFECTO;
                    const Icono = obtenerIcono(movimiento.categoriaIcono);
                    const url = movimiento.comprobanteUrl ? urlsComprobantes.get(movimiento.comprobanteUrl) : undefined;
                    const esIngreso = movimiento.tipo === "ingreso";

                    return (
                      <div key={movimiento.id} className="flex items-center gap-3.5 border-b border-border/70 px-5 py-4 last:border-b-0">
                        <span
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: colorConAlpha(colorCategoria, 0.12), color: colorCategoria }}
                        >
                          <Icono className="h-[19px] w-[19px]" />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-[14px] font-semibold ${movimiento.anulado ? "text-muted-foreground line-through" : ""}`}>{nombre}</p>
                          <p className="text-[12px] text-muted-foreground">{formatearHora(movimiento.fecha)}</p>
                          {movimiento.anulado && (
                            <p className="mt-1 flex items-center gap-1 text-[12px] font-medium text-[#E7000B]">
                              <BanIcon className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                {movimiento.motivoAnulacion}
                                {movimiento.anuladoPor ? ` · ${movimiento.anuladoPor}` : ""}
                              </span>
                            </p>
                          )}
                          {url && !movimiento.anulado && (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
                            >
                              <PaperclipIcon className="h-3 w-3" />
                              Comprobante
                            </a>
                          )}
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="font-mono text-[14px] font-bold" style={{ color: esIngreso ? INGRESO : EGRESO }}>
                            {!movimiento.anulado ? `${esIngreso ? "+" : "−"} ${parteMonto(movimiento.monto)}` : "—"}
                          </p>
                          {!movimiento.anulado && <p className="font-mono text-[11px] text-muted-foreground">{parteMonto(saldo)}</p>}
                        </div>
                      </div>
                    );
                  })}

                  {filas.length === 0 && <p className="px-5 py-6 text-center text-[13px] text-muted-foreground">Sin movimientos en esta sesión.</p>}

                  <div className="flex items-center justify-between border-t-4 border-double border-border px-5 py-3.5">
                    <span className="text-[12px] font-bold text-muted-foreground uppercase">Cierre</span>
                    <span className="font-mono text-[15px] font-bold">{parteMonto(sesion.montoContado ?? sesion.montoApertura)}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
