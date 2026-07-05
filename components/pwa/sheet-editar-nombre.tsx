"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type Props = {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  nombreActual: string;
};

export function SheetEditarNombre({ abierto, onOpenChange, nombreActual }: Props) {
  const [nombre, setNombre] = useState(nombreActual);
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  async function guardar() {
    if (!nombre.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }

    setEnviando(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.rpc("actualizar_mi_nombre", { p_nombre: nombre.trim() });
      if (error) throw error;

      toast.success("Nombre actualizado");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el nombre");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Sheet
      open={abierto}
      onOpenChange={(valor) => {
        onOpenChange(valor);
        if (valor) setNombre(nombreActual);
      }}
    >
      <SheetContent side="bottom" className="gap-0">
        <div className="flex flex-1 flex-col overflow-y-auto px-6 pt-1 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <h2 className="mb-4 text-center text-lg font-bold text-gray-800">Editar nombre</h2>

          <label className="mb-2 block text-xs font-bold text-gray-500 uppercase">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            className="mb-6 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:outline-none"
          />

          <button
            type="button"
            onClick={guardar}
            disabled={enviando}
            className="w-full rounded-2xl py-4 text-base font-bold text-white shadow-lg disabled:opacity-60"
            style={{ backgroundColor: "#006d36" }}
          >
            {enviando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
