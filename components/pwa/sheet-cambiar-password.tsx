"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type Props = {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
};

export function SheetCambiarPassword({ abierto, onOpenChange }: Props) {
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [enviando, setEnviando] = useState(false);

  function limpiar() {
    setPassword("");
    setConfirmacion("");
  }

  async function guardar() {
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmacion) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setEnviando(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success("Contraseña actualizada");
      limpiar();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la contraseña");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Sheet
      open={abierto}
      onOpenChange={(valor) => {
        onOpenChange(valor);
        if (!valor) limpiar();
      }}
    >
      <SheetContent side="bottom" className="gap-0">
        <div className="flex flex-1 flex-col overflow-y-auto px-6 pt-1 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <h2 className="mb-4 text-center text-lg font-bold text-gray-800">Cambiar contraseña</h2>

          <label className="mb-2 block text-xs font-bold text-gray-500 uppercase">Nueva contraseña</label>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            className="mb-4 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 focus:border-gray-400 focus:bg-white focus:outline-none"
          />

          <label className="mb-2 block text-xs font-bold text-gray-500 uppercase">Confirmar contraseña</label>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmacion}
            onChange={(evento) => setConfirmacion(evento.target.value)}
            className="mb-6 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 focus:border-gray-400 focus:bg-white focus:outline-none"
          />

          <button
            type="button"
            onClick={guardar}
            disabled={enviando}
            className="w-full rounded-2xl py-4 text-base font-bold text-white shadow-lg disabled:opacity-60"
            style={{ backgroundColor: "#006d36" }}
          >
            {enviando ? "Guardando..." : "Guardar contraseña"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
