import Link from "next/link";
import { CircleAlertIcon } from "lucide-react";
import { NOMBRE_ORGANIZACION } from "@/lib/organizacion";
import { formatearFecha, formatearMontoPartes, obtenerIniciales } from "@/lib/formato";
import { oscurecerColor, colorConAlpha } from "@/lib/color";
import { obtenerEstadoArqueo } from "@/lib/arqueo";
import { GraficoFlujoSemanal } from "@/components/pwa/grafico-flujo-semanal";
import type { AlertaArqueo, CajaEmpresa, FlujoDia } from "@/lib/consultas";

type Props = {
  saldoConsolidado: number;
  ingresosHoy: number;
  egresosHoy: number;
  flujoSemanal: FlujoDia[];
  cajas: CajaEmpresa[];
  alertasArqueo: AlertaArqueo[];
};

const COLOR_POR_DEFECTO = "#006d36";

export function InicioAdminOrganizacion({ saldoConsolidado, ingresosHoy, egresosHoy, flujoSemanal, cajas, alertasArqueo }: Props) {
  const saldo = formatearMontoPartes(saldoConsolidado);
  const ingresos = formatearMontoPartes(ingresosHoy);
  const egresos = formatearMontoPartes(egresosHoy);

  return (
    <div className="flex flex-col gap-3 px-5 py-3">
      <section>
        <div className="relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#006d36] to-[#004d25] p-10 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] opacity-10" />
          <div className="relative z-10">
            <h2 className="mb-6 text-[13px] font-bold tracking-wider uppercase opacity-80">Saldo Consolidado Total</h2>
            <div className="mb-5 flex items-baseline justify-start gap-2">
              <span className="font-mono text-5xl font-bold tracking-tight">S/ {saldo.entero}</span>
              <span className="font-mono text-sm opacity-80">.{saldo.decimales}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium opacity-90">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              {NOMBRE_ORGANIZACION}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 px-1 text-sm font-bold text-gray-800">Estado de cajas</h3>
        <div className="flex gap-4 overflow-x-auto pb-1">
          {cajas.map((caja) => {
            const color = caja.color ?? COLOR_POR_DEFECTO;

            return (
              <Link key={caja.empresaId} href={`/cajas/${caja.empresaId}`} className="flex shrink-0 flex-col items-center gap-1.5">
                <div className="relative">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-xs font-bold text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${color}, ${oscurecerColor(color, 0.55)})` }}
                  >
                    {obtenerIniciales(caja.nombre)}
                  </div>
                  <span className={`absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${caja.abierta ? "bg-emerald-500" : "bg-gray-300"}`} />
                </div>
                <span className="max-w-[64px] truncate text-[10px] font-semibold text-gray-500">{caja.nombre}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col justify-between rounded-2xl border border-gray-50 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Ingresos hoy</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className="font-mono text-xl font-bold tracking-tight text-gray-900">
              S/ {ingresos.entero}.{ingresos.decimales}
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-gray-50 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Egresos hoy</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
            </div>
            <p className="font-mono text-xl font-bold tracking-tight text-gray-900">
              S/ {egresos.entero}.{egresos.decimales}
            </p>
          </div>
        </div>
      </section>

      {alertasArqueo.length > 0 && (
        <section>
          <div className="flex flex-col rounded-2xl border border-gray-50 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <CircleAlertIcon className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-gray-800">Diferencias por revisar</h3>
            </div>
            <div className="flex flex-col gap-1">
              {alertasArqueo.map((alerta) => {
                const estado = obtenerEstadoArqueo(alerta.diferencia);
                const monto = formatearMontoPartes(Math.abs(alerta.diferencia));

                return (
                  <Link
                    key={alerta.sesionId}
                    href={`/historial/${alerta.sesionId}`}
                    className="flex items-center justify-between rounded-xl px-2 py-2 active:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-700">{alerta.cajaNombre}</p>
                      <p className="text-xs text-gray-400">{formatearFecha(alerta.cierreAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                        style={{ backgroundColor: colorConAlpha(estado.color, 0.12), color: estado.color }}
                      >
                        {estado.label}
                      </span>
                      <span className="font-mono text-sm font-bold" style={{ color: estado.color }}>
                        S/ {monto.entero}.{monto.decimales}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="flex flex-col rounded-2xl border border-gray-50 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">Flujo de Caja Semanal</h3>
            <div className="relative inline-block">
              <select className="appearance-none cursor-pointer rounded-2xl border-0 bg-[#eef9ec] px-4 py-2 pr-8 text-[10px] font-bold text-green-700 shadow-sm outline-none">
                <option>Semana actual</option>
              </select>
              <svg className="pointer-events-none absolute top-1/2 right-3 h-3 w-3 -translate-y-1/2 text-green-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="h-72">
            <GraficoFlujoSemanal datos={flujoSemanal} />
          </div>
        </div>
      </section>
    </div>
  );
}
