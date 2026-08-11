"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { SelectorColor } from "@/components/web/tabla/selector-color";
import { SelectorIconoMedioPago } from "@/components/web/medios-pago/selector-icono-medio-pago";
import { actualizarMedioPago, cambiarEstadoMedioPago, crearMedioPago } from "@/lib/acciones/medios-pago";
import type { MedioPagoAdmin } from "@/lib/consultas";

type Props = {
  medioPago: MedioPagoAdmin | null;
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
};

const COLOR_POR_DEFECTO = "#7c3aed";
const ICONO_POR_DEFECTO = "CreditCard";
const TARJETA = "#7c3aed";
const TRANSFERENCIA = "#0891b2";

export function SheetFormMedioPago({ medioPago, abierto, onOpenChange }: Props) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<"tarjeta" | "transferencia">("transferencia");
  const [descripcion, setDescripcion] = useState("");
  const [icono, setIcono] = useState(ICONO_POR_DEFECTO);
  const [color, setColor] = useState(COLOR_POR_DEFECTO);
  const [activo, setActivo] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [abiertoAnterior, setAbiertoAnterior] = useState(abierto);
  const router = useRouter();

  if (abierto !== abiertoAnterior) {
    setAbiertoAnterior(abierto);
    if (abierto) {
      setNombre(medioPago?.nombre ?? "");
      setTipo(medioPago?.tipo ?? "transferencia");
      setDescripcion(medioPago?.descripcion ?? "");
      setIcono(medioPago?.icono ?? ICONO_POR_DEFECTO);
      setColor(medioPago?.color ?? COLOR_POR_DEFECTO);
      setActivo(medioPago?.activo ?? true);
    }
  }

  async function alternarActivo(valor: boolean) {
    if (!medioPago) return;
    setActivo(valor);
    try {
      await cambiarEstadoMedioPago(medioPago.id, valor);
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

    setEnviando(true);

    try {
      if (medioPago) {
        await actualizarMedioPago(medioPago.id, { nombre, tipo, descripcion, icono, color });
        toast.success("Medio de pago actualizado");
      } else {
        await crearMedioPago({ nombre, tipo, descripcion, icono, color });
        toast.success("Medio de pago creado");
      }
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el medio de pago");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>{medioPago ? "Editar medio de pago" : "Nuevo medio de pago"}</SheetTitle>
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
              onClick={() => setTipo("transferencia")}
              className="flex-1 rounded-lg py-2 text-sm font-bold text-muted-foreground transition-colors"
              style={tipo === "transferencia" ? { backgroundColor: "#fff", color: TRANSFERENCIA, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : undefined}
            >
              Transferencia
            </button>
            <button
              type="button"
              onClick={() => setTipo("tarjeta")}
              className="flex-1 rounded-lg py-2 text-sm font-bold text-muted-foreground transition-colors"
              style={tipo === "tarjeta" ? { backgroundColor: "#fff", color: TARJETA, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : undefined}
            >
              Tarjeta
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              placeholder="Ej. BCP, Interbank, Visa (Niubiz)"
              className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm focus:border-ring focus:bg-card focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Descripción</label>
            <input
              type="text"
              value={descripcion}
              onChange={(evento) => setDescripcion(evento.target.value)}
              placeholder="Opcional: nº de cuenta, titular, POS..."
              className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm focus:border-ring focus:bg-card focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Ícono</label>
            <SelectorIconoMedioPago valor={icono} onChange={setIcono} color={color} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Color</label>
            <SelectorColor valor={color} onChange={setColor} />
          </div>

          {medioPago && (
            <div className="flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5">
              <span className="text-sm font-semibold">Medio de pago activo</span>
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
