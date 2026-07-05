import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { formatearFecha, formatearMontoPartes } from "@/lib/formato";
import { oscurecerColor } from "@/lib/color";
import { obtenerEstadoArqueo } from "@/lib/arqueo";
import { LibroMayor } from "@/components/pwa/libro-mayor";
import type { SesionDetalle } from "@/lib/consultas";

type Props = {
  sesion: SesionDetalle;
};

const COLOR_POR_DEFECTO = "#006d36";

export function SesionDetalleAdminOrganizacion({ sesion }: Props) {
  const color = sesion.cajaColor ?? COLOR_POR_DEFECTO;
  const estado = obtenerEstadoArqueo(sesion.diferencia ?? 0);
  const apertura = formatearMontoPartes(sesion.montoApertura);
  const esperado = formatearMontoPartes(sesion.montoEsperado ?? 0);
  const contado = formatearMontoPartes(sesion.montoContado ?? 0);

  return (
    <div className="flex flex-col pb-8">
      <header className="flex items-center px-6 pt-8 pb-2">
        <Link href="/historial" aria-label="Volver a Historial" className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm">
          <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
        </Link>
      </header>

      <section className="relative px-6 pt-2 pb-4">
        <div
          className="relative flex flex-col overflow-hidden rounded-[28px] p-6 text-white shadow-xl"
          style={{ background: `linear-gradient(135deg, ${color}, ${oscurecerColor(color, 0.3)}, ${oscurecerColor(color, 0.65)})` }}
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] opacity-10" />
          <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />

          <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="mb-1 text-sm font-medium text-white/60">{sesion.cajaNombre}</p>
              <h2 className="text-lg font-bold">
                {formatearFecha(sesion.aperturaAt)}
                {sesion.cierreAt ? ` → ${formatearFecha(sesion.cierreAt)}` : ""}
              </h2>
            </div>
            <div
              className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-center shadow-sm"
              style={{ color: estado.color, transform: "rotate(-4deg)" }}
            >
              <p className="text-[11px] font-black tracking-wide uppercase">{estado.label}</p>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-2 border-t border-white/15 pt-4">
            <div>
              <p className="text-[10px] font-medium text-white/50 uppercase">Apertura</p>
              <p className="font-mono text-sm font-bold">
                {apertura.entero}.{apertura.decimales}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-white/50 uppercase">Esperado</p>
              <p className="font-mono text-sm font-bold">
                {esperado.entero}.{esperado.decimales}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-white/50 uppercase">Contado</p>
              <p className="font-mono text-sm font-bold">
                {contado.entero}.{contado.decimales}
              </p>
            </div>
          </div>
        </div>
      </section>

      <h3 className="mb-3 px-8 text-sm font-medium text-gray-400">Movimientos</h3>

      <LibroMayor movimientos={sesion.movimientos} montoApertura={sesion.montoApertura} montoContado={sesion.montoContado ?? sesion.montoApertura} />
    </div>
  );
}
