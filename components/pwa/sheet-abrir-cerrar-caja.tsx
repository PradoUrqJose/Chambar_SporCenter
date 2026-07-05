"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LockIcon, LockOpenIcon, MinusIcon, PlusIcon, XIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { formatearMontoPartes } from "@/lib/formato";

type Props = {
  cajaId: string;
  sesionAbiertaId: string | null;
  abierta: boolean;
  montoReferencia: number;
  color: string;
};

type Denominacion = { valor: number; tipo: "billete" | "moneda" };
type ModoConteo = "denominacion" | "directo";

const DENOMINACIONES: Denominacion[] = [
  { valor: 200, tipo: "billete" },
  { valor: 100, tipo: "billete" },
  { valor: 50, tipo: "billete" },
  { valor: 20, tipo: "billete" },
  { valor: 10, tipo: "billete" },
  { valor: 5, tipo: "moneda" },
  { valor: 2, tipo: "moneda" },
  { valor: 1, tipo: "moneda" },
  { valor: 0.5, tipo: "moneda" },
  { valor: 0.2, tipo: "moneda" },
  { valor: 0.1, tipo: "moneda" },
];

function etiquetaDenominacion(valor: number) {
  return `S/ ${valor % 1 === 0 ? valor : valor.toFixed(2)}`;
}

