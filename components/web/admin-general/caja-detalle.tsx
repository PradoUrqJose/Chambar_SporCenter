import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon, DownloadIcon, PaperclipIcon } from "lucide-react";
import { formatearMontoPartes, formatearHora, formatearFecha, obtenerIniciales } from "@/lib/formato";
import { oscurecerColor, colorConAlpha } from "@/lib/color";
import { obtenerIcono } from "@/lib/iconos";
import { obtenerEstadoArqueo } from "@/lib/arqueo";
import { AccionesCaja } from "@/components/web/admin-general/acciones-caja";
import type { CajaEmpresaDetalle, CategoriaOpcion, FlujoDia, MovimientoReciente, SesionDia } from "@/lib/consultas";

type Props = {
  caja: CajaEmpresaDetalle;
  flujoSemanal: FlujoDia[];
  movimientos: MovimientoReciente[];
  sesionesSemana: SesionDia[];
  urlsComprobantes: Map<string, string>;
  categoriasIngreso: CategoriaOpcion[];
  categoriasEgreso: CategoriaOpcion[];
};

const COLOR_POR_DEFECTO = "#1f7a4d";
const INGRESO = "#1f7a4d";
const EGRESO = "#dc2626";
const RING_VACIO = "#eceef0";

export function CajaDetalleAdminGeneral({ caja, flujoSemanal, movimientos, sesionesSemana, urlsComprobantes, categoriasIngreso, categoriasEgreso }: Props) {
  const color = caja.color ?? COLOR_POR_DEFECTO;
  const saldo = formatearMontoPartes(caja.saldo);

  const ingresosSemana = flujoSemanal.reduce((total, dia) => total + dia.ingresos, 0);
  const egresosSemana = flujoSemanal.reduce((total, dia) => total + dia.egresos, 0);
  const totalSemana = ingresosSemana + egresosSemana;
  const fraccionIngreso = totalSemana > 0 ? ingresosSemana / totalSemana : 0;
  const montoIngresos = formatearMontoPartes(ingresosSemana);
  const montoEgresos = formatearMontoPartes(egresosSemana);
  const montoTotalSemana = formatearMontoPartes(totalSemana);

  const sesionesRecientes = [...sesionesSemana].sort((a, b) => new Date(b.aperturaAt).getTime() - new Date(a.aperturaAt).getTime()).slice(0, 3);

  return (
    <div>
      <Link href="/panel/cajas" className="mb-[18px] inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="h-4 w-4" />
        Cajas
      </Link>

      <div className="grid grid-cols-[300px_1fr] gap-10 max-[1100px]:grid-cols-1">
        {/* IZQUIERDA: identidad + balance semanal + acciones */}
        <div>
          <div className="mb-[22px] flex items-center gap-3.5">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${color}, ${oscurecerColor(color, 0.55)})` }}
            >
              {obtenerIniciales(caja.nombre)}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-[22px] font-extrabold leading-tight">{caja.nombre}</h1>
              <p className="text-sm text-muted-foreground">{caja.abierta ? "Sesión en curso" : "Cerrada"}</p>
            </div>
          </div>

          <div className="mb-3.5">
            <p className="text-[13px] text-muted-foreground">Ingresos esta semana</p>
            <p className="flex items-center gap-2 font-mono text-lg font-bold">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: INGRESO }} />
              S/ {montoIngresos.entero}.{montoIngresos.decimales}
            </p>
          </div>

          <div className="relative mx-auto mb-1 h-[230px] w-[230px]">
            <Donut grosor={26} fraccionIngreso={fraccionIngreso} activo={totalSemana > 0}>
              <span className="text-xs text-muted-foreground">Total semana</span>
              <span className="text-[28px] font-extrabold">S/ {montoTotalSemana.entero}</span>
            </Donut>
          </div>

          <div className="mb-[22px] text-right">
            <p className="text-[13px] text-muted-foreground">Egresos esta semana</p>
            <p className="flex items-center justify-end gap-2 font-mono text-lg font-bold">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: EGRESO }} />
              S/ {montoEgresos.entero}.{montoEgresos.decimales}
            </p>
          </div>

          <div className="rounded-[20px] bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <h3 className="mb-[18px] text-sm font-bold">Saldo actual</h3>
            <div className="mb-4 font-mono text-3xl font-extrabold">
              S/ {saldo.entero}
              <span className="text-lg text-muted-foreground">.{saldo.decimales}</span>
            </div>
            <AccionesCaja
              cajaId={caja.cajaId}
              sesionAbiertaId={caja.sesionAbiertaId}
              abierta={caja.abierta}
              montoReferencia={caja.saldo}
              categoriasIngreso={categoriasIngreso}
              categoriasEgreso={categoriasEgreso}
            />
          </div>
        </div>

        {/* DERECHA: sesiones recientes + tabla de movimientos */}
        <div>
          <h3 className="mb-4 text-[15px] font-medium text-muted-foreground">Sesiones recientes</h3>
          <div className="mb-[26px] grid grid-cols-3 gap-[18px] max-[1100px]:grid-cols-1">
            {sesionesRecientes.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Sin sesiones esta semana.</p>}

            {sesionesRecientes.map((sesion) => {
              const inicioMs = new Date(sesion.aperturaAt).getTime();
              const finMs = sesion.cierreAt ? new Date(sesion.cierreAt).getTime() : Date.now();
              const movimientosSesion = movimientos.filter((mov) => {
                const fechaMs = new Date(mov.fecha).getTime();
                return fechaMs >= inicioMs && fechaMs <= finMs;
              });
              const ingresos = movimientosSesion.filter((mov) => mov.tipo === "ingreso").reduce((total, mov) => total + mov.monto, 0);
              const egresos = movimientosSesion.filter((mov) => mov.tipo === "egreso").reduce((total, mov) => total + mov.monto, 0);
              const total = ingresos + egresos;
              const fraccion = total > 0 ? ingresos / total : 0;
              const montoTotal = formatearMontoPartes(total);
              const montoIng = formatearMontoPartes(ingresos);
              const montoEgr = formatearMontoPartes(egresos);
              const sello = sesion.cierreAt && sesion.diferencia != null && sesion.diferencia !== 0 ? obtenerEstadoArqueo(sesion.diferencia) : null;

              return (
                <div key={sesion.id} className="rounded-[18px] bg-card p-[18px] shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                  <div className="mb-3.5 flex items-center justify-between gap-2">
                    <b className="truncate text-sm font-bold">{sesion.cierreAt ? formatearFecha(sesion.cierreAt) : "En curso"}</b>
                    {sello && (
                      <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ backgroundColor: `${sello.color}1a`, color: sello.color }}>
                        {sello.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative h-[82px] w-[82px] shrink-0">
                      <Donut grosor={9} fraccionIngreso={fraccion} activo={total > 0}>
                        <span className="block text-[9px] text-muted-foreground">Total</span>
                        <b className="text-[15px]">S/{montoTotal.entero}</b>
                      </Donut>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 text-[11px]">
                      <div>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="h-2 w-2 rounded-full" style={{ background: INGRESO }} />
                          Ingresos
                        </span>
                        <b className="font-mono text-[13px]">
                          S/ {montoIng.entero}.{montoIng.decimales}
                        </b>
                      </div>
                      <div>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="h-2 w-2 rounded-full" style={{ background: EGRESO }} />
                          Egresos
                        </span>
                        <b className="font-mono text-[13px]">
                          S/ {montoEgr.entero}.{montoEgr.decimales}
                        </b>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2.5 text-right text-[10px] text-muted-foreground">Desde {formatearFecha(sesion.aperturaAt)}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-[20px] bg-card p-[6px_22px_10px] shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between py-3.5">
              <h3 className="text-[15px] font-medium text-muted-foreground">Movimientos de la semana</h3>
              <Link href="/panel/reportes" aria-label="Exportar" className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:border-ring">
                <DownloadIcon className="h-4 w-4" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
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
                    const colorCategoria = mov.categoriaColor ?? "#9ca3af";
                    const nombre = mov.categoriaNombre ?? mov.descripcion ?? "Movimiento";
                    const monto = formatearMontoPartes(mov.monto);
                    const esIngreso = mov.tipo === "ingreso";
                    const urlComprobante = mov.comprobanteUrl ? urlsComprobantes.get(mov.comprobanteUrl) : undefined;

                    return (
                      <tr key={mov.id}>
                        <td className="border-b border-border p-2 text-[13px]">
                          <div className="flex items-center gap-3 font-medium">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: colorConAlpha(colorCategoria, 0.12), color: colorCategoria }}>
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
                            <a
                              href={urlComprobante}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:underline"
                            >
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
        </div>
      </div>
    </div>
  );
}

// Donut sin SVG: un círculo conic-gradient (los 2 colores) con box-shadow
// inset encima para simular profundidad (como si el anillo tuviera relieve),
// más un segundo círculo del color de la tarjeta encima para "perforar" el
// centro y otro inset ahí para que el hueco se vea hundido.
function Donut({ grosor, fraccionIngreso, activo, children }: { grosor: number; fraccionIngreso: number; activo: boolean; children: ReactNode }) {
  const porcentaje = fraccionIngreso * 100;
  const fondo = activo ? `conic-gradient(${INGRESO} 0% ${porcentaje}%, ${EGRESO} ${porcentaje}% 100%)` : RING_VACIO;

  return (
    <>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: fondo,
          boxShadow: `inset 0 ${grosor * 0.3}px ${grosor * 0.5}px rgba(0,0,0,0.28), inset 0 -${grosor * 0.15}px ${grosor * 0.3}px rgba(255,255,255,0.35)`,
        }}
      />
      <div className="absolute rounded-full bg-card" style={{ inset: grosor, boxShadow: "inset 0 2px 5px rgba(0,0,0,0.12)" }} />
      <div className="absolute inset-0 grid place-content-center text-center">{children}</div>
    </>
  );
}
