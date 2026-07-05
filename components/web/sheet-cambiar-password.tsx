"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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
      <SheetContent className="gap-0 p-0">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>Cambiar contraseña</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={(evento) => {
            evento.preventDefault();
            guardar();
          }}
          className="flex flex-1 flex-col gap-4 overflow-y-auto p-5"
        >
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Nueva contraseña</label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
              className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm focus:border-ring focus:bg-card focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Confirmar contraseña</label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmacion}
              onChange={(evento) => setConfirmacion(evento.target.value)}
              className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm focus:border-ring focus:bg-card focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {enviando ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
