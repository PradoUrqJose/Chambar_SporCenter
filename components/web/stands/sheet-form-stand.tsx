"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { actualizarStand, cambiarEstadoStand, crearStand } from "@/lib/acciones/stands";
import type { EmpresaOpcion, StandAdmin } from "@/lib/consultas";

type Props = {
  stand: StandAdmin | null;
  empresas: EmpresaOpcion[];
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
};

export function SheetFormStand({ stand, empresas, abierto, onOpenChange }: Props) {
  const [nombre, setNombre] = useState("");
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [activo, setActivo] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [abiertoAnterior, setAbiertoAnterior] = useState(abierto);
  const router = useRouter();

  if (abierto !== abiertoAnterior) {
    setAbiertoAnterior(abierto);
    if (abierto) {
      setNombre(stand?.nombre ?? "");
      setEmpresaId(stand?.empresaId ?? null);
      setActivo(stand?.activo ?? true);
    }
  }

  async function alternarActivo(valor: boolean) {
    if (!stand) return;
    setActivo(valor);
    try {
      await cambiarEstadoStand(stand.id, valor);
      router.refresh();
    } catch (error) {
      setActivo(!valor);
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado");
    }
  }

  async function guardar() {
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!empresaId) {
      toast.error("Elige una empresa");
      return;
    }

    setEnviando(true);

    try {
      if (stand) {
        await actualizarStand(stand.id, { nombre, empresaId });
        toast.success("Stand actualizado");
      } else {
        await crearStand({ nombre, empresaId });
        toast.success("Stand creado");
      }
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el stand");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>{stand ? "Editar stand" : "Nuevo stand"}</SheetTitle>
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
              placeholder="Ej. Stand Feria Norte"
              className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm focus:border-ring focus:bg-card focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Empresa</label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger className="w-full justify-start gap-3">
                <SelectValue placeholder="Elige una empresa">
                  {(valor: string | null) => empresas.find((empresa) => empresa.id === valor)?.nombre ?? "Elige una empresa"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {stand && (
            <div className="flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5">
              <span className="text-sm font-semibold">Stand activo</span>
              <Switch checked={activo} onCheckedChange={alternarActivo} />
            </div>
          )}

          <button type="submit" disabled={enviando} className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
            {enviando ? "Guardando..." : "Guardar"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
