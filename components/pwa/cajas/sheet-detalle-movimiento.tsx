"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CameraIcon, CircleCheckIcon, FileTextIcon, PaperclipIcon, XIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { obtenerIcono } from "@/lib/iconos";
import { colorConAlpha } from "@/lib/color";
import { formatearHora, formatearMontoPartes } from "@/lib/formato";
import type { MovimientoReciente } from "@/lib/consultas";

export type PrefillMovimiento = {
  tipo: "ingreso" | "egreso";
  categoriaId: string;
  monto: number;
  descripcion: string | null;
};

type Props = {
  movimiento: MovimientoReciente | null;
  cajaId: string;
  onOpenChange: (abierto: boolean) => void;
  onAnuladoParaRecrear: (datos: PrefillMovimiento) => void;
};

export function SheetDetalleMovimiento({ movimiento, cajaId, onOpenChange, onAnuladoParaRecrear }: Props) {
  const [descripcion, setDescripcion] = useState("");
  const [comprobanteNuevo, setComprobanteNuevo] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [modoAnular, setModoAnular] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [anulando, setAnulando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!movimiento) return;
    setDescripcion(movimiento.descripcion ?? "");
    setComprobanteNuevo(null);
    setModoAnular(false);
    setMotivo("");
  }, [movimiento]);

  async function verComprobante() {
    if (!movimiento?.comprobanteUrl) return;
    const supabase = createClient();
    const { data, error } = await supabase.storage.from("comprobantes").createSignedUrl(movimiento.comprobanteUrl, 60);

    if (error || !data) {
      toast.error("No se pudo abrir el comprobante");
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  async function guardarCambios() {
    if (!movimiento) return;

    setGuardando(true);
    const supabase = createClient();

    try {
      let comprobanteUrl = movimiento.comprobanteUrl;

      if (comprobanteNuevo) {
        const ruta = `${cajaId}/${Date.now()}-${comprobanteNuevo.name}`;
        const { error: errorSubida } = await supabase.storage.from("comprobantes").upload(ruta, comprobanteNuevo);
        if (errorSubida) throw errorSubida;
        comprobanteUrl = ruta;
      }

      const { data, error } = await supabase
        .from("movimientos")
        .update({ descripcion: descripcion.trim() || null, comprobante_url: comprobanteUrl })
        .eq("id", movimiento.id)
        .select("id");

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("No se puede editar: la sesión de ese movimiento ya está cerrada");

      toast.success("Movimiento actualizado");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el movimiento");
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarAnulacion() {
    if (!movimiento || !motivo.trim()) return;

    setAnulando(true);
    const supabase = createClient();

    try {
      const { error } = movimiento.transferenciaId
        ? await supabase.rpc("anular_transferencia", { p_transferencia_id: movimiento.transferenciaId, p_motivo: motivo.trim() })
        : await supabase.rpc("anular_movimiento", { p_movimiento_id: movimiento.id, p_motivo: motivo.trim() });

      if (error) throw error;

      toast.success("Movimiento anulado");
      onOpenChange(false);

      if (movimiento.categoriaId) {
        onAnuladoParaRecrear({
          tipo: movimiento.tipo,
          categoriaId: movimiento.categoriaId,
          monto: movimiento.monto,
          descripcion: movimiento.descripcion,
        });
      }

      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo anular el movimiento");
    } finally {
      setAnulando(false);
    }
  }

  if (!movimiento) {
    return (
      <Sheet open={false} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" />
      </Sheet>
    );
  }

  const Icono = obtenerIcono(movimiento.categoriaIcono);
  const colorCategoria = movimiento.categoriaColor ?? "#9ca3af";
  const monto = formatearMontoPartes(movimiento.monto);
  const nombre = movimiento.categoriaNombre ?? movimiento.descripcion ?? "Movimiento";

  return (
    <Sheet open={movimiento !== null} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="gap-0">
        <div className="flex flex-1 flex-col overflow-y-auto px-6 pt-1 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {modoAnular ? (
            <>
              <h2 className="mb-4 text-center text-lg font-bold text-gray-800">Anular movimiento</h2>

              <div className="mb-6 flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                <span className="text-sm font-semibold text-gray-700">{nombre}</span>
                <span className={`font-mono text-sm font-bold ${movimiento.tipo === "ingreso" ? "text-emerald-600" : "text-red-600"}`}>
                  {movimiento.tipo === "egreso" ? "−" : "+"} S/ {monto.entero}.{monto.decimales}
                </span>
              </div>

              <label className="mb-2 block text-xs font-bold text-gray-500 uppercase">Motivo (obligatorio)</label>
              <Textarea
                value={motivo}
                onChange={(evento) => setMotivo(evento.target.value)}
                placeholder="¿Por qué se anula este movimiento?"
                className="mb-6 rounded-2xl border-gray-200 bg-gray-50"
              />

              <button
                type="button"
                onClick={confirmarAnulacion}
                disabled={anulando || !motivo.trim()}
                className="mb-2 w-full rounded-2xl py-4 text-base font-bold text-white shadow-lg disabled:opacity-60"
                style={{ backgroundColor: "#E7000B" }}
              >
                {anulando ? "Anulando..." : "Anular movimiento"}
              </button>
              <button type="button" onClick={() => setModoAnular(false)} className="w-full rounded-2xl py-3 text-sm font-bold text-gray-500">
                Cancelar
              </button>
            </>
          ) : (
            <>
              <h2 className="mb-4 text-center text-lg font-bold text-gray-800">Detalle del movimiento</h2>

              <div className="mb-4 flex items-center gap-4 rounded-2xl bg-gray-50 px-4 py-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: colorConAlpha(colorCategoria, 0.12), color: colorCategoria }}>
                  <Icono className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-800">{nombre}</p>
                  <p className="text-xs text-gray-400">{formatearHora(movimiento.fecha)}</p>
                </div>
                <span className={`shrink-0 font-mono text-base font-bold ${movimiento.tipo === "ingreso" ? "text-emerald-600" : "text-red-600"}`}>
                  {movimiento.tipo === "egreso" ? "−" : "+"} S/ {monto.entero}.{monto.decimales}
                </span>
              </div>

              <label className="mb-2 block text-xs font-bold text-gray-500 uppercase">Descripción</label>
              <input
                type="text"
                value={descripcion}
                onChange={(evento) => setDescripcion(evento.target.value)}
                placeholder="Sin descripción"
                className="mb-4 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:outline-none"
              />

              <label className="mb-2 block text-xs font-bold text-gray-500 uppercase">Comprobante</label>
              <div className={`mb-6 rounded-2xl border-2 p-4 ${comprobanteNuevo || movimiento.comprobanteUrl ? "border-solid border-gray-200 bg-white" : "border-dashed border-gray-300 bg-gray-50"}`}>
                {comprobanteNuevo ? (
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                      <FileTextIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">{comprobanteNuevo.name}</p>
                      <p className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <CircleCheckIcon className="h-3 w-3" /> Nuevo archivo listo
                      </p>
                    </div>
                    <button type="button" onClick={() => setComprobanteNuevo(null)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : movimiento.comprobanteUrl ? (
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={verComprobante} className="flex flex-1 items-center gap-3 text-left">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                        <FileTextIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700 underline">Ver comprobante</p>
                    </button>
                    <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-600">
                      <PaperclipIcon className="h-3.5 w-3.5" /> Cambiar
                      <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(evento) => setComprobanteNuevo(evento.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-3 text-center">
                    <p className="mb-3 text-xs text-gray-500">Sin comprobante adjunto</p>
                    <div className="flex gap-2">
                      <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-gray-800 px-3.5 py-2 text-xs font-bold text-white">
                        <CameraIcon className="h-3.5 w-3.5" /> Tomar foto
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(evento) => setComprobanteNuevo(evento.target.files?.[0] ?? null)} />
                      </label>
                      <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-600">
                        <PaperclipIcon className="h-3.5 w-3.5" /> Subir
                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(evento) => setComprobanteNuevo(evento.target.files?.[0] ?? null)} />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={guardarCambios}
                disabled={guardando}
                className="mb-3 w-full rounded-2xl py-4 text-base font-bold text-white shadow-lg disabled:opacity-60"
                style={{ backgroundColor: "#006d36" }}
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>

              {movimiento.categoriaId ? (
                <button type="button" onClick={() => setModoAnular(true)} className="w-full rounded-2xl border border-red-100 bg-red-50 py-3.5 text-sm font-bold text-red-600">
                  Anular y registrar de nuevo
                </button>
              ) : (
                <p className="text-center text-xs text-gray-400">
                  {movimiento.transferenciaId ? "Es parte de una transferencia: anúlala completa desde Historial." : "El monto y la categoría no se pueden editar directo."}
                </p>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
