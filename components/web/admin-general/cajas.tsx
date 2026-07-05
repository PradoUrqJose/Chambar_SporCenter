import Link from "next/link";
import { LockOpenIcon, LockIcon, TriangleAlertIcon, WalletIcon } from "lucide-react";
import { formatearMontoPartes, obtenerIniciales } from "@/lib/formato";
import { oscurecerColor } from "@/lib/color";
import { obtenerEstadoArqueo } from "@/lib/arqueo";
import { StatCard } from "@/components/web/stat-card";
import type { CajaEmpresa, SesionHistorial } from "@/lib/consultas";

type Props = {
  cajasEmpresas: CajaEmpresa[];
  sesionesCerradas: SesionHistorial[];
  estadoFiltro?: "abierta" | "cerrada";
};

const COLOR_POR_DEFECTO = "#1f7a4d";
const badgeIconProps = { className: "h-[18px] w-[18px]" };

const FILTROS = [
  { valor: undefined, label: "Todas" },
  { valor: "abierta", label: "Abiertas" },
  { valor: "cerrada", label: "Cerradas" },
] as const;

export function CajasAdminGeneral({ cajasEmpresas, sesionesCerradas, estadoFiltro }: Props) {
  // La primera sesión cerrada de cada caja es la última (sesionesCerradas ya
  // viene ordenada por cierre_at desc), por eso alcanza con quedarse con la
  // primera coincidencia por cajaId.
  const ultimaSesionPorCaja = new Map<string, SesionHistorial>();
  for (const sesion of sesionesCerradas) {
    if (!ultimaSesionPorCaja.has(sesion.cajaId)) ultimaSesionPorCaja.set(sesion.cajaId, sesion);
  }

  const cajasConEstado = cajasEmpresas.map((caja) => {
    const ultimaSesion = caja.cajaId ? ultimaSesionPorCaja.get(caja.cajaId) : undefined;
    const sello = ultimaSesion && ultimaSesion.diferencia !== 0 ? obtenerEstadoArqueo(ultimaSesion.diferencia) : null;
    return { ...caja, sello };
  });

  const cajasAbiertas = cajasConEstado.filter((caja) => caja.abierta).length;
  const cajasCerradas = cajasConEstado.length - cajasAbiertas;
  const cajasDescuadradas = cajasConEstado.filter((caja) => caja.sello !== null).length;
  const saldoTotal = formatearMontoPartes(cajasConEstado.reduce((total, caja) => total + caja.saldo, 0));

  const cajasVisibles = estadoFiltro ? cajasConEstado.filter((caja) => (estadoFiltro === "abierta" ? caja.abierta : !caja.abierta)) : cajasConEstado;

  return (
    <div>
      <div className="mb-[22px]">
        <h1 className="text-[32px] font-extrabold">Cajas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Estado y saldo de cada caja de la organización.</p>
      </div>

      <div className="mb-[18px] grid grid-cols-4 gap-[18px] max-[1100px]:grid-cols-2">
        <StatCard label="Cajas abiertas" valor={cajasAbiertas} icon={<LockOpenIcon {...badgeIconProps} />} />
        <StatCard label="Cajas cerradas" valor={cajasCerradas} icon={<LockIcon {...badgeIconProps} />} />
        <StatCard
          label="Descuadradas"
          valor={<span style={cajasDescuadradas > 0 ? { color: "#E7000B" } : undefined}>{cajasDescuadradas}</span>}
          icon={<TriangleAlertIcon {...badgeIconProps} />}
        />
        <StatCard
          label="Saldo total"
          valor={
            <span className="font-mono">
              S/ {saldoTotal.entero}
              <span className="text-xl text-muted-foreground">.{saldoTotal.decimales}</span>
            </span>
          }
          icon={<WalletIcon {...badgeIconProps} />}
        />
      </div>

      <div className="mb-4 flex gap-2">
        {FILTROS.map((filtro) => {
          const activo = estadoFiltro === filtro.valor;
          return (
            <Link
              key={filtro.label}
              href={filtro.valor ? `/panel/cajas?estado=${filtro.valor}` : "/panel/cajas"}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
                activo ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-ring"
              }`}
            >
              {filtro.label}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-[18px] max-[1100px]:grid-cols-1">
        {cajasVisibles.length === 0 && <p className="col-span-full py-6 text-center text-sm text-muted-foreground">No hay cajas en ese estado.</p>}

        {cajasVisibles.map((caja) => {
          const color = caja.color ?? COLOR_POR_DEFECTO;
          const monto = formatearMontoPartes(caja.saldo);

          return (
            <Link
              key={caja.empresaId}
              href={`/panel/cajas/${caja.empresaId}`}
              className="rounded-[22px] bg-card p-[22px] transition hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
            >
              <div className="mb-4 flex items-center gap-3.5">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${color}, ${oscurecerColor(color, 0.55)})` }}
                >
                  {obtenerIniciales(caja.nombre)}
                </div>
                <h3 className="min-w-0 flex-1 truncate text-base font-bold">{caja.nombre}</h3>
                <span
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${
                    caja.abierta ? "bg-[#e6f4ec] text-[#1f7a4d]" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {caja.abierta ? "Abierta" : "Cerrada"}
                </span>
              </div>

              <p className="mb-1 text-xs font-semibold text-muted-foreground">Saldo actual</p>
              <div className="flex items-center justify-between">
                <div className="font-mono text-3xl font-extrabold">
                  S/ {monto.entero}
                  <span className="text-base text-muted-foreground">.{monto.decimales}</span>
                </div>
                {caja.sello && (
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase" style={{ backgroundColor: `${caja.sello.color}1a`, color: caja.sello.color }}>
                    {caja.sello.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
