import type { ReactNode } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { formatearMontoPartes, formatearFecha, formatearHora, obtenerIniciales } from "@/lib/formato";
import { colorConAlpha, oscurecerColor } from "@/lib/color";
import { obtenerEstadoArqueo } from "@/lib/arqueo";
import { AccionesCaja } from "@/components/web/cajas/acciones-caja";
import { CardMovimientosSesion } from "@/components/web/cajas/movimientos-caja";
import { CardMovimientosSemana } from "@/components/web/cajas/tabla-movimientos-semana";
import { SelectorVistaCaja } from "@/components/web/cajas/selector-vista-caja";
import type { CajaEmpresaDetalle, CategoriaOpcion, FlujoDia, MovimientoReciente, SesionDetalle, SesionDia, StandOpcion } from "@/lib/consultas";

type Props = {
  caja: CajaEmpresaDetalle;
  flujoSemanal: FlujoDia[];
  movimientos: MovimientoReciente[];
  sesionesSemana: SesionDia[];
  sesionActual: SesionDetalle | null;
  // YYYY-MM-DD calculado en el servidor (lib/consultas.ts:fechaLima) — se
  // evita calcular "hoy" en el cliente para no chocar con la regla de
  // pureza de render (Date.now/new Date durante render) ni con hidratación.
  fechaHoy: string;
  urlsComprobantes: Map<string, string>;
  categoriasIngreso: CategoriaOpcion[];
  categoriasEgreso: CategoriaOpcion[];
  stands: StandOpcion[];
  // admin_empresa solo tiene esta única caja: no hay lista a la que volver.
  mostrarVolver?: boolean;
};

const COLOR_POR_DEFECTO = "#1f7a4d";
const INGRESO = "#1f7a4d";
const EGRESO = "#dc2626";
const NEUTRO = "#8a9099";
const RING_VACIO = "#eceef0";

export function CajaDetalle({
  caja,
  flujoSemanal,
  movimientos,
  sesionesSemana,
  sesionActual,
  fechaHoy,
  urlsComprobantes,
  categoriasIngreso,
  categoriasEgreso,
  stands,
  mostrarVolver = true,
}: Props) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out motion-reduce:animate-none">
      <SelectorVistaCaja
        mostrarVolver={mostrarVolver}
        haySesionActual={sesionActual !== null}
        vistaSesion={
          sesionActual && (
            <VistaSesionActual
              caja={caja}
              sesionActual={sesionActual}
              fechaHoy={fechaHoy}
              urlsComprobantes={urlsComprobantes}
              categoriasIngreso={categoriasIngreso}
              categoriasEgreso={categoriasEgreso}
              stands={stands}
            />
          )
        }
        vistaSemana={
          <VistaSemana
            caja={caja}
            flujoSemanal={flujoSemanal}
            movimientos={movimientos}
            sesionesSemana={sesionesSemana}
            urlsComprobantes={urlsComprobantes}
            categoriasIngreso={categoriasIngreso}
            categoriasEgreso={categoriasEgreso}
          />
        }
      />
    </div>
  );
}

