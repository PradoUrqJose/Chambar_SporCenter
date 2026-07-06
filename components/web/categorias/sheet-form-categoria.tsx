"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { SelectorColor } from "@/components/web/tabla/selector-color";
import { SelectorIcono } from "@/components/web/categorias/selector-icono";
import { actualizarCategoria, cambiarEstadoCategoria, crearCategoria } from "@/lib/acciones/categorias";
import type { CategoriaAdmin } from "@/lib/consultas";

type Props = {
  categoria: CategoriaAdmin | null;
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
};

const COLOR_POR_DEFECTO = "#1f7a4d";
const ICONO_POR_DEFECTO = "Tag";
const INGRESO = "#1f7a4d";
const EGRESO = "#dc2626";

export function SheetFormCategoria({ categoria, abierto, onOpenChange }: Props) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<"ingreso" | "egreso">("egreso");
  const [descripcion, setDescripcion] = useState("");
  const [icono, setIcono] = useState(ICONO_POR_DEFECTO);
  const [color, setColor] = useState(COLOR_POR_DEFECTO);
  const [activa, setActiva] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [abiertoAnterior, setAbiertoAnterior] = useState(abierto);
  const router = useRouter();

  if (abierto !== abiertoAnterior) {
    setAbiertoAnterior(abierto);
    if (abierto) {
      setNombre(categoria?.nombre ?? "");
      setTipo(categoria?.tipo ?? "egreso");
      setDescripcion(categoria?.descripcion ?? "");
      setIcono(categoria?.icono ?? ICONO_POR_DEFECTO);
      setColor(categoria?.color ?? COLOR_POR_DEFECTO);
      setActiva(categoria?.activa ?? true);
    }
  }

  async function alternarActiva(valor: boolean) {
    if (!categoria) return;
    setActiva(valor);
    try {
      await cambiarEstadoCategoria(categoria.id, valor);
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
      if (categoria) {
        await actualizarCategoria(categoria.id, { nombre, tipo, descripcion, icono, color });
        toast.success("Categoría actualizada");
      } else {
        await crearCategoria({ nombre, tipo, descripcion, icono, color });
        toast.success("Categoría creada");
      }
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la categoría");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>{categoria ? "Editar categoría" : "Nueva categoría"}</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={(evento) => {
            evento.preventDefault();
            guardar();
          }}
          className="flex flex-1 flex-col gap-4 overflow-y-auto p-5"
        >
          <div className="flex rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setTipo("ingreso")}
              className="flex-1 rounded-lg py-2 text-sm font-bold text-muted-foreground transition-colors"
              style={tipo === "ingreso" ? { backgroundColor: "#fff", color: INGRESO, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : undefined}
            >
              Ingreso
            </button>
            <button
              type="button"
              onClick={() => setTipo("egreso")}
              className="flex-1 rounded-lg py-2 text-sm font-bold text-muted-foreground transition-colors"
              style={tipo === "egreso" ? { backgroundColor: "#fff", color: EGRESO, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : undefined}
            >
              Egreso
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              placeholder="Ej. Venta de entradas"
              className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm focus:border-ring focus:bg-card focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Descripción</label>
            <input
              type="text"
              value={descripcion}
              onChange={(evento) => setDescripcion(evento.target.value)}
              placeholder="Opcional"
              className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm focus:border-ring focus:bg-card focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Ícono</label>
            <SelectorIcono valor={icono} onChange={setIcono} color={color} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Color</label>
            <SelectorColor valor={color} onChange={setColor} />
          </div>

          {categoria && (
            <div className="flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5">
              <span className="text-sm font-semibold">Categoría activa</span>
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
