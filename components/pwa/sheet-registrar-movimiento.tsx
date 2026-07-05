"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CameraIcon, CircleCheckIcon, CircleMinusIcon, CirclePlusIcon, FileTextIcon, PaperclipIcon, ReceiptIcon, XIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { obtenerIcono } from "@/lib/iconos";
import type { CategoriaOpcion } from "@/lib/consultas";
import type { PrefillMovimiento } from "@/components/pwa/sheet-detalle-movimiento";

type Modo = "ingreso" | "egreso";

type Props = {
  cajaId: string;
  categoriasIngreso: CategoriaOpcion[];
  categoriasEgreso: CategoriaOpcion[];
  deshabilitado?: boolean;
  // Cuando otro componente (ej. "Anular y registrar de nuevo") necesita abrir
  // este sheet ya precargado, en vez de esperar a que el usuario toque
  // Ingreso/Gasto: cada objeto nuevo (por referencia) reabre con esos datos.
  prefill?: PrefillMovimiento | null;
};

const TEMAS: Record<Modo, { label: string; accent: string; suave: string; gradiente: string }> = {
  ingreso: { label: "Ingreso", accent: "#059669", suave: "#ECFDF5", gradiente: "linear-gradient(135deg, #059669, #065f46)" },
  egreso: { label: "Gasto", accent: "#E7000B", suave: "#FEF2F2", gradiente: "linear-gradient(135deg, #E7000B, #7f1d1d)" },
};

