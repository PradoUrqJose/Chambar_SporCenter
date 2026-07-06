import Link from "next/link";
import { DownloadIcon, PaperclipIcon } from "lucide-react";
import { formatearMontoPartes, formatearHora, formatearFecha } from "@/lib/formato";
import { colorConAlpha } from "@/lib/color";
import { obtenerIcono } from "@/lib/iconos";
import type { MovimientoReciente } from "@/lib/consultas";

const INGRESO = "#1f7a4d";
const EGRESO = "#dc2626";
const CATEGORIA_POR_DEFECTO = "#9ca3af";

// Tabla de solo lectura (sin orden ni paginación): se queda como Server
// Component, así su markup no viaja como JS al navegador. La contraparte
// interactiva (con orden/paginación) es CardMovimientosSesion, en
// movimientos-caja.tsx, que sí necesita ser cliente.
export function CabeceraCard({ titulo }: { titulo: string }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <h3 className="text-[15px] font-medium text-muted-foreground min-[1513px]:text-[17px]">{titulo}</h3>
      <Link
        href="/panel/reportes"
        aria-label="Exportar"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:border-ring"
      >
        <DownloadIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}

function Encabezado() {
  return (
    <thead>
      <tr>
        <th className="border-b border-border p-2 text-left text-[13px] font-medium text-muted-foreground">Movimiento</th>
        <th className="border-b border-border p-2 text-left text-[13px] font-medium text-muted-foreground">Descripción</th>
        <th className="border-b border-border p-2 text-left text-[13px] font-medium text-muted-foreground">Fecha</th>
        <th className="border-b border-border p-2 text-center text-[13px] font-medium text-muted-foreground">Comprobante</th>
        <th className="border-b border-border p-2 text-right text-[13px] font-medium text-muted-foreground">Monto</th>
        <th className="border-b border-border p-2 text-right text-[13px] font-medium text-muted-foreground">Tipo</th>
      </tr>
    </thead>
  );
}

export function CardMovimientosSemana({ movimientos, urlsComprobantes }: { movimientos: MovimientoReciente[]; urlsComprobantes: Map<string, string> }) {
  return (
    <div className="rounded-[20px] bg-card p-[6px_22px_10px] shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <CabeceraCard titulo="Movimientos de la semana" />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <Encabezado />
          <tbody>
            {movimientos.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-sm text-muted-foreground">
                  No hay movimientos esta semana.
                </td>
              </tr>
            )}
            {movimientos.map((mov) => {
              const Icono = obtenerIcono(mov.categoriaIcono);
              const colorCategoria = mov.categoriaColor ?? CATEGORIA_POR_DEFECTO;
              const nombre = mov.categoriaNombre ?? mov.descripcion ?? "Movimiento";
              const monto = formatearMontoPartes(mov.monto);
              const esIngreso = mov.tipo === "ingreso";
              const urlComprobante = mov.comprobanteUrl ? urlsComprobantes.get(mov.comprobanteUrl) : undefined;

              return (
                <tr key={mov.id}>
                  <td className="border-b border-border p-2 text-[13px]">
                    <div className="flex items-center gap-3 font-medium">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: colorConAlpha(colorCategoria, 0.12), color: colorCategoria }}
                      >
                        <Icono className="h-4 w-4" />
                      </span>
                      <span className="truncate">{nombre}</span>
                    </div>
                  </td>
                  <td className="border-b border-border p-2 text-[13px] text-muted-foreground">
                    <span className="block max-w-[220px] truncate">{mov.descripcion ?? "—"}</span>
                  </td>
                  <td className="border-b border-border p-2 whitespace-nowrap text-[13px] text-muted-foreground">
                    {formatearFecha(mov.fecha)} · {formatearHora(mov.fecha)}
                  </td>
                  <td className="border-b border-border p-2 text-center">
                    {urlComprobante ? (
                      <a href={urlComprobante} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:underline">
                        <PaperclipIcon className="h-3.5 w-3.5" />
                        Ver
                      </a>
                    ) : (
                      <span className="text-[13px] text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="border-b border-border p-2 text-right font-mono text-[13px] font-bold whitespace-nowrap">
                    {esIngreso ? "+" : "−"} S/ {monto.entero}.{monto.decimales}
                  </td>
                  <td className="border-b border-border p-2 text-right">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium whitespace-nowrap" style={{ color: esIngreso ? INGRESO : EGRESO }}>
                      <span className="h-2 w-2 rounded-full" style={{ background: esIngreso ? INGRESO : EGRESO }} />
                      {esIngreso ? "Ingreso" : "Egreso"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
