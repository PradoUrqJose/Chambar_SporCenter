"use client";

import { useMemo, useState } from "react";
import { PaperclipIcon, WalletIcon } from "lucide-react";
import { formatearMontoPartes, formatearHora, formatearFecha } from "@/lib/formato";
import { colorConAlpha } from "@/lib/color";
import { obtenerIcono } from "@/lib/iconos";
import { ThOrdenable } from "@/components/web/tabla/th-ordenable";
import { Paginacion } from "@/components/web/tabla/paginacion";
import { CabeceraCard } from "@/components/web/cajas/tabla-movimientos-semana";
import type { MovimientoLibroMayor, SesionDetalle } from "@/lib/consultas";

const INGRESO = "#1f7a4d";
const EGRESO = "#dc2626";
const NEUTRO = "#6b7280";
const CATEGORIA_POR_DEFECTO = "#9ca3af";
const POR_PAGINA = 4;

type CampoOrdenSesion = "movimiento" | "responsable" | "fecha" | "monto" | "tipo";

type FilaSesion = { kind: "apertura" } | { kind: "movimiento"; mov: MovimientoLibroMayor };

function valorOrdenSesion(fila: FilaSesion, campo: CampoOrdenSesion, sesion: SesionDetalle): string | number {
  if (fila.kind === "apertura") {
    switch (campo) {
      case "movimiento":
        return "apertura de caja";
      case "responsable":
        return (sesion.abiertaPor ?? "").toLowerCase();
      case "fecha":
        return new Date(sesion.aperturaAt).getTime();
      case "monto":
        return sesion.montoApertura;
      case "tipo":
        return "apertura";
    }
  }

  const mov = fila.mov;
  switch (campo) {
    case "movimiento":
      return (mov.categoriaNombre ?? mov.descripcion ?? "Movimiento").toLowerCase();
    case "responsable":
      return (mov.creadoPor ?? "").toLowerCase();
    case "fecha":
      return new Date(mov.fecha).getTime();
    case "monto":
      return mov.monto;
    case "tipo":
      return mov.tipo;
  }
}

function EncabezadoSesion({
  ordenPor,
  ordenAsc,
  onOrdenar,
}: {
  ordenPor: CampoOrdenSesion;
  ordenAsc: boolean;
  onOrdenar: (campo: CampoOrdenSesion) => void;
}) {
  return (
    <thead>
      <tr>
        <ThOrdenable campo="movimiento" ordenPor={ordenPor} ordenAsc={ordenAsc} onOrdenar={onOrdenar}>
          Movimiento
        </ThOrdenable>
        <th className="border-b border-border p-2 text-left text-[13px] font-medium text-muted-foreground">Descripción</th>
        <ThOrdenable campo="responsable" ordenPor={ordenPor} ordenAsc={ordenAsc} onOrdenar={onOrdenar}>
          Responsable
        </ThOrdenable>
        <ThOrdenable campo="fecha" ordenPor={ordenPor} ordenAsc={ordenAsc} onOrdenar={onOrdenar}>
          Fecha
        </ThOrdenable>
        <th className="border-b border-border p-2 text-center text-[13px] font-medium text-muted-foreground" aria-label="Comprobante">
          <PaperclipIcon className="mx-auto h-3.5 w-3.5" />
        </th>
        <ThOrdenable campo="monto" ordenPor={ordenPor} ordenAsc={ordenAsc} onOrdenar={onOrdenar} alinear="right">
          Monto
        </ThOrdenable>
        <ThOrdenable campo="tipo" ordenPor={ordenPor} ordenAsc={ordenAsc} onOrdenar={onOrdenar} alinear="right">
          Tipo
        </ThOrdenable>
      </tr>
    </thead>
  );
}

