import Link from "next/link";
import { Building2Icon, UsersIcon, StoreIcon, DownloadIcon, ArrowRightIcon, TriangleAlertIcon, CheckIcon } from "lucide-react";
import { formatearFecha, formatearHora, formatearMontoPartes, obtenerIniciales } from "@/lib/formato";
import { oscurecerColor, colorConAlpha } from "@/lib/color";
import { obtenerEstadoArqueo } from "@/lib/arqueo";
import { obtenerIcono } from "@/lib/iconos";
import { StatCard } from "@/components/web/stat-card";
import { GraficoMovimientosSemana } from "@/components/web/cajas/grafico-movimientos-semana";
import type {
  AlertaArqueo,
  CajaEmpresa,
  CategoriaTop,
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
  categoriasTop: CategoriaTop[];
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
  categoriasTop,
}: Props) {
  // admin_empresa reusa este mismo componente con datos acotados a su única
  // empresa (ver app/(web)/panel/inicio/page.tsx) — en ese caso el listado
  // de "Empresas" y sus enlaces a /panel/empresas y /panel/usuarios no
  // aplican (esas páginas son admin_general-only), así que se ocultan.
  const esVistaUnicaEmpresa = empresasConConteo.length <= 1;

  const saldo = formatearMontoPartes(saldoConsolidado);
  const cajasAbiertas = cajasEmpresas.filter((caja) => caja.abierta).length;
  const totalCajas = cajasEmpresas.length;
  const pctAbiertas = totalCajas === 0 ? 0 : Math.round((cajasAbiertas / totalCajas) * 100);

  const abiertaPorEmpresa = new Map(cajasEmpresas.map((caja) => [caja.empresaId, caja.abierta]));
  const empresasEstado = empresasConConteo.map((empresa) => ({
    ...empresa,
    abierta: abiertaPorEmpresa.get(empresa.id) ?? false,
  }));

  const anguloArco = 80 * Math.PI;
  const offsetArco = anguloArco * (1 - pctAbiertas / 100);

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
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[12.5px] text-white/85">
                <span className="rounded-md bg-white/20 px-1.5 py-px font-bold">{cajasAbiertas}</span>
                de {totalCajas} cajas de empresa abiertas ahora
              </div>
              <Link href="/panel/cajas" className="group flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-white/90 hover:text-white">
                Ver cajas
                <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        <StatCard
          href={esVistaUnicaEmpresa ? undefined : "/panel/empresas"}
          label="Empresas activas"
          valor={resumen.empresasActivas}
          icon={<Building2Icon {...badgeIconProps} />}
        />
        <StatCard
          href={esVistaUnicaEmpresa ? undefined : "/panel/usuarios"}
          label="Usuarios totales"
          valor={resumen.usuariosTotales}
          icon={<UsersIcon {...badgeIconProps} />}
        />
        <StatCard href="/panel/stands" label="Stands activos" valor={resumen.standsActivos} icon={<StoreIcon {...badgeIconProps} />} />
      </div>

      <div className="mb-[18px] grid grid-cols-[1.6fr_1fr_1fr] gap-[18px] max-[1100px]:grid-cols-1">
        <GraficoMovimientosSemana flujoInicial={flujoSemanal} />

        <Link
          href="/panel/cajas"
          className="group rounded-[22px] bg-card p-[22px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
        >
          <h3 className="mb-3.5 text-lg font-bold">Cajas abiertas</h3>
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-[135px] w-[230px]">
              <svg viewBox="0 0 200 120" className="h-full w-full">
                <path d="M20 110 A80 80 0 0 1 180 110" fill="none" stroke="#e2e6e9" strokeWidth={20} strokeLinecap="round" strokeDasharray="4 8" />
                <path
                  d="M20 110 A80 80 0 0 1 180 110"
                  fill="none"
                  stroke="#2b8a58"
                  strokeWidth={20}
                  strokeLinecap="round"
                  strokeDasharray={anguloArco}
                  strokeDashoffset={offsetArco}
                  className="transition-[stroke-dashoffset] duration-700 ease-out"
                />
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
        </Link>

        <CajasDescuadradasCard alertas={alertasArqueo} />
      </div>

      <div className={`grid gap-[18px] max-[1100px]:grid-cols-1 ${esVistaUnicaEmpresa ? "grid-cols-2" : "grid-cols-3"}`}>
        {!esVistaUnicaEmpresa && <EmpresasCard empresas={empresasEstado} />}
        <SesionesRecientesCard sesiones={sesionesCerradas.slice(0, 5)} />
        <CategoriasTopCard categorias={categoriasTop} />
      </div>
    </div>
  );
}

