import Link from "next/link";
import { ChevronLeftIcon, HistoryIcon } from "lucide-react";
import { formatearMontoPartes, formatearHora } from "@/lib/formato";
import { oscurecerColor, colorConAlpha } from "@/lib/color";
import { obtenerIcono } from "@/lib/iconos";
import { SheetRegistrarMovimiento } from "@/components/pwa/sheet-registrar-movimiento";
import type { CajaEmpresaDetalle, FlujoDia, MovimientoReciente, CategoriaOpcion } from "@/lib/consultas";

type Props = {
  caja: CajaEmpresaDetalle;
  flujoSemanal: FlujoDia[];
  movimientos: MovimientoReciente[];
  categoriasIngreso: CategoriaOpcion[];
  categoriasEgreso: CategoriaOpcion[];
};

const COLOR_POR_DEFECTO = "#006d36";

export function CajaDetalleAdminOrganizacion({ caja, flujoSemanal, movimientos, categoriasIngreso, categoriasEgreso }: Props) {
  const color = caja.color ?? COLOR_POR_DEFECTO;
  const saldo = formatearMontoPartes(caja.saldo);
  const maxActividad = Math.max(...flujoSemanal.map((dia) => dia.ingresos + dia.egresos), 0);

  return (
    <div className="flex flex-col">
      <header className="flex items-center px-6 pt-8 pb-2">
        <Link href="/cajas" aria-label="Volver a Cajas" className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm">
          <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
        </Link>
      </header>

      <section className="relative px-6 pt-2 pb-4">
        <div
          className="relative flex aspect-[1.58/1] w-full flex-col justify-between overflow-hidden rounded-[28px] p-6 text-white shadow-xl"
          style={{ background: `linear-gradient(135deg, ${color}, ${oscurecerColor(color, 0.3)}, ${oscurecerColor(color, 0.65)})` }}
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] opacity-10" />
          <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />

          <span className="absolute top-6 right-6 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase">{caja.abierta ? "Abierta" : "Cerrada"}</span>

          <div className="relative z-10">
            <p className="mb-1 text-sm font-medium text-white/60">{caja.nombre}</p>
            <h2 className="mb-4 text-3xl font-bold">
              S/ {saldo.entero}.{saldo.decimales}
            </h2>
          </div>

          <div className="relative z-10 mb-2 flex h-24 items-end justify-between gap-1">
            {flujoSemanal.map((dia, indice) => {
              const actividad = dia.ingresos + dia.egresos;
              const alturaPorcentaje = maxActividad > 0 ? Math.max((actividad / maxActividad) * 100, 10) : 10;
              const esHoy = indice === flujoSemanal.length - 1;

              return (
                <div key={`${dia.dia}-${indice}`} className="flex flex-1 flex-col items-center">
                  <div className="mb-2 flex h-14 w-8 items-end">
                    <div className={`w-full rounded-full ${esHoy ? "bg-emerald-500" : "bg-white/10"}`} style={{ height: `${alturaPorcentaje}%` }} />
                  </div>
                  <span className={`text-[10px] ${esHoy ? "font-medium text-white" : "text-white/40"}`}>{dia.dia}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 px-3 py-4">
        <div className="flex flex-col items-center">
          <Link
            href="/historial"
            aria-label="Historial"
            className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-500 shadow-md shadow-gray-200 transition-transform active:scale-[0.94]"
          >
            <HistoryIcon className="h-6 w-6" />
          </Link>
          <span className="text-center text-[10px] leading-tight font-bold text-gray-500">Historial</span>
        </div>

        <SheetRegistrarMovimiento cajaId={caja.cajaId} categoriasIngreso={categoriasIngreso} categoriasEgreso={categoriasEgreso} deshabilitado={!caja.abierta} />
      </section>

      <section className="flex flex-col gap-6 px-8 pb-8">
        <h3 className="text-sm font-medium text-gray-400">Movimientos Recientes</h3>

        {movimientos.length === 0 && <p className="text-sm text-gray-400">Todavía no hay movimientos registrados.</p>}

        {movimientos.map((movimiento) => {
          const colorCategoria = movimiento.categoriaColor ?? "#9ca3af";
          const Icono = obtenerIcono(movimiento.categoriaIcono);
          const nombre = movimiento.categoriaNombre ?? movimiento.descripcion ?? "Movimiento";
          const signo = movimiento.tipo === "egreso" ? "−" : "+";
          const monto = formatearMontoPartes(movimiento.monto);

          return (
            <div key={movimiento.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: colorConAlpha(colorCategoria, 0.12), color: colorCategoria }}
                >
                  <Icono className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{nombre}</h4>
                  <p className="text-xs text-gray-400">{formatearHora(movimiento.fecha)}</p>
                </div>
              </div>
              <p className="font-mono font-bold text-gray-800">
                {signo} S/ {monto.entero}.{monto.decimales}
              </p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
