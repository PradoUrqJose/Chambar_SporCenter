import Link from "next/link";
import { formatearMontoPartes, obtenerIniciales } from "@/lib/formato";
import { oscurecerColor } from "@/lib/color";
import type { CajaEmpresa } from "@/lib/consultas";

type Props = {
  nombreUsuario: string | null;
  cajas: CajaEmpresa[];
};

const COLOR_POR_DEFECTO = "#006d36";

export function CajasAdminOrganizacion({ nombreUsuario, cajas }: Props) {
  return (
    <div className="flex flex-col">
      <header className="px-6 pt-8 pb-6">
        <p className="mb-2 text-base font-medium text-gray-400">Hola, {nombreUsuario}</p>
        <h1 className="text-2xl leading-tight font-bold text-gray-800">¿Qué empresa vas a auditar?</h1>
      </header>

      <section className="flex flex-col gap-4 px-4 pb-6">
        {cajas.map((caja) => {
          const color = caja.color ?? COLOR_POR_DEFECTO;
          const monto = formatearMontoPartes(caja.saldo);

          return (
            <Link
              key={caja.empresaId}
              href={`/cajas/${caja.empresaId}`}
              className="w-full rounded-3xl border border-gray-100 bg-white p-5 text-left shadow-md shadow-gray-200 transition-transform active:scale-[0.97]"
            >
              <div className="mb-4 flex items-center gap-4">
                <div
                  className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${color}, ${oscurecerColor(color, 0.55)})` }}
                >
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] opacity-[0.18]" />
                  <span className="relative">{obtenerIniciales(caja.nombre)}</span>
                </div>
                <h3 className="flex-1 truncate text-lg font-bold text-gray-800">{caja.nombre}</h3>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${
                    caja.abierta ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {caja.abierta ? "Abierto" : "Cerrado"}
                </span>
              </div>
              <p className="mb-1 text-xs font-medium text-gray-400">Saldo actual</p>
              <p className="font-mono text-4xl font-bold text-gray-800">
                S/ {monto.entero}.{monto.decimales}
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
