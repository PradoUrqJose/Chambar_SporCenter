"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { formatearMontoPartes } from "@/lib/formato";

export type MovimientoParaAnular = {
  id: string;
  transferenciaId: string | null;
  tipo: "ingreso" | "egreso";
  monto: number;
  nombre: string;
};

type Props = {
  movimiento: MovimientoParaAnular | null;
  onOpenChange: (abierto: boolean) => void;
};

export function SheetAnularMovimiento({ movimiento, onOpenChange }: Props) {
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  async function confirmarAnulacion() {
    if (!movimiento || !motivo.trim()) return;

    setEnviando(true);
    const supabase = createClient();

    try {
      const { error } = movimiento.transferenciaId
        ? await supabase.rpc("anular_transferencia", { p_transferencia_id: movimiento.transferenciaId, p_motivo: motivo.trim() })
        : await supabase.rpc("anular_movimiento", { p_movimiento_id: movimiento.id, p_motivo: motivo.trim() });

      if (error) throw error;

      toast.success("Movimiento anulado");
      setMotivo("");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo anular el movimiento");
    } finally {
      setEnviando(false);
    }
  }

  const monto = movimiento ? formatearMontoPartes(movimiento.monto) : null;

  return (
    <Sheet
      open={movimiento !== null}
      onOpenChange={(valor) => {
        onOpenChange(valor);
        if (!valor) setMotivo("");
      }}
    >
      <SheetContent side="bottom" className="gap-0">
        <div className="flex flex-1 flex-col overflow-y-auto px-6 pt-1 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <h2 className="mb-4 text-center text-lg font-bold text-gray-800">Anular movimiento</h2>

          {movimiento && monto && (
            <div className="mb-6 flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
              <span className="text-sm font-semibold text-gray-700">{movimiento.nombre}</span>
              <span className={`font-mono text-sm font-bold ${movimiento.tipo === "ingreso" ? "text-emerald-600" : "text-red-600"}`}>
                {movimiento.tipo === "egreso" ? "−" : "+"} S/ {monto.entero}.{monto.decimales}
              </span>
            </div>
          )}

          <label className="mb-2 block text-xs font-bold text-gray-500 uppercase">Motivo (obligatorio)</label>
          <Textarea
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
            placeholder="¿Por qué se anula este movimiento?"
            className="mb-6 rounded-2xl border-gray-200 bg-gray-50"
          />

          <button
            type="button"
            onClick={confirmarAnulacion}
            disabled={enviando || !motivo.trim()}
            className="w-full rounded-2xl py-4 text-base font-bold text-white shadow-lg disabled:opacity-60"
            style={{ backgroundColor: "#E7000B" }}
          >
            {enviando ? "Anulando..." : "Anular movimiento"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
