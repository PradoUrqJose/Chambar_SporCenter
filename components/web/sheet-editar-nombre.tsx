"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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
      <SheetContent className="gap-0 p-0">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>Editar nombre</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={(evento) => {
            evento.preventDefault();
            guardar();
          }}
          className="flex flex-1 flex-col gap-4 overflow-y-auto p-5"
        >
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              placeholder="Tu nombre completo"
              className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm focus:border-ring focus:bg-card focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {enviando ? "Guardando..." : "Guardar"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
