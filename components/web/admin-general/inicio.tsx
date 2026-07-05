import Link from "next/link";
import { Building2Icon, UsersIcon, StoreIcon, DownloadIcon, TriangleAlertIcon, CheckIcon } from "lucide-react";
import { formatearFecha, formatearHora, formatearMontoPartes, fechaLimaISO, obtenerIniciales } from "@/lib/formato";
import { oscurecerColor } from "@/lib/color";
import { obtenerEstadoArqueo } from "@/lib/arqueo";
import { StatCard } from "@/components/web/stat-card";
import type {
  AlertaArqueo,
  CajaEmpresa,
  EmpresaResumen,
  FlujoDia,
  ResumenOrganizacion,
  SesionHistorial,
} from "@/lib/consultas";

type Props = {
  saldoConsolidado: number;
  resumen: ResumenOrganizacion;
  cajasEmpresas: CajaEmpresa[];
  empresasConConteo: EmpresaResumen[];
  flujoSemanal: FlujoDia[];
  alertasArqueo: AlertaArqueo[];
  sesionesCerradas: SesionHistorial[];
};

const COLOR_POR_DEFECTO = "#1f7a4d";

const badgeIconProps = { className: "h-[18px] w-[18px]" };

export function InicioAdminGeneral({
  saldoConsolidado,
  resumen,
  cajasEmpresas,
  empresasConConteo,
  flujoSemanal,
  alertasArqueo,
  sesionesCerradas,
}: Props) {
  const saldo = formatearMontoPartes(saldoConsolidado);
  const cajasAbiertas = cajasEmpresas.filter((caja) => caja.abierta).length;
  const totalCajas = cajasEmpresas.length;
  const pctAbiertas = totalCajas === 0 ? 0 : Math.round((cajasAbiertas / totalCajas) * 100);

  const abiertaPorEmpresa = new Map(cajasEmpresas.map((caja) => [caja.empresaId, caja.abierta]));
  const empresasEstado = empresasConConteo.map((empresa) => ({
    ...empresa,
    abierta: abiertaPorEmpresa.get(empresa.id) ?? false,
  }));

  const totalesPorDia = flujoSemanal.map((dia) => dia.ingresos + dia.egresos);
  const maxTotal = Math.max(...totalesPorDia, 1);
  const hoyIndex = flujoSemanal.length - 1;
  const totalHoy = formatearMontoPartes(totalesPorDia[hoyIndex] ?? 0);

  const anguloArco = 80 * Math.PI;
  const offsetArco = anguloArco * (1 - pctAbiertas / 100);

  const cierresPorDia = flujoSemanal.map((dia) => ({
    dia: dia.dia,
    fecha: dia.fecha,
    cantidad: sesionesCerradas.filter((sesion) => fechaLimaISO(sesion.cierreAt) === fechaLimaISO(dia.fecha)).length,
  }));

  return (
    <div>
      <div className="mb-[18px] grid grid-cols-6 gap-[18px] max-[1100px]:grid-cols-1">
        <section
          className="relative col-span-3 overflow-hidden rounded-[26px] p-8 text-white max-[1100px]:col-span-1"
          style={{
            background:
              "radial-gradient(130% 160% at 15% -20%, rgba(255,255,255,0.22), transparent 55%), linear-gradient(135deg, #1f7a4d 0%, #0a2417 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "12px 12px",
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold text-[#8fd3b0]">Saldo consolidado</p>
              <Link href="/panel/reportes" aria-label="Exportar" className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-white/30 transition hover:bg-white/10">
                <DownloadIcon className="h-[18px] w-[18px]" />
              </Link>
            </div>
            <div className="mt-4 mb-2.5 flex items-baseline gap-1">
              <span className="font-mono text-5xl font-bold tracking-tight [animation:bloom_2s_ease-in-out_infinite_alternate]">S/ {saldo.entero}</span>
              <span className="font-mono text-lg text-[#8fd3b0]">.{saldo.decimales}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[12.5px] text-white/85">
              <span className="rounded-md bg-white/20 px-1.5 py-px font-bold">{cajasAbiertas}</span>
              de {totalCajas} cajas de empresa abiertas ahora
            </div>
          </div>
        </section>

        <StatCard label="Empresas activas" valor={resumen.empresasActivas} icon={<Building2Icon {...badgeIconProps} />} />
        <StatCard label="Usuarios totales" valor={resumen.usuariosTotales} icon={<UsersIcon {...badgeIconProps} />} />
        <StatCard label="Stands activos" valor={resumen.standsActivos} icon={<StoreIcon {...badgeIconProps} />} />
      </div>

      <div className="mb-[18px] grid grid-cols-[1.6fr_1fr_1fr] gap-[18px] max-[1100px]:grid-cols-1">
        <div className="rounded-[22px] bg-card p-[22px_22px_12px]">
          <h3 className="mb-[18px] text-lg font-bold">Movimientos de la semana</h3>
          <div className="flex h-[180px] items-end justify-between gap-[14px] pt-5">
            {flujoSemanal.map((dia, indice) => {
              const total = totalesPorDia[indice];
              const alturaPct = Math.max(8, Math.round((total / maxTotal) * 100));
              const esHoy = indice === hoyIndex;
              const esAyer = indice === hoyIndex - 1;

              return (
                <div key={dia.fecha} className="flex h-full flex-1 flex-col items-center justify-end gap-2.5">
                  <div
                    className="relative w-full max-w-[72px] rounded-[40px]"
                    style={{
                      height: `${alturaPct}%`,
                      background: esHoy ? "#176a41" : esAyer ? "#57bd8a" : "repeating-linear-gradient(135deg, #dfe3e6 0 6px, #eef1f3 6px 12px)",
                    }}
                  >
                    {esHoy && (
                      <span className="absolute -top-[30px] left-1/2 -translate-x-1/2 rounded-lg border border-border bg-card px-2 py-[3px] text-[11px] font-bold whitespace-nowrap shadow-[0_4px_10px_rgba(0,0,0,0.08)]">
                        S/ {totalHoy.entero}.{totalHoy.decimales}
                      </span>
                    )}
                  </div>
                  <span className="text-[13px] font-semibold text-muted-foreground">{dia.dia}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[22px] bg-card p-[22px]">
          <h3 className="mb-3.5 text-lg font-bold">Cajas abiertas</h3>
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-[135px] w-[230px]">
              <svg viewBox="0 0 200 120" className="h-full w-full">
                <path d="M20 110 A80 80 0 0 1 180 110" fill="none" stroke="#e2e6e9" strokeWidth={20} strokeLinecap="round" strokeDasharray="4 8" />
                <path d="M20 110 A80 80 0 0 1 180 110" fill="none" stroke="#2b8a58" strokeWidth={20} strokeLinecap="round" strokeDasharray={anguloArco} strokeDashoffset={offsetArco} />
              </svg>
              <div className="absolute right-0 bottom-1.5 left-0 text-center">
                <div className="text-[38px] font-extrabold">{pctAbiertas}%</div>
                <div className="text-xs text-muted-foreground">de las cajas</div>
              </div>
            </div>
            <div className="flex gap-5 text-[12.5px] font-semibold text-gray-600">
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-[11px] w-[11px] rounded-full bg-[#2b8a58]" />
                {cajasAbiertas} Abiertas
              </span>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-[11px] w-[11px] rounded-full bg-[#cbd2d7]" />
                {totalCajas - cajasAbiertas} Cerradas
              </span>
            </div>
          </div>
        </div>

        <CajasDescuadradasCard alertas={alertasArqueo} />
      </div>

      <div className="grid grid-cols-3 gap-[18px] max-[1100px]:grid-cols-1">
        <EmpresasCard empresas={empresasEstado} />
        <SesionesRecientesCard sesiones={sesionesCerradas.slice(0, 5)} />
        <CierresPorDiaCard dias={cierresPorDia} />
      </div>
    </div>
  );
}

type EmpresaEstado = EmpresaResumen & { abierta: boolean };

function EmpresasCard({ empresas }: { empresas: EmpresaEstado[] }) {
  return (
    <div className="rounded-[22px] bg-card p-[22px_22px_12px]">
      <div className="mb-[18px] flex items-center justify-between">
        <h3 className="text-lg font-bold">Empresas</h3>
        <Link
          href="/panel/empresas"
          className="rounded-full border border-border px-3.5 py-1.5 text-[13px] font-semibold hover:border-ring"
        >
          Ver todas
        </Link>
      </div>
      <div className="flex flex-col gap-3.5 pb-2.5">
        {empresas.map((empresa) => {
          const color = empresa.color ?? COLOR_POR_DEFECTO;

          return (
            <div key={empresa.id} className="flex items-center gap-3.5">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${color}, ${oscurecerColor(color, 0.55)})` }}
              >
                {obtenerIniciales(empresa.nombre)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{empresa.nombre}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {empresa.usuariosCount} {empresa.usuariosCount === 1 ? "usuario asignado" : "usuarios asignados"}
                </div>
              </div>
              <span
                className={`ml-auto shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold ${
                  empresa.abierta ? "bg-[#e6f4ec] text-[#1f7a4d]" : "bg-muted text-muted-foreground"
                }`}
              >
                {empresa.abierta ? "Abierta" : "Cerrada"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CajasDescuadradasCard({ alertas }: { alertas: AlertaArqueo[] }) {
  return (
    <div className="rounded-[22px] bg-card p-[22px]">
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="text-lg font-bold">Cajas descuadradas</h3>
        <span
          className={`flex h-[38px] w-[38px] items-center justify-center rounded-full text-sm font-extrabold ${
            alertas.length > 0 ? "bg-red-50 text-red-600" : "bg-[#e6f4ec] text-[#1f7a4d]"
          }`}
        >
          {alertas.length}
        </span>
      </div>

      {alertas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center text-sm text-muted-foreground">
          <CheckIcon className="h-5 w-5 text-[#1f7a4d]" />
          Todas cuadraron esta semana
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alertas.slice(0, 4).map((alerta) => {
            const estado = obtenerEstadoArqueo(alerta.diferencia);
            const monto = formatearMontoPartes(Math.abs(alerta.diferencia));

            return (
              <div key={alerta.sesionId} className="flex items-center gap-2.5">
                <TriangleAlertIcon className="h-4 w-4 shrink-0" style={{ color: estado.color }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold">{alerta.cajaNombre}</div>
                  <div className="text-[11px] text-muted-foreground">{formatearFecha(alerta.cierreAt)}</div>
                </div>
                <span className="shrink-0 font-mono text-xs font-bold" style={{ color: estado.color }}>
                  S/ {monto.entero}.{monto.decimales}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <Link href="/panel/historial" className="mt-4 block text-center text-[13px] font-semibold text-primary hover:underline">
        Ver historial completo
      </Link>
    </div>
  );
}

function SesionesRecientesCard({ sesiones }: { sesiones: SesionHistorial[] }) {
  return (
    <div className="rounded-[22px] bg-card p-[22px_22px_12px]">
      <h3 className="mb-[18px] text-lg font-bold">Sesiones recientes</h3>
      <div className="flex flex-col gap-3.5 pb-2.5">
        {sesiones.length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay sesiones cerradas.</p>}

        {sesiones.map((sesion) => {
          const color = sesion.cajaColor ?? COLOR_POR_DEFECTO;
          const estado = obtenerEstadoArqueo(sesion.diferencia);
          const monto = formatearMontoPartes(sesion.montoContado);

          return (
            <div key={sesion.id} className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${color}, ${oscurecerColor(color, 0.55)})` }}
              >
                {obtenerIniciales(sesion.cajaNombre)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{sesion.cajaNombre}</div>
                <div className="text-xs text-muted-foreground">
                  {formatearFecha(sesion.cierreAt)} · {formatearHora(sesion.cierreAt)}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono text-xs font-bold">
                  S/ {monto.entero}.{monto.decimales}
                </div>
                <div className="text-[10px] font-bold" style={{ color: estado.color }}>
                  {estado.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Link href="/panel/historial" className="block text-center text-[13px] font-semibold text-primary hover:underline">
        Ver historial completo
      </Link>
    </div>
  );
}

type CierreDia = { dia: string; fecha: string; cantidad: number };

function CierresPorDiaCard({ dias }: { dias: CierreDia[] }) {
  const maxCantidad = Math.max(...dias.map((dia) => dia.cantidad), 1);

  return (
    <div className="rounded-[22px] bg-card p-[22px_22px_12px]">
      <h3 className="mb-[18px] text-lg font-bold">Cierres de caja esta semana</h3>
      <div className="flex h-[140px] items-end justify-between gap-2.5 pt-5">
        {dias.map((dia) => {
          const alturaPct = dia.cantidad === 0 ? 6 : Math.max(15, Math.round((dia.cantidad / maxCantidad) * 100));

          return (
            <div key={dia.fecha} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span className="text-xs font-bold text-muted-foreground">{dia.cantidad}</span>
              <div
                className="w-full max-w-[36px] rounded-full bg-[#57bd8a]"
                style={{ height: `${alturaPct}%` }}
              />
              <span className="text-[11px] font-semibold text-muted-foreground">{dia.dia}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
