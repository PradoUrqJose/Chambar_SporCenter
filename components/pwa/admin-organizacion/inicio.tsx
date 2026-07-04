import { NOMBRE_ORGANIZACION } from "@/lib/organizacion";
import { formatearMontoPartes } from "@/lib/formato";
import { GraficoFlujoSemanal } from "@/components/pwa/grafico-flujo-semanal";
import type { FlujoDia } from "@/lib/consultas";

type Props = {
  saldoConsolidado: number;
  ingresosHoy: number;
  egresosHoy: number;
  flujoSemanal: FlujoDia[];
};

export function InicioAdminOrganizacion({ saldoConsolidado, ingresosHoy, egresosHoy, flujoSemanal }: Props) {
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
