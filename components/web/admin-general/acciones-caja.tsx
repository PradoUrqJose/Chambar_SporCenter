"use client";

import { useState, type ReactNode } from "react";
import { CirclePlusIcon, CircleMinusIcon, LockIcon, LockOpenIcon } from "lucide-react";
import { DialogRegistrarMovimiento } from "@/components/web/admin-general/dialog-registrar-movimiento";
import { DialogAbrirCerrarCaja } from "@/components/web/admin-general/dialog-abrir-cerrar-caja";
import type { CategoriaOpcion } from "@/lib/consultas";

type Props = {
  cajaId: string;
  sesionAbiertaId: string | null;
  abierta: boolean;
  montoReferencia: number;
  categoriasIngreso: CategoriaOpcion[];
  categoriasEgreso: CategoriaOpcion[];
};

const INGRESO = "#1f7a4d";
const EGRESO = "#dc2626";
const AZUL = "#2563eb";

export function AccionesCaja({ cajaId, sesionAbiertaId, abierta, montoReferencia, categoriasIngreso, categoriasEgreso }: Props) {
  const [dialogoMovimiento, setDialogoMovimiento] = useState<"ingreso" | "egreso" | null>(null);
  const [dialogoCaja, setDialogoCaja] = useState(false);

  return (
    <>
      <div className="grid grid-cols-3 gap-3 rounded-2xl bg-muted p-3.5">
        <BotonAccion icon={<CirclePlusIcon className="h-5 w-5" />} label="Ingreso" color={INGRESO} disabled={!abierta} onClick={() => setDialogoMovimiento("ingreso")} />
        <BotonAccion icon={<CircleMinusIcon className="h-5 w-5" />} label="Gasto" color={EGRESO} disabled={!abierta} onClick={() => setDialogoMovimiento("egreso")} />
        <BotonAccion icon={abierta ? <LockIcon className="h-5 w-5" /> : <LockOpenIcon className="h-5 w-5" />} label={abierta ? "Cerrar" : "Abrir"} color={AZUL} onClick={() => setDialogoCaja(true)} />
      </div>

      <DialogRegistrarMovimiento
        cajaId={cajaId}
        abierto={dialogoMovimiento !== null}
        modoInicial={dialogoMovimiento ?? "ingreso"}
        categoriasIngreso={categoriasIngreso}
        categoriasEgreso={categoriasEgreso}
        onOpenChange={(abierto) => setDialogoMovimiento(abierto ? (dialogoMovimiento ?? "ingreso") : null)}
      />

      <DialogAbrirCerrarCaja cajaId={cajaId} sesionAbiertaId={sesionAbiertaId} abierta={abierta} montoReferencia={montoReferencia} abierto={dialogoCaja} onOpenChange={setDialogoCaja} />
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