export function SheetRegistrarMovimiento({ cajaId, categoriasIngreso, categoriasEgreso, deshabilitado, prefill }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [modo, setModo] = useState<Modo>("egreso");
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!prefill) return;
    setModo(prefill.tipo);
    setCategoriaId(prefill.categoriaId);
    setMonto(String(prefill.monto));
    setDescripcion(prefill.descripcion ?? "");
    setComprobante(null);
    setAbierto(true);
  }, [prefill]);

  const categoriasPorModo: Record<Modo, CategoriaOpcion[]> = { ingreso: categoriasIngreso, egreso: categoriasEgreso };
  const categorias = categoriasPorModo[modo];
  const tema = TEMAS[modo];
  const categoriaActual = categorias.find((categoria) => categoria.id === categoriaId) ?? null;
  const IconoCategoriaActual = obtenerIcono(categoriaActual?.icono ?? null);

  const previewUrl = useMemo(() => (comprobante && comprobante.type.startsWith("image/") ? URL.createObjectURL(comprobante) : null), [comprobante]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function limpiarFormulario() {
    setCategoriaId(null);
    setMonto("");
    setDescripcion("");
    setComprobante(null);
  }

  function cambiarModo(nuevoModo: Modo) {
    setModo(nuevoModo);
    setCategoriaId(categoriasPorModo[nuevoModo][0]?.id ?? null);
  }

  function abrir(modoInicial: Modo) {
    setModo(modoInicial);
    setCategoriaId(categoriasPorModo[modoInicial][0]?.id ?? null);
    setMonto("");
    setDescripcion("");
    setComprobante(null);
    setAbierto(true);
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
        p_descripcion: descripcion.trim() || null,
        p_comprobante_url: comprobanteUrl,
      });

      if (error) throw error;

      toast.success(modo === "ingreso" ? "Ingreso registrado" : "Gasto registrado");
      setAbierto(false);
      limpiarFormulario();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar el movimiento");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <div className="flex flex-col items-center">
        <button
          type="button"
          disabled={deshabilitado}
          onClick={() => abrir("ingreso")}
          aria-label="Ingreso"
          className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md shadow-gray-200 transition-transform active:scale-[0.94] disabled:opacity-40"
        >
          <CirclePlusIcon className="h-6 w-6 text-emerald-500" />
        </button>
        <span className="text-center text-[10px] leading-tight font-bold text-gray-500">Ingreso</span>
      </div>

      <div className="flex flex-col items-center">
        <button
          type="button"
          disabled={deshabilitado}
          onClick={() => abrir("egreso")}
          aria-label="Gasto"
          className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md shadow-gray-200 transition-transform active:scale-[0.94] disabled:opacity-40"
        >
          <CircleMinusIcon className="h-6 w-6 text-red-600" />
        </button>
        <span className="text-center text-[10px] leading-tight font-bold text-gray-500">Gasto</span>
      </div>

      <Sheet
        open={abierto}
        onOpenChange={(valor) => {
          setAbierto(valor);
          if (!valor) limpiarFormulario();
        }}
      >
        <SheetContent side="bottom" className="gap-0">
          <div className="shrink-0 px-6 pb-4">
            <div className="flex rounded-2xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => cambiarModo("ingreso")}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-gray-400 transition-colors"
                style={modo === "ingreso" ? { backgroundColor: "#fff", color: tema.accent, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : undefined}
              >
                Ingreso
              </button>
              <button
                type="button"
                onClick={() => cambiarModo("egreso")}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-gray-400 transition-colors"
                style={modo === "egreso" ? { backgroundColor: "#fff", color: tema.accent, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : undefined}
              >
                Gasto
              </button>
            </div>
          </div>

          <form
            onSubmit={(evento) => {
              evento.preventDefault();
              registrar();
            }}
            className="flex flex-1 flex-col overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <div className="mb-2 flex flex-col items-center py-4">
              <label className="mb-1 text-xs font-bold text-gray-400 uppercase">Monto</label>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-gray-300">S/</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={monto}
                  onChange={(evento) => setMonto(evento.target.value.replace(/[^0-9.]/g, ""))}
                  className="w-[200px] bg-transparent text-center text-5xl font-bold placeholder:text-gray-300 focus:outline-none"
                  style={{ color: modo === "ingreso" ? tema.accent : "#1f2937" }}
                />
              </div>
            </div>

            <label className="mb-2 block text-xs font-bold text-gray-500 uppercase">Categoría</label>
            <Select value={categoriaId} onValueChange={setCategoriaId}>
              <SelectTrigger className="mb-4 w-full justify-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3" style={{ height: "auto" }}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <IconoCategoriaActual className="h-4 w-4" style={{ color: categoriaActual ? tema.accent : "#6b7280" }} />
                </span>
                <SelectValue placeholder="Elige una categoría" className="flex-1 text-left font-semibold text-gray-800">
                  {(valor: string | null) => categorias.find((categoria) => categoria.id === valor)?.nombre ?? "Elige una categoría"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categorias.map((categoria) => {
                  const Icono = obtenerIcono(categoria.icono);
                  const seleccionada = categoria.id === categoriaId;

                  return (
                    <SelectItem
                      key={categoria.id}
                      value={categoria.id}
                      className="gap-3 border-t border-gray-100 px-4 py-3 first:border-t-0"
                      style={seleccionada ? { backgroundColor: tema.suave, color: tema.accent, fontWeight: 700 } : undefined}
                    >
                      <Icono className="h-5 w-5 shrink-0" style={{ color: seleccionada ? tema.accent : "#6b7280" }} />
                      <span className="flex-1 text-left">{categoria.nombre}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <label className="mb-2 block text-xs font-bold text-gray-500 uppercase">Descripción</label>
            <input
              type="text"
              value={descripcion}
              onChange={(evento) => setDescripcion(evento.target.value)}
              placeholder="Ej. Pago proveedor Lima"
              className="mb-4 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:outline-none"
            />

            <label className="mb-2 block text-xs font-bold text-gray-500 uppercase">Comprobante</label>
            <div className={`mb-6 rounded-2xl border-2 p-4 ${comprobante ? "border-solid border-gray-200 bg-white" : "border-dashed border-gray-300 bg-gray-50"}`}>
              {!comprobante ? (
                <div className="flex flex-col items-center py-3 text-center">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
                    <ReceiptIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="mb-3 text-xs text-gray-500">Adjunta la foto o el archivo del comprobante</p>
                  <div className="flex gap-2">
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-white" style={{ backgroundColor: tema.accent }}>
                      <CameraIcon className="h-3.5 w-3.5" /> Tomar foto
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(evento) => setComprobante(evento.target.files?.[0] ?? null)} />
                    </label>
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-600">
                      <PaperclipIcon className="h-3.5 w-3.5" /> Subir
                      <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(evento) => setComprobante(evento.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewUrl} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <FileTextIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800">{comprobante.name}</p>
                    <p className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <CircleCheckIcon className="h-3 w-3" /> Adjuntado
                    </p>
                  </div>
                  <button type="button" onClick={() => setComprobante(null)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <button type="submit" disabled={enviando} className="w-full rounded-2xl py-4 text-base font-bold text-white shadow-lg disabled:opacity-60" style={{ background: tema.gradiente }}>
              {enviando ? "Guardando..." : "Guardar movimiento"}
            </button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
