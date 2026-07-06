import Link from "next/link";
import { BanIcon, CheckCircle2Icon, ScaleIcon, TrendingUpIcon } from "lucide-react";
import { formatearFecha, formatearHora, formatearMontoPartes } from "@/lib/formato";
import { obtenerEstadoArqueo } from "@/lib/arqueo";
import { StatCard } from "@/components/web/stat-card";
import { FiltroFechasHistorial } from "@/components/web/historial/filtro-fechas-historial";
import { FilaHistorial } from "@/components/web/historial/fila-historial";
import { SheetDetalleSesion } from "@/components/web/cajas/sheet-detalle-sesion";
import type { CajaFiltro, ResumenHistorial, SesionDetalle, SesionHistorial } from "@/lib/consultas";

type Props = {
  cajasFiltro: CajaFiltro[];
  sesiones: SesionHistorial[];
  resumen: ResumenHistorial;
  cajaId?: string;
  desde?: string;
  hasta?: string;
  sesionDetalle: SesionDetalle | null;
  urlsComprobantes: Map<string, string>;
};

const COLOR_POR_DEFECTO = "#1f7a4d";
const badgeIconProps = { className: "h-[18px] w-[18px]" };

export function HistorialAdminGeneral({ cajasFiltro, sesiones, resumen, cajaId, desde, hasta, sesionDetalle, urlsComprobantes }: Props) {
  const diferenciaNeta = formatearMontoPartes(resumen.diferenciaNeta);

  function hrefFiltro(caja?: string) {
    const params = new URLSearchParams();
    if (caja) params.set("caja", caja);
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    const query = params.toString();
    return query ? `/panel/historial?${query}` : "/panel/historial";
  }

  function hrefSesion(sesionId: string) {
    const params = new URLSearchParams();
    if (cajaId) params.set("caja", cajaId);
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    params.set("sesion", sesionId);
    return `/panel/historial?${params.toString()}`;
  }

  return (
    <div>
      <div className="mb-[22px]">
        <h1 className="text-[32px] font-extrabold">Historial</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sesiones de caja cerradas en la organización.</p>
      </div>

      <div className="mb-[18px] grid grid-cols-4 gap-[18px] max-[1100px]:grid-cols-2">
        <StatCard label="Sesiones cerradas" valor={resumen.sesionesCerradas} icon={<CheckCircle2Icon {...badgeIconProps} />} />
        <StatCard
          label="Descuadradas"
          valor={<span style={resumen.sesionesDescuadradas > 0 ? { color: "#E7000B" } : undefined}>{resumen.sesionesDescuadradas}</span>}
          icon={<ScaleIcon {...badgeIconProps} />}
        />
        <StatCard label="Movimientos anulados" valor={resumen.movimientosAnulados} icon={<BanIcon {...badgeIconProps} />} />
        <StatCard
          label="Diferencia neta"
          valor={
            <span className="font-mono" style={resumen.diferenciaNeta !== 0 ? { color: resumen.diferenciaNeta < 0 ? "#E7000B" : "#d97706" } : undefined}>
              S/ {diferenciaNeta.entero}
              <span className="text-xl text-muted-foreground">.{diferenciaNeta.decimales}</span>
            </span>
          }
          icon={<TrendingUpIcon {...badgeIconProps} />}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Link
            href={hrefFiltro(undefined)}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
              !cajaId ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-ring"
            }`}
          >
            Todas
          </Link>
          {cajasFiltro.map((caja) => {
            const activo = cajaId === caja.id;
            return (
              <Link
                key={caja.id}
                href={hrefFiltro(caja.id)}
                className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
                  activo ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-ring"
                }`}
              >
                {caja.nombre}
              </Link>
            );
          })}
        </div>

        <FiltroFechasHistorial desde={desde} hasta={hasta} />
      </div>

      <div className="overflow-hidden rounded-[20px] bg-card shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border-b border-border p-3 text-left text-[13px] font-medium text-muted-foreground">Caja</th>
              <th className="border-b border-border p-3 text-left text-[13px] font-medium text-muted-foreground">Apertura</th>
              <th className="border-b border-border p-3 text-left text-[13px] font-medium text-muted-foreground">Cierre</th>
              <th className="border-b border-border p-3 text-left text-[13px] font-medium text-muted-foreground">Abierta / cerrada por</th>
              <th className="border-b border-border p-3 text-right text-[13px] font-medium text-muted-foreground">Monto contado</th>
              <th className="border-b border-border p-3 text-right text-[13px] font-medium text-muted-foreground">Estado</th>
            </tr>
          </thead>
          <tbody>
            {sesiones.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                  No hay sesiones cerradas en este rango.
                </td>
              </tr>
            )}
            {sesiones.map((sesion) => {
              const color = sesion.cajaColor ?? COLOR_POR_DEFECTO;
              const monto = formatearMontoPartes(sesion.montoContado);
              const sello = obtenerEstadoArqueo(sesion.diferencia);

              return (
                <FilaHistorial key={sesion.id} href={hrefSesion(sesion.id)}>
                  <td className="border-b border-border p-3 text-[13px]">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
                      {sesion.cajaNombre}
                    </span>
                  </td>
                  <td className="border-b border-border p-3 text-[13px] whitespace-nowrap text-muted-foreground">
                    {formatearFecha(sesion.aperturaAt)} · {formatearHora(sesion.aperturaAt)}
                  </td>
                  <td className="border-b border-border p-3 text-[13px] whitespace-nowrap text-muted-foreground">
                    {formatearFecha(sesion.cierreAt)} · {formatearHora(sesion.cierreAt)}
                  </td>
                  <td className="border-b border-border p-3 text-[12px] text-muted-foreground">
                    <span className="block truncate">{sesion.abiertaPor ?? "—"}</span>
                    <span className="block truncate">{sesion.cerradaPor ?? "—"}</span>
                  </td>
                  <td className="border-b border-border p-3 text-right font-mono text-[13px] font-bold whitespace-nowrap">
                    S/ {monto.entero}.{monto.decimales}
                  </td>
                  <td className="border-b border-border p-3 text-right">
                    <span
                      className="inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase"
                      style={{ backgroundColor: `${sello.color}1a`, color: sello.color }}
                    >
                      {sello.label}
                    </span>
                  </td>
                </FilaHistorial>
              );
            })}
          </tbody>
        </table>
      </div>

      <SheetDetalleSesion sesion={sesionDetalle} urlsComprobantes={urlsComprobantes} />
    </div>
  );
}