function VistaSesionActual({
  caja,
  sesionActual,
  fechaHoy,
  urlsComprobantes,
  categoriasIngreso,
  categoriasEgreso,
  stands,
}: {
  caja: CajaEmpresaDetalle;
  sesionActual: SesionDetalle;
  fechaHoy: string;
  urlsComprobantes: Map<string, string>;
  categoriasIngreso: CategoriaOpcion[];
  categoriasEgreso: CategoriaOpcion[];
  stands: StandOpcion[];
}) {
  const color = caja.color ?? COLOR_POR_DEFECTO;
  const saldo = formatearMontoPartes(caja.saldo);
  const apertura = formatearMontoPartes(sesionActual.montoApertura);

  const movimientosValidos = sesionActual.movimientos.filter((mov) => !mov.anulado);
  const ingresosSesion = movimientosValidos.filter((mov) => mov.tipo === "ingreso").reduce((total, mov) => total + mov.monto, 0);
  const egresosSesion = movimientosValidos.filter((mov) => mov.tipo === "egreso").reduce((total, mov) => total + mov.monto, 0);
  const totalSesion = ingresosSesion + egresosSesion;
  const pctIngresos = totalSesion > 0 ? (ingresosSesion / totalSesion) * 100 : 0;
  const pctEgresos = totalSesion > 0 ? (egresosSesion / totalSesion) * 100 : 0;
  const montoIngresos = formatearMontoPartes(ingresosSesion);
  const montoEgresos = formatearMontoPartes(egresosSesion);
  const montoTotalSesion = formatearMontoPartes(totalSesion);

  return (
    <div className="flex flex-wrap gap-[18px]">
      <div
        className="relative flex basis-[calc(50%_-_9px)] flex-col justify-between overflow-hidden rounded-[22px] p-7 text-white max-[900px]:basis-full min-[1513px]:basis-[calc((100%_-_336px)/2)]"
        style={{
          background: `linear-gradient(135deg, ${oscurecerColor(color, 0.45)} 0%, ${color} 45%, ${color} 55%, ${oscurecerColor(color, 0.45)} 100%)`,
          boxShadow: "0 24px 48px -18px rgba(0,0,0,0.45), 0 6px 16px -6px rgba(0,0,0,0.35)",
        }}
      >
        {/* Textura de metal cepillado */}
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "12px 12px" }} />
        {/* Manchas de luz difusas, como un reflejo de estudio sobre metal cepillado */}
        <div
          className="pointer-events-none absolute -top-[20%] left-[4%] h-[62%] w-[46%] rounded-full opacity-95 blur-[38px]"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.9), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -top-[16%] right-[8%] h-[55%] w-[40%] rounded-full opacity-90 blur-[38px]"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.9), transparent 70%)" }}
        />
        {/* Reflejo diagonal suave cruzando el centro */}
        <div
          className="pointer-events-none absolute top-[32%] left-[-30%] h-[55%] w-[160%] rotate-[-6deg] blur-[50px]"
          style={{
            background: "linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0.05) 70%, transparent 100%)",
          }}
        />
        {/* Bisel: borde biselado de metal (luz arriba-izq, sombra abajo-der) */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[22px]"
          style={{
            boxShadow: "inset 1.5px 1.5px 0 rgba(255,255,255,0.4), inset -1.5px -1.5px 0 rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.15)",
          }}
        />

        <span className="absolute top-4 right-4 z-10 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase backdrop-blur-sm min-[1513px]:text-[13px]">
          {caja.abierta ? "Abierta" : "Cerrada"}
        </span>

        <div className="relative z-10">
          <h2 className="text-xl font-bold drop-shadow-sm min-[1513px]:text-2xl">{caja.nombre}</h2>
          <p className="text-sm text-white/75 min-[1513px]:text-base">{formatearFecha(`${fechaHoy}T12:00:00Z`)}</p>
        </div>
        <div className="relative z-10 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-white/70 min-[1513px]:text-base">Apertura</p>
            <p className="font-mono text-2xl font-bold drop-shadow-sm min-[1513px]:text-3xl">
              S/ {apertura.entero}.{apertura.decimales}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/70 min-[1513px]:text-base">Total</p>
            <p className="font-mono text-5xl font-extrabold drop-shadow-sm min-[1513px]:text-6xl">
              S/ {saldo.entero}
              <span className="text-xl text-white/75 min-[1513px]:text-2xl">.{saldo.decimales}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex basis-[calc(50%_-_9px)] flex-col justify-between rounded-[20px] bg-card p-6 pb-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)] max-[900px]:basis-full min-[1513px]:basis-[calc((100%_-_336px)/2)]">
        <div>
          <div className="mb-5 flex items-center gap-2">
            <span
              className="h-[7px] w-[7px] shrink-0 rounded-full"
              style={{ background: caja.abierta ? INGRESO : NEUTRO, boxShadow: `0 0 0 3px ${colorConAlpha(caja.abierta ? INGRESO : NEUTRO, 0.15)}` }}
            />
            <span className="font-mono text-[11px] font-semibold tracking-[0.09em] text-muted-foreground uppercase min-[1513px]:text-[13px]">{caja.abierta ? "Sesión abierta" : "Sesión cerrada"}</span>
            <span className="flex-1" />
            <span className="text-xs text-muted-foreground/70 min-[1513px]:text-sm">Desde {formatearHora(sesionActual.aperturaAt)}</span>
          </div>

          <div className="mb-5 flex flex-col gap-1">
            <span className="text-[13px] font-medium text-muted-foreground min-[1513px]:text-[15px]">Total de la sesión</span>
            <span className="font-mono text-4xl font-bold tracking-tight min-[1513px]:text-5xl">
              S/ {montoTotalSesion.entero}.{montoTotalSesion.decimales}
            </span>
          </div>

          <div className="mb-5">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full transition-[width] duration-500" style={{ width: `${pctEgresos}%`, background: EGRESO }} />
              <div className="h-full transition-[width] duration-500" style={{ width: `${pctIngresos}%`, background: INGRESO }} />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ArrowDownIcon className="h-3.5 w-3.5 shrink-0" style={{ color: EGRESO }} />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground min-[1513px]:text-sm">Egresos</span>
                  <span className="font-mono text-sm font-bold min-[1513px]:text-base" style={{ color: EGRESO }}>
                    S/ {montoEgresos.entero}.{montoEgresos.decimales}
                  </span>
                </div>
              </div>
              <div className="flex flex-row-reverse items-center gap-1.5">
                <ArrowUpIcon className="h-3.5 w-3.5 shrink-0" style={{ color: INGRESO }} />
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground min-[1513px]:text-sm">Ingresos</span>
                  <span className="font-mono text-sm font-bold min-[1513px]:text-base" style={{ color: INGRESO }}>
                    S/ {montoIngresos.entero}.{montoIngresos.decimales}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Línea de corte estilo ticket: los "notches" usan el color de fondo de la página para simular una perforación */}
        <div className="relative -mx-6 border-t border-dashed border-border">
          <span className="absolute top-1/2 -left-2.5 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-background" />
          <span className="absolute top-1/2 -right-2.5 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-background" />
        </div>

        <div className="flex items-center justify-between pt-3 text-[11px] font-medium text-muted-foreground/70 min-[1513px]:text-[13px]">
          <span>{caja.nombre}</span>
          <span>
            {formatearFecha(sesionActual.aperturaAt)} · {formatearHora(sesionActual.aperturaAt)}
          </span>
        </div>
      </div>

      <div className="basis-[220px] shrink-0 self-start rounded-[20px] bg-card p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)] max-[900px]:basis-full">
        <h3 className="text-sm font-bold tracking-tight">Acciones</h3>
        <div className="mt-3">
          <AccionesCaja
            variante="tarjetas"
            cajaId={caja.cajaId}
            sesionAbiertaId={caja.sesionAbiertaId}
            abierta={caja.abierta}
            montoReferencia={caja.saldo}
            categoriasIngreso={categoriasIngreso}
            categoriasEgreso={categoriasEgreso}
            stands={stands}
          />
        </div>
      </div>

      <div className="min-w-0 basis-[calc(100%_-_238px)] grow max-[900px]:basis-full min-[1513px]:basis-full">
        <CardMovimientosSesion sesion={sesionActual} saldoActual={caja.saldo} urlsComprobantes={urlsComprobantes} />
      </div>
    </div>
  );
}

function VistaSemana({
  caja,
  flujoSemanal,
  movimientos,
  sesionesSemana,
  urlsComprobantes,
  categoriasIngreso,
  categoriasEgreso,
}: {
  caja: CajaEmpresaDetalle;
  flujoSemanal: FlujoDia[];
  movimientos: MovimientoReciente[];
  sesionesSemana: SesionDia[];
  urlsComprobantes: Map<string, string>;
  categoriasIngreso: CategoriaOpcion[];
  categoriasEgreso: CategoriaOpcion[];
}) {
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

        <CardMovimientosSemana movimientos={movimientos} urlsComprobantes={urlsComprobantes} />
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