type EmpresaEstado = EmpresaResumen & { abierta: boolean };

function EmpresasCard({ empresas }: { empresas: EmpresaEstado[] }) {
  return (
    <div className="rounded-[22px] bg-card p-[22px_22px_12px] transition-shadow duration-200 hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
      <div className="mb-[18px] flex items-center justify-between">
        <h3 className="text-lg font-bold">Empresas</h3>
        <Link
          href="/panel/empresas"
          className="rounded-full border border-border px-3.5 py-1.5 text-[13px] font-semibold transition-colors hover:border-ring"
        >
          Ver todas
        </Link>
      </div>
      <div className="flex flex-col gap-1.5 pb-2.5">
        {empresas.map((empresa) => {
          const color = empresa.color ?? COLOR_POR_DEFECTO;

          return (
            <Link
              key={empresa.id}
              href="/panel/empresas"
              className="-mx-2 flex items-center gap-3.5 rounded-xl px-2 py-1 transition-colors hover:bg-muted"
            >
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
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function CajasDescuadradasCard({ alertas }: { alertas: AlertaArqueo[] }) {
  return (
    <div className="rounded-[22px] bg-card p-[22px] transition-shadow duration-200 hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
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
        <div className="flex flex-col gap-1">
          {alertas.slice(0, 4).map((alerta) => {
            const estado = obtenerEstadoArqueo(alerta.diferencia);
            const monto = formatearMontoPartes(Math.abs(alerta.diferencia));

            return (
              <Link
                key={alerta.sesionId}
                href={`/panel/historial?sesion=${alerta.sesionId}`}
                className="-mx-2 flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted"
              >
                <TriangleAlertIcon className="h-4 w-4 shrink-0" style={{ color: estado.color }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold">{alerta.cajaNombre}</div>
                  <div className="text-[11px] text-muted-foreground">{formatearFecha(alerta.cierreAt)}</div>
                </div>
                <span className="shrink-0 font-mono text-xs font-bold" style={{ color: estado.color }}>
                  S/ {monto.entero}.{monto.decimales}
                </span>
              </Link>
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
    <div className="rounded-[22px] bg-card p-[22px_22px_12px] transition-shadow duration-200 hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
      <h3 className="mb-[18px] text-lg font-bold">Sesiones recientes</h3>
      <div className="flex flex-col gap-1 pb-2.5">
        {sesiones.length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay sesiones cerradas.</p>}

        {sesiones.map((sesion) => {
          const color = sesion.cajaColor ?? COLOR_POR_DEFECTO;
          const estado = obtenerEstadoArqueo(sesion.diferencia);
          const monto = formatearMontoPartes(sesion.montoContado);

          return (
            <Link
              key={sesion.id}
              href={`/panel/historial?sesion=${sesion.id}`}
              className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted"
            >
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
            </Link>
          );
        })}
      </div>
      <Link href="/panel/historial" className="block text-center text-[13px] font-semibold text-primary hover:underline">
        Ver historial completo
      </Link>
    </div>
  );
}

const CATEGORIA_POR_DEFECTO = "#9ca3af";
const COLOR_INGRESO = "#1f7a4d";
const COLOR_EGRESO = "#dc2626";

function CategoriasTopCard({ categorias }: { categorias: CategoriaTop[] }) {
  const maxTotal = Math.max(...categorias.map((categoria) => categoria.total), 1);

  return (
    <div className="rounded-[22px] bg-card p-[22px_22px_12px] transition-shadow duration-200 hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
      <h3 className="mb-[18px] text-lg font-bold">Categorías con más movimiento</h3>
      {categorias.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Sin movimientos esta semana.</p>
      ) : (
        <div className="flex flex-col gap-3.5 pb-2.5">
          {categorias.map((categoria) => {
            const Icono = obtenerIcono(categoria.icono);
            const color = categoria.color ?? CATEGORIA_POR_DEFECTO;
            const colorTipo = categoria.tipo === "ingreso" ? COLOR_INGRESO : COLOR_EGRESO;
            const monto = formatearMontoPartes(categoria.total);
            const pct = Math.max(4, Math.round((categoria.total / maxTotal) * 100));

            return (
              <div key={categoria.id} className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: colorConAlpha(color, 0.12), color }}
                >
                  <Icono className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-[13px] font-semibold">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <i className="inline-block h-[7px] w-[7px] shrink-0 rounded-full" style={{ backgroundColor: colorTipo }} />
                      <span className="truncate">{categoria.nombre}</span>
                    </span>
                    <span className="shrink-0 font-mono text-xs">
                      S/ {monto.entero}.{monto.decimales}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