export function CardMovimientosSesion({
  sesion,
  saldoActual,
  urlsComprobantes,
}: {
  sesion: SesionDetalle;
  saldoActual: number;
  urlsComprobantes: Map<string, string>;
}) {
  const [ordenPor, setOrdenPor] = useState<CampoOrdenSesion>("fecha");
  const [ordenAsc, setOrdenAsc] = useState(true);
  const [pagina, setPagina] = useState(1);

  const montoApertura = formatearMontoPartes(sesion.montoApertura);
  const montoSaldoActual = formatearMontoPartes(saldoActual);

  function ordenar(campo: CampoOrdenSesion) {
    if (campo === ordenPor) setOrdenAsc((actual) => !actual);
    else {
      setOrdenPor(campo);
      setOrdenAsc(true);
    }
    setPagina(1);
  }

  const filasOrdenadas = useMemo(() => {
    const filas: FilaSesion[] = [{ kind: "apertura" }, ...sesion.movimientos.map((mov) => ({ kind: "movimiento" as const, mov }))];
    const signo = ordenAsc ? 1 : -1;
    return filas.sort((a, b) => {
      const va = valorOrdenSesion(a, ordenPor, sesion);
      const vb = valorOrdenSesion(b, ordenPor, sesion);
      if (va < vb) return -1 * signo;
      if (va > vb) return 1 * signo;
      return 0;
    });
  }, [sesion, ordenPor, ordenAsc]);

  const totalPaginas = Math.max(1, Math.ceil(filasOrdenadas.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const inicio = (paginaSegura - 1) * POR_PAGINA;
  const filasPagina = filasOrdenadas.slice(inicio, inicio + POR_PAGINA);

  return (
    <div className="flex h-full flex-col rounded-[20px] bg-card p-[6px_22px_10px] shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <CabeceraCard titulo="Movimientos de la sesión" />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <EncabezadoSesion ordenPor={ordenPor} ordenAsc={ordenAsc} onOrdenar={ordenar} />
          <tbody>
            {filasPagina.map((fila) => {
              if (fila.kind === "apertura") {
                return (
                  <tr key="apertura">
                    <td className="border-b border-border p-2 text-[13px] min-[1513px]:text-[15px]">
                      <div className="flex items-center gap-3 font-medium">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: colorConAlpha(NEUTRO, 0.12), color: NEUTRO }}>
                          <WalletIcon className="h-4 w-4" />
                        </span>
                        <span className="truncate">Apertura de caja</span>
                      </div>
                    </td>
                    <td className="border-b border-border p-2 text-[13px] text-muted-foreground min-[1513px]:text-[15px]">—</td>
                    <td className="border-b border-border p-2 text-[13px] text-muted-foreground min-[1513px]:text-[15px]">{sesion.abiertaPor ?? "—"}</td>
                    <td className="border-b border-border p-2 text-[13px] whitespace-nowrap text-muted-foreground min-[1513px]:text-[15px]">
                      <span className="block">{formatearFecha(sesion.aperturaAt)}</span>
                      <span className="block text-[11px] min-[1513px]:text-[13px]">{formatearHora(sesion.aperturaAt)}</span>
                    </td>
                    <td className="border-b border-border p-2 text-center text-[13px] text-muted-foreground min-[1513px]:text-[15px]">—</td>
                    <td className="border-b border-border p-2 text-right font-mono text-[13px] font-bold whitespace-nowrap min-[1513px]:text-[15px]">
                      S/ {montoApertura.entero}.{montoApertura.decimales}
                    </td>
                    <td className="border-b border-border p-2 text-right">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium whitespace-nowrap min-[1513px]:text-[14px]" style={{ color: NEUTRO }}>
                        <span className="h-2 w-2 rounded-full" style={{ background: NEUTRO }} />
                        Apertura
                      </span>
                    </td>
                  </tr>
                );
              }

              const mov = fila.mov;
              const Icono = obtenerIcono(mov.categoriaIcono);
              const colorCategoria = mov.categoriaColor ?? CATEGORIA_POR_DEFECTO;
              const nombre = mov.categoriaNombre ?? mov.descripcion ?? "Movimiento";
              const monto = formatearMontoPartes(mov.monto);
              const esIngreso = mov.tipo === "ingreso";
              const urlComprobante = mov.comprobanteUrl ? urlsComprobantes.get(mov.comprobanteUrl) : undefined;

              return (
                <tr key={mov.id}>
                  <td className="border-b border-border p-2 text-[13px] min-[1513px]:text-[15px]">
                    <div className="flex items-center gap-3 font-medium">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: colorConAlpha(colorCategoria, 0.12), color: colorCategoria }}
                      >
                        <Icono className="h-4 w-4" />
                      </span>
                      <span className={`truncate ${mov.anulado ? "text-muted-foreground line-through" : ""}`}>{nombre}</span>
                    </div>
                  </td>
                  <td className="border-b border-border p-2 text-[13px] text-muted-foreground min-[1513px]:text-[15px]">
                    {mov.anulado ? (
                      <span className="block max-w-[220px] truncate text-[#E7000B]">Anulado{mov.motivoAnulacion ? `: ${mov.motivoAnulacion}` : ""}</span>
                    ) : (
                      <span className="block max-w-[220px] truncate">{mov.descripcion ?? "—"}</span>
                    )}
                  </td>
                  <td className="border-b border-border p-2 text-[13px] text-muted-foreground min-[1513px]:text-[15px]">
                    <span className="block max-w-[140px] truncate">{mov.creadoPor ?? "—"}</span>
                  </td>
                  <td className="border-b border-border p-2 text-[13px] whitespace-nowrap text-muted-foreground min-[1513px]:text-[15px]">
                    <span className="block">{formatearFecha(mov.fecha)}</span>
                    <span className="block text-[11px] min-[1513px]:text-[13px]">{formatearHora(mov.fecha)}</span>
                  </td>
                  <td className="border-b border-border p-2 text-center">
                    {urlComprobante && !mov.anulado ? (
                      <a href={urlComprobante} target="_blank" rel="noopener noreferrer" aria-label="Ver comprobante" className="inline-flex items-center justify-center text-primary hover:underline">
                        <PaperclipIcon className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-[13px] text-muted-foreground min-[1513px]:text-[15px]">—</span>
                    )}
                  </td>
                  <td className="border-b border-border p-2 text-right font-mono text-[13px] font-bold whitespace-nowrap min-[1513px]:text-[15px]">
                    {mov.anulado ? "—" : `${esIngreso ? "+" : "−"} S/ ${monto.entero}.${monto.decimales}`}
                  </td>
                  <td className="border-b border-border p-2 text-right">
                    {mov.anulado ? (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium whitespace-nowrap text-[#E7000B] min-[1513px]:text-[14px]">
                        <span className="h-2 w-2 rounded-full bg-[#E7000B]" />
                        Anulado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium whitespace-nowrap min-[1513px]:text-[14px]" style={{ color: esIngreso ? INGRESO : EGRESO }}>
                        <span className="h-2 w-2 rounded-full" style={{ background: esIngreso ? INGRESO : EGRESO }} />
                        {esIngreso ? "Ingreso" : "Egreso"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            <tr>
              <td colSpan={5} className="border-t-4 border-double border-border p-2 text-[13px] font-bold uppercase text-muted-foreground min-[1513px]:text-[15px]">
                Saldo actual
              </td>
              <td colSpan={2} className="border-t-4 border-double border-border p-2 text-right font-mono text-[14px] font-bold min-[1513px]:text-base">
                S/ {montoSaldoActual.entero}.{montoSaldoActual.decimales}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Paginacion paginaActual={paginaSegura} totalPaginas={totalPaginas} onCambiarPagina={setPagina} />
    </div>
  );
}
