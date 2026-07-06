"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { SelectorColor } from "@/components/web/tabla/selector-color";
import { actualizarEmpresa, cambiarEstadoEmpresa, crearEmpresa } from "@/lib/acciones/empresas";
import type { EmpresaAdmin } from "@/lib/consultas";

type Props = {
  empresa: EmpresaAdmin | null;
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
};

const COLOR_POR_DEFECTO = "#1f7a4d";

export function SheetFormEmpresa({ empresa, abierto, onOpenChange }: Props) {
  const [nombre, setNombre] = useState("");
  const [ruc, setRuc] = useState("");
  const [color, setColor] = useState(COLOR_POR_DEFECTO);
  const [activa, setActiva] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!abierto) return;
    setNombre(empresa?.nombre ?? "");
    setRuc(empresa?.ruc ?? "");
    setColor(empresa?.color ?? COLOR_POR_DEFECTO);
    setActiva(empresa?.activa ?? true);
  }, [abierto, empresa]);

  async function alternarActiva(valor: boolean) {
    if (!empresa) return;
    setActiva(valor);
    try {
      await cambiarEstadoEmpresa(empresa.id, valor);
      router.refresh();
    } catch (error) {
      setActiva(!valor);
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado");
    }
  }

  async function guardar() {
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setEnviando(true);

    try {
      if (empresa) {
        await actualizarEmpresa(empresa.id, { nombre, ruc, color });
        toast.success("Empresa actualizada");
      } else {
        await crearEmpresa({ nombre, ruc, color });
        toast.success("Empresa creada");
      }
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la empresa");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>{empresa ? "Editar empresa" : "Nueva empresa"}</SheetTitle>
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
              placeholder="Ej. Chambar SAC"
              className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm focus:border-ring focus:bg-card focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">RUC</label>
            <input
              type="text"
              value={ruc}
              onChange={(evento) => setRuc(evento.target.value)}
              placeholder="20123456789"
              className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm focus:border-ring focus:bg-card focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Color</label>
            <SelectorColor valor={color} onChange={setColor} />
          </div>

          {empresa && (
            <div className="flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5">
              <span className="text-sm font-semibold">Empresa activa</span>
              <Switch checked={activa} onCheckedChange={alternarActiva} />
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
