"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { StandOpcion } from "@/lib/consultas";

type Modo = "entregar" | "recibir";

type Props = {
  stands: StandOpcion[];
  abierto: boolean;
  modoInicial: Modo;
  onOpenChange: (abierto: boolean) => void;
};

const ENTREGA = "#7c3aed";
const RECEPCION = "#0891b2";

export function SheetFondoFijoStand({ stands, abierto, modoInicial, onOpenChange }: Props) {
  const [modo, setModo] = useState<Modo>(modoInicial);
  const [standId, setStandId] = useState<string | null>(null);
  const [monto, setMonto] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!abierto) return;
    setModo(modoInicial);
    setStandId(null);
    setMonto("");
    setObservaciones("");
  }, [abierto, modoInicial]);

  const acento = modo === "entregar" ? ENTREGA : RECEPCION;

  async function registrar() {
    const montoNumero = Number(monto);

    if (!standId || !montoNumero || montoNumero <= 0) {
      toast.error("Elige un stand y un monto válido");
      return;
    }

    setEnviando(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.rpc(modo === "entregar" ? "entregar_a_stand" : "recibir_de_stand", {
        p_stand_id: standId,
        p_monto: montoNumero,
        p_observaciones: observaciones.trim() || null,
      });

      if (error) throw error;

      toast.success(modo === "entregar" ? "Fondo fijo entregado" : "Efectivo recibido del stand");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar el movimiento");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>Fondo fijo de stand</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto p-5">
          <div className="mb-4 flex rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setModo("entregar")}
              className="flex-1 rounded-lg py-2 text-sm font-bold text-muted-foreground transition-colors"
              style={modo === "entregar" ? { backgroundColor: "#fff", color: ENTREGA, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : undefined}
            >
              Entregar
            </button>
            <button
              type="button"
              onClick={() => setModo("recibir")}
              className="flex-1 rounded-lg py-2 text-sm font-bold text-muted-foreground transition-colors"
              style={modo === "recibir" ? { backgroundColor: "#fff", color: RECEPCION, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : undefined}
            >
              Recibir
            </button>
          </div>

          <form
            onSubmit={(evento) => {
              evento.preventDefault();
              registrar();
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col items-center py-2">
              <label className="mb-1 text-xs font-bold text-muted-foreground uppercase">Monto</label>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold text-muted-foreground/50">S/</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={monto}
                  onChange={(evento) => setMonto(evento.target.value.replace(/[^0-9.]/g, ""))}
                  className="w-[160px] bg-transparent text-center text-4xl font-bold placeholder:text-muted-foreground/40 focus:outline-none"
                  style={{ color: acento }}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Stand</label>
              <Select value={standId} onValueChange={setStandId}>
                <SelectTrigger className="w-full justify-start gap-3">
                  <SelectValue placeholder="Elige un stand">
                    {(valor: string | null) => stands.find((stand) => stand.id === valor)?.nombre ?? "Elige un stand"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {stands.map((stand) => (
                    <SelectItem key={stand.id} value={stand.id}>
                      {stand.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Observaciones</label>
              <Textarea value={observaciones} onChange={(evento) => setObservaciones(evento.target.value)} placeholder="Opcional" />
            </div>

            <button type="submit" disabled={enviando} className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: acento }}>
              {enviando ? "Guardando..." : modo === "entregar" ? "Entregar fondo" : "Registrar recepción"}
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
