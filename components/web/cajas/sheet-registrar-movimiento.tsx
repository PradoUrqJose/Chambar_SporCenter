"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileTextIcon, PaperclipIcon, XIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { obtenerIcono } from "@/lib/iconos";
import type { CategoriaOpcion } from "@/lib/consultas";
import { ahoraLimaDatetimeLocal, datetimeLocalAIsoLima } from "@/lib/formato";

type Modo = "ingreso" | "egreso";

type Props = {
  cajaId: string;
  abierto: boolean;
  modoInicial: Modo;
  categoriasIngreso: CategoriaOpcion[];
  categoriasEgreso: CategoriaOpcion[];
  onOpenChange: (abierto: boolean) => void;
  // Solo admin_general/admin_organizacion pueden elegir una fecha pasada
  // (para cargar historial); el resto siempre usa la fecha/hora actual.
  esAdmin?: boolean;
};

const INGRESO = "#1f7a4d";
const EGRESO = "#dc2626";

export function SheetRegistrarMovimiento({ cajaId, abierto, modoInicial, categoriasIngreso, categoriasEgreso, onOpenChange, esAdmin = false }: Props) {
  const [modo, setModo] = useState<Modo>(modoInicial);
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [fecha, setFecha] = useState(ahoraLimaDatetimeLocal());
  const [enviando, setEnviando] = useState(false);
  const [abiertoAnterior, setAbiertoAnterior] = useState(abierto);
  const router = useRouter();

  if (abierto !== abiertoAnterior) {
    setAbiertoAnterior(abierto);
    if (abierto) {
      setModo(modoInicial);
      setCategoriaId(null);
      setMonto("");
      setDescripcion("");
      setComprobante(null);
      setFecha(ahoraLimaDatetimeLocal());
    }
  }

  const categoriasPorModo: Record<Modo, CategoriaOpcion[]> = { ingreso: categoriasIngreso, egreso: categoriasEgreso };
  const categorias = categoriasPorModo[modo];
  const acento = modo === "ingreso" ? INGRESO : EGRESO;

  function cambiarModo(nuevoModo: Modo) {
    setModo(nuevoModo);
    setCategoriaId(null);
  }

  async function registrar() {
    const montoNumero = Number(monto);

    if (!categoriaId || !montoNumero || montoNumero <= 0) {
      toast.error("Completa la categoría y un monto válido");
      return;
    }

    setEnviando(true);
    const supabase = createClient();

    try {
      let comprobanteUrl: string | null = null;

      if (comprobante) {
        const ruta = `${cajaId}/${Date.now()}-${comprobante.name}`;
        const { error: errorSubida } = await supabase.storage.from("comprobantes").upload(ruta, comprobante);
        if (errorSubida) throw errorSubida;
        comprobanteUrl = ruta;
      }

      const { error } = await supabase.rpc("registrar_movimiento", {
        p_caja_id: cajaId,
        p_tipo: modo,
        p_monto: montoNumero,
        p_categoria_id: categoriaId,
        p_descripcion: descripcion.trim() || undefined,
        p_comprobante_url: comprobanteUrl ?? undefined,
        p_fecha: esAdmin ? datetimeLocalAIsoLima(fecha) : undefined,
      });

      if (error) throw error;

      toast.success(modo === "ingreso" ? "Ingreso registrado" : "Gasto registrado");
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
          <SheetTitle>Registrar movimiento</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto p-5">
          <div className="mb-4 flex rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => cambiarModo("ingreso")}
              className="flex-1 rounded-lg py-2 text-sm font-bold text-muted-foreground transition-colors"
              style={modo === "ingreso" ? { backgroundColor: "#fff", color: INGRESO, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : undefined}
            >
              Ingreso
            </button>
            <button
              type="button"
              onClick={() => cambiarModo("egreso")}
              className="flex-1 rounded-lg py-2 text-sm font-bold text-muted-foreground transition-colors"
              style={modo === "egreso" ? { backgroundColor: "#fff", color: EGRESO, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : undefined}
            >
              Gasto
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
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Categoría</label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger className="w-full justify-start gap-3">
                  <SelectValue placeholder="Elige una categoría">
                    {(valor: string | null) => categorias.find((categoria) => categoria.id === valor)?.nombre ?? "Elige una categoría"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria) => {
                    const Icono = obtenerIcono(categoria.icono);
                    return (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        <Icono className="h-4 w-4 shrink-0" />
                        {categoria.nombre}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Descripción</label>
              <input
                type="text"
                value={descripcion}
                onChange={(evento) => setDescripcion(evento.target.value)}
                placeholder="Ej. Pago proveedor"
                className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm focus:border-ring focus:bg-card focus:outline-none"
              />
            </div>

            {esAdmin && (
              <div>
                <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Fecha y hora</label>
                <input
                  type="datetime-local"
                  value={fecha}
                  onChange={(evento) => setFecha(evento.target.value)}
                  className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm focus:border-ring focus:bg-card focus:outline-none"
                />
                <p className="mt-1 text-xs text-muted-foreground">Solo administradores pueden elegir una fecha pasada, para cargar historial.</p>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Comprobante</label>
              {!comprobante ? (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted py-3 text-sm font-semibold text-muted-foreground">
                  <PaperclipIcon className="h-4 w-4" /> Adjuntar archivo
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(evento) => setComprobante(evento.target.files?.[0] ?? null)} />
                </label>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5">
                  <FileTextIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{comprobante.name}</span>
                  <button type="button" onClick={() => setComprobante(null)} className="shrink-0 text-muted-foreground">
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <button type="submit" disabled={enviando} className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: acento }}>
              {enviando ? "Guardando..." : "Guardar movimiento"}
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
