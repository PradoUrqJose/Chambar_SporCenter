"use client";

import { useState, type ReactNode } from "react";
import { CirclePlusIcon, CircleMinusIcon, HandCoinsIcon, LockIcon, LockOpenIcon, StoreIcon } from "lucide-react";
import { colorConAlpha } from "@/lib/color";
import { SheetRegistrarMovimiento } from "@/components/web/cajas/sheet-registrar-movimiento";
import { SheetAbrirCerrarCaja } from "@/components/web/cajas/sheet-abrir-cerrar-caja";
import { SheetFondoFijoStand } from "@/components/web/cajas/sheet-fondo-fijo-stand";
import type { CategoriaOpcion, StandOpcion } from "@/lib/consultas";

type Props = {
  cajaId: string;
  sesionAbiertaId: string | null;
  abierta: boolean;
  montoReferencia: number;
  categoriasIngreso: CategoriaOpcion[];
  categoriasEgreso: CategoriaOpcion[];
  // Solo se usan en la variante "tarjetas": si la empresa tiene stands
  // activos, se agregan los botones de entregar/recibir fondo fijo.
  stands?: StandOpcion[];
  // "compacta": 3 botones en fila (uso original, en el sidebar de la vista Semana).
  // "tarjetas": Ingreso/Egreso (+ Entregar/Recibir si hay stands) como tarjetas
  // circulares en grid + Cerrar de ancho completo.
  variante?: "compacta" | "tarjetas";
  // Solo admin_general/admin_organizacion pueden elegir una fecha pasada
  // (para cargar historial); el resto siempre usa la fecha/hora actual.
  esAdmin?: boolean;
};

const INGRESO = "#1f7a4d";
const EGRESO = "#dc2626";
const AZUL = "#2563eb";
const SLATE = "#40566e";
const ENTREGA = "#7c3aed";
const RECEPCION = "#0891b2";

export function AccionesCaja({ cajaId, sesionAbiertaId, abierta, montoReferencia, categoriasIngreso, categoriasEgreso, stands = [], variante = "compacta", esAdmin = false }: Props) {
  const [dialogoMovimiento, setDialogoMovimiento] = useState<"ingreso" | "egreso" | null>(null);
  const [dialogoStand, setDialogoStand] = useState<"entregar" | "recibir" | null>(null);
  const [dialogoCaja, setDialogoCaja] = useState(false);

  return (
    <>
      {variante === "tarjetas" ? (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <BotonTarjeta
              icon={<CirclePlusIcon className="h-4 w-4" />}
              label="Ingreso"
              color={INGRESO}
              disabled={!abierta}
              onClick={() => setDialogoMovimiento("ingreso")}
            />
            <BotonTarjeta
              icon={<CircleMinusIcon className="h-4 w-4" />}
              label="Egreso"
              color={EGRESO}
              disabled={!abierta}
              onClick={() => setDialogoMovimiento("egreso")}
            />
            {stands.length > 0 && (
              <>
                <BotonTarjeta
                  icon={<StoreIcon className="h-4 w-4" />}
                  label="Entregar fondo"
                  color={ENTREGA}
                  disabled={!abierta}
                  onClick={() => setDialogoStand("entregar")}
                />
                <BotonTarjeta
                  icon={<HandCoinsIcon className="h-4 w-4" />}
                  label="Recibir stand"
                  color={RECEPCION}
                  disabled={!abierta}
                  onClick={() => setDialogoStand("recibir")}
                />
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDialogoCaja(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-transform hover:-translate-y-0.5 active:translate-y-0"
            style={{ background: colorConAlpha(SLATE, 0.1), color: SLATE }}
          >
            {abierta ? <LockIcon className="h-3.5 w-3.5" /> : <LockOpenIcon className="h-3.5 w-3.5" />}
            {abierta ? "Cerrar sesión" : "Abrir caja"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 rounded-2xl bg-muted p-3.5">
          <BotonAccion icon={<CirclePlusIcon className="h-5 w-5" />} label="Ingreso" color={INGRESO} disabled={!abierta} onClick={() => setDialogoMovimiento("ingreso")} />
          <BotonAccion icon={<CircleMinusIcon className="h-5 w-5" />} label="Gasto" color={EGRESO} disabled={!abierta} onClick={() => setDialogoMovimiento("egreso")} />
          <BotonAccion icon={abierta ? <LockIcon className="h-5 w-5" /> : <LockOpenIcon className="h-5 w-5" />} label={abierta ? "Cerrar" : "Abrir"} color={AZUL} onClick={() => setDialogoCaja(true)} />
        </div>
      )}

      <SheetRegistrarMovimiento
        cajaId={cajaId}
        abierto={dialogoMovimiento !== null}
        modoInicial={dialogoMovimiento ?? "ingreso"}
        categoriasIngreso={categoriasIngreso}
        categoriasEgreso={categoriasEgreso}
        onOpenChange={(abierto) => setDialogoMovimiento(abierto ? (dialogoMovimiento ?? "ingreso") : null)}
        esAdmin={esAdmin}
      />

      <SheetAbrirCerrarCaja
        cajaId={cajaId}
        sesionAbiertaId={sesionAbiertaId}
        abierta={abierta}
        montoReferencia={montoReferencia}
        abierto={dialogoCaja}
        onOpenChange={setDialogoCaja}
        esAdmin={esAdmin}
      />

      {stands.length > 0 && (
        <SheetFondoFijoStand
          stands={stands}
          abierto={dialogoStand !== null}
          modoInicial={dialogoStand ?? "entregar"}
          onOpenChange={(abierto) => setDialogoStand(abierto ? (dialogoStand ?? "entregar") : null)}
        />
      )}
    </>
  );
}

function BotonAccion({ icon, label, color, disabled, onClick }: { icon: ReactNode; label: string; color: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="flex flex-col items-center gap-2 text-[13px] font-semibold disabled:opacity-40" style={{ color }}>
      <span className="flex h-[46px] w-[46px] items-center justify-center rounded-2xl bg-card shadow-[0_6px_16px_rgba(0,0,0,0.1)]">{icon}</span>
      {label}
    </button>
  );
}

function BotonTarjeta({ icon, label, color, disabled, onClick }: { icon: ReactNode; label: string; color: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex flex-1 flex-col items-center gap-1.5 rounded-xl px-1.5 py-2.5 transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-40"
      style={{ background: colorConAlpha(color, 0.12) }}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card" style={{ color }}>
        {icon}
      </span>
      <span className="text-center text-[11px] font-semibold" style={{ color }}>
        {label}
      </span>
    </button>
  );
}