export function SheetAbrirCerrarCaja({ cajaId, sesionAbiertaId, abierta, montoReferencia, color }: Props) {
  const [sheetAbierto, setSheetAbierto] = useState(false);
  const [montoApertura, setMontoApertura] = useState("");
  const [modoConteo, setModoConteo] = useState<ModoConteo>("denominacion");
  const [filasActivas, setFilasActivas] = useState<number[]>([]);
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [montoDirecto, setMontoDirecto] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  const montoContadoDenominacion = useMemo(
    () => filasActivas.reduce((total, valor) => total + valor * (cantidades[valor] ?? 0), 0),
    [filasActivas, cantidades],
  );
  const montoContado = modoConteo === "denominacion" ? montoContadoDenominacion : Number(montoDirecto) || 0;
  const diferencia = montoContado - montoReferencia;
  const cuadrada = Math.abs(diferencia) < 0.005;
  const disponibles = DENOMINACIONES.filter((d) => !filasActivas.includes(d.valor));

  function abrirSheet() {
    setMontoApertura(montoReferencia > 0 ? montoReferencia.toFixed(2) : "");
    setModoConteo("denominacion");
    setFilasActivas([]);
    setCantidades({});
    setMontoDirecto("");
    setObservaciones("");
    setConfirmando(false);
    setSheetAbierto(true);
  }

  function agregarDenominacion(valor: number) {
    setFilasActivas((actual) => [...actual, valor]);
    setCantidades((actual) => ({ ...actual, [valor]: 1 }));
    setConfirmando(false);
  }

  function quitarDenominacion(valor: number) {
    setFilasActivas((actual) => actual.filter((v) => v !== valor));
    setConfirmando(false);
  }

  function cambiarCantidad(valor: number, delta: number) {
    setCantidades((actual) => ({ ...actual, [valor]: Math.max(0, (actual[valor] ?? 0) + delta) }));
    setConfirmando(false);
  }

  function escribirCantidad(valor: number, texto: string) {
    const limpio = texto.replace(/[^0-9]/g, "");
    setCantidades((actual) => ({ ...actual, [valor]: limpio === "" ? 0 : parseInt(limpio, 10) }));
    setConfirmando(false);
  }

  async function confirmarAbrirCaja() {
    const monto = Number(montoApertura);

    if (Number.isNaN(monto) || monto < 0) {
      toast.error("Ingresa un monto de apertura válido");
      return;
    }

    setEnviando(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.rpc("abrir_caja", {
        p_caja_id: cajaId,
        p_monto_apertura: monto,
        p_observaciones: observaciones.trim() || null,
      });

      if (error) throw error;

      toast.success("Caja abierta");
      setSheetAbierto(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir la caja");
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarCerrarCaja() {
    if (!sesionAbiertaId) return;

    if (!cuadrada && !confirmando) {
      setConfirmando(true);
      return;
    }

    setEnviando(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.rpc("cerrar_caja", {
        p_sesion_id: sesionAbiertaId,
        p_monto_contado: montoContado,
        p_observaciones: observaciones.trim() || null,
      });

      if (error) throw error;

      toast.success("Caja cerrada");
      setSheetAbierto(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cerrar la caja");
    } finally {
      setEnviando(false);
    }
  }

  const montoSugeridoPartes = formatearMontoPartes(montoReferencia);
  const montoContadoPartes = formatearMontoPartes(montoContado);
  const diferenciaPartes = formatearMontoPartes(Math.abs(diferencia));

  return (
    <>
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={abrirSheet}
          aria-label={abierta ? "Cerrar caja" : "Abrir caja"}
          className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md shadow-gray-200 transition-transform active:scale-[0.94]"
        >
          {abierta ? <LockIcon className="h-6 w-6" style={{ color }} /> : <LockOpenIcon className="h-6 w-6" style={{ color }} />}
        </button>
        <span className="text-center text-[10px] leading-tight font-bold text-gray-500">{abierta ? "Cerrar caja" : "Abrir caja"}</span>
      </div>

      <Sheet open={sheetAbierto} onOpenChange={setSheetAbierto}>
        <SheetContent side="bottom" className="gap-0">
          {abierta ? (
            <>
              <div className="shrink-0 px-6 pt-1 pb-4">
                <h2 className="mb-3 text-center text-lg font-bold text-gray-800">Cerrar caja</h2>
                <div className="flex rounded-2xl bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setModoConteo("denominacion")}
                    className="flex-1 rounded-xl py-2.5 text-sm font-bold text-gray-400 transition-colors"
                    style={modoConteo === "denominacion" ? { backgroundColor: "#fff", color, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : undefined}
                  >
                    Contar
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoConteo("directo")}
                    className="flex-1 rounded-xl py-2.5 text-sm font-bold text-gray-400 transition-colors"
                    style={modoConteo === "directo" ? { backgroundColor: "#fff", color, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : undefined}
                  >
                    Directo
                  </button>
                </div>
              </div>

              <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                {modoConteo === "denominacion" ? (
                  <>
                    <p className="mb-3 text-center text-xs text-gray-400">Agrega solo las denominaciones que tengas</p>

                    {filasActivas.length > 0 && (
                      <div className="mb-4 flex flex-col gap-1.5">
                        {DENOMINACIONES.filter((d) => filasActivas.includes(d.valor)).map(({ valor, tipo }) => {
                          const subtotal = formatearMontoPartes(valor * (cantidades[valor] ?? 0));

                          return (
                            <div key={valor} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
                              <span className="w-16 text-sm font-semibold text-gray-700">{etiquetaDenominacion(valor)}</span>
                              <span className="text-[10px] font-medium text-gray-400 uppercase">{tipo}</span>
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => cambiarCantidad(valor, -1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm">
                                  <MinusIcon className="h-3.5 w-3.5" />
                                </button>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={cantidades[valor] ?? 0}
                                  onFocus={(evento) => evento.target.select()}
                                  onChange={(evento) => escribirCantidad(valor, evento.target.value)}
                                  className="w-9 rounded-lg border border-gray-200 bg-white py-1 text-center text-sm font-bold text-gray-800 focus:border-gray-400 focus:outline-none"
                                />
                                <button type="button" onClick={() => cambiarCantidad(valor, 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm">
                                  <PlusIcon className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <span className="w-16 text-right font-mono text-sm text-gray-500">
                                {subtotal.entero}.{subtotal.decimales}
                              </span>
                              <button type="button" onClick={() => quitarDenominacion(valor)} aria-label="Quitar" className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-300">
                                <XIcon className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {disponibles.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 text-xs font-bold text-gray-500 uppercase">Agregar denominación</p>
                        <div className="flex flex-wrap gap-2">
                          {disponibles.map(({ valor }) => (
                            <button
                              key={valor}
                              type="button"
                              onClick={() => agregarDenominacion(valor)}
                              className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 shadow-sm"
                            >
                              <PlusIcon className="h-3 w-3" /> {etiquetaDenominacion(valor)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mb-4 flex flex-col items-center rounded-2xl bg-gray-50 py-4">
                      <span className="text-xs font-bold text-gray-400 uppercase">Monto contado</span>
                      <span className="font-mono text-3xl font-bold text-gray-800">
                        S/ {montoContadoPartes.entero}.{montoContadoPartes.decimales}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="mb-2 flex flex-col items-center py-4">
                    <label className="mb-1 text-xs font-bold text-gray-400 uppercase">Monto contado</label>
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold text-gray-300">S/</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={montoDirecto}
                        onChange={(evento) => {
                          setMontoDirecto(evento.target.value.replace(/[^0-9.]/g, ""));
                          setConfirmando(false);
                        }}
                        className="w-[200px] bg-transparent text-center text-5xl font-bold text-gray-800 placeholder:text-gray-300 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}

                <div className="mb-4 flex flex-col items-center gap-2 py-2">
                  <div
                    className="relative rounded-lg border-4 px-6 py-2 text-center"
                    style={{
                      borderColor: cuadrada ? "#059669" : diferencia < 0 ? "#E7000B" : "#d97706",
                      color: cuadrada ? "#059669" : diferencia < 0 ? "#E7000B" : "#d97706",
                      transform: "rotate(-4deg)",
                    }}
                  >
                    <p className="text-lg font-black tracking-widest uppercase">{cuadrada ? "Cuadrada" : diferencia < 0 ? "Faltante" : "Sobrante"}</p>
                    {!cuadrada && (
                      <p className="font-mono text-sm font-bold">
                        S/ {diferenciaPartes.entero}.{diferenciaPartes.decimales}
                      </p>
                    )}
                  </div>
                </div>

                <label className="mb-2 block text-xs font-bold text-gray-500 uppercase">Observaciones</label>
                <Textarea value={observaciones} onChange={(evento) => setObservaciones(evento.target.value)} placeholder="Opcional" className="mb-6 rounded-2xl border-gray-200 bg-gray-50" />

                <button
                  type="button"
                  onClick={confirmarCerrarCaja}
                  disabled={enviando}
                  className="w-full rounded-2xl py-4 text-base font-bold text-white shadow-lg disabled:opacity-60"
                  style={{ backgroundColor: confirmando ? "#d97706" : "#1f2937" }}
                >
                  {enviando ? "Guardando..." : confirmando ? "¿Seguro? Toca de nuevo para confirmar" : "Cerrar caja"}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <h2 className="mb-4 text-center text-lg font-bold text-gray-800">Abrir caja</h2>

              <div className="mb-2 flex flex-col items-center py-4">
                <label className="mb-1 text-xs font-bold text-gray-400 uppercase">Monto de apertura</label>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold text-gray-300">S/</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={montoApertura}
                    onChange={(evento) => setMontoApertura(evento.target.value.replace(/[^0-9.]/g, ""))}
                    className="w-[200px] bg-transparent text-center text-5xl font-bold text-gray-800 placeholder:text-gray-300 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Sugerido: S/ {montoSugeridoPartes.entero}.{montoSugeridoPartes.decimales} (último cierre)
                </p>
              </div>

              <label className="mb-2 block text-xs font-bold text-gray-500 uppercase">Observaciones</label>
              <Textarea value={observaciones} onChange={(evento) => setObservaciones(evento.target.value)} placeholder="Opcional" className="mb-6 rounded-2xl border-gray-200 bg-gray-50" />

              <button type="button" onClick={confirmarAbrirCaja} disabled={enviando} className="w-full rounded-2xl py-4 text-base font-bold text-white shadow-lg disabled:opacity-60" style={{ backgroundColor: color }}>
                {enviando ? "Guardando..." : "Abrir caja"}
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
