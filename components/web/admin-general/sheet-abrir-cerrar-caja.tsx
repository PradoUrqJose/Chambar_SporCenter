"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MinusIcon, PlusIcon, XIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { formatearMontoPartes } from "@/lib/formato";

type Props = {
  cajaId: string;
  sesionAbiertaId: string | null;
  abierta: boolean;
  montoReferencia: number;
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
};

type Denominacion = { valor: number; tipo: "billete" | "moneda" };
type ModoConteo = "denominacion" | "directo";

const AZUL = "#2563eb";

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

export function SheetAbrirCerrarCaja({ cajaId, sesionAbiertaId, abierta, montoReferencia, abierto, onOpenChange }: Props) {
  const [montoApertura, setMontoApertura] = useState("");
  const [modoConteo, setModoConteo] = useState<ModoConteo>("denominacion");
  const [filasActivas, setFilasActivas] = useState<number[]>([]);
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [montoDirecto, setMontoDirecto] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!abierto) return;
    setMontoApertura(montoReferencia > 0 ? montoReferencia.toFixed(2) : "");
    setModoConteo("denominacion");
    setFilasActivas([]);
    setCantidades({});
    setMontoDirecto("");
    setObservaciones("");
    setConfirmando(false);
  }, [abierto, montoReferencia]);

  const montoContadoDenominacion = useMemo(
    () => filasActivas.reduce((total, valor) => total + valor * (cantidades[valor] ?? 0), 0),
    [filasActivas, cantidades],
  );
  const montoContado = modoConteo === "denominacion" ? montoContadoDenominacion : Number(montoDirecto) || 0;
  const diferencia = montoContado - montoReferencia;
  const cuadrada = Math.abs(diferencia) < 0.005;
  const disponibles = DENOMINACIONES.filter((d) => !filasActivas.includes(d.valor));

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
      onOpenChange(false);
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
      onOpenChange(false);
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
    <Sheet open={abierto} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>{abierta ? "Cerrar caja" : "Abrir caja"}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5">
          {abierta ? (
            <div className="flex flex-col gap-4">
              <div className="flex rounded-xl bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setModoConteo("denominacion")}
                  className="flex-1 rounded-lg py-2 text-sm font-bold text-muted-foreground transition-colors"
                  style={modoConteo === "denominacion" ? { backgroundColor: "#fff", color: AZUL, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : undefined}
                >
                  Contar
                </button>
                <button
                  type="button"
                  onClick={() => setModoConteo("directo")}
                  className="flex-1 rounded-lg py-2 text-sm font-bold text-muted-foreground transition-colors"
                  style={modoConteo === "directo" ? { backgroundColor: "#fff", color: AZUL, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : undefined}
                >
                  Directo
                </button>
              </div>

              {modoConteo === "denominacion" ? (
                <>
                  {filasActivas.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {DENOMINACIONES.filter((d) => filasActivas.includes(d.valor)).map(({ valor, tipo }) => {
                        const subtotal = formatearMontoPartes(valor * (cantidades[valor] ?? 0));

                        return (
                          <div key={valor} className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2">
                            <span className="w-14 text-sm font-semibold">{etiquetaDenominacion(valor)}</span>
                            <span className="text-[10px] font-medium text-muted-foreground uppercase">{tipo}</span>
                            <div className="flex items-center gap-1.5">
                              <button type="button" onClick={() => cambiarCantidad(valor, -1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm">
                                <MinusIcon className="h-3.5 w-3.5" />
                              </button>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={cantidades[valor] ?? 0}
                                onFocus={(evento) => evento.target.select()}
                                onChange={(evento) => escribirCantidad(valor, evento.target.value)}
                                className="w-9 rounded-lg border border-border bg-card py-1 text-center text-sm font-bold focus:border-ring focus:outline-none"
                              />
                              <button type="button" onClick={() => cambiarCantidad(valor, 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm">
                                <PlusIcon className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="w-16 text-right font-mono text-sm text-muted-foreground">
                              {subtotal.entero}.{subtotal.decimales}
                            </span>
                            <button type="button" onClick={() => quitarDenominacion(valor)} aria-label="Quitar" className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/50">
                              <XIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {disponibles.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-bold text-muted-foreground uppercase">Agregar denominación</p>
                      <div className="flex flex-wrap gap-2">
                        {disponibles.map(({ valor }) => (
                          <button
                            key={valor}
                            type="button"
                            onClick={() => agregarDenominacion(valor)}
                            className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground shadow-sm"
                          >
                            <PlusIcon className="h-3 w-3" /> {etiquetaDenominacion(valor)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col items-center rounded-xl bg-muted py-3.5">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Monto contado</span>
                    <span className="font-mono text-2xl font-bold">
                      S/ {montoContadoPartes.entero}.{montoContadoPartes.decimales}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center py-2">
                  <label className="mb-1 text-xs font-bold text-muted-foreground uppercase">Monto contado</label>
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-bold text-muted-foreground/40">S/</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={montoDirecto}
                      onChange={(evento) => {
                        setMontoDirecto(evento.target.value.replace(/[^0-9.]/g, ""));
                        setConfirmando(false);
                      }}
                      className="w-[160px] bg-transparent text-center text-4xl font-bold placeholder:text-muted-foreground/40 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center gap-2 py-1">
                <div
                  className="relative -rotate-3 rounded-lg border-4 px-5 py-1.5 text-center"
                  style={{
                    borderColor: cuadrada ? "#059669" : diferencia < 0 ? "#E7000B" : "#d97706",
                    color: cuadrada ? "#059669" : diferencia < 0 ? "#E7000B" : "#d97706",
                  }}
                >
                  <p className="text-base font-black tracking-widest uppercase">{cuadrada ? "Cuadrada" : diferencia < 0 ? "Faltante" : "Sobrante"}</p>
                  {!cuadrada && (
                    <p className="font-mono text-xs font-bold">
                      S/ {diferenciaPartes.entero}.{diferenciaPartes.decimales}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Observaciones</label>
                <Textarea value={observaciones} onChange={(evento) => setObservaciones(evento.target.value)} placeholder="Opcional" />
              </div>

              <button
                type="button"
                onClick={confirmarCerrarCaja}
                disabled={enviando}
                className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60"
                style={{ backgroundColor: confirmando ? "#d97706" : AZUL }}
              >
                {enviando ? "Guardando..." : confirmando ? "¿Seguro? Toca de nuevo para confirmar" : "Cerrar caja"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center py-2">
                <label className="mb-1 text-xs font-bold text-muted-foreground uppercase">Monto de apertura</label>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold text-muted-foreground/40">S/</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={montoApertura}
                    onChange={(evento) => setMontoApertura(evento.target.value.replace(/[^0-9.]/g, ""))}
                    className="w-[160px] bg-transparent text-center text-4xl font-bold placeholder:text-muted-foreground/40 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sugerido: S/ {montoSugeridoPartes.entero}.{montoSugeridoPartes.decimales} (último cierre)
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Observaciones</label>
                <Textarea value={observaciones} onChange={(evento) => setObservaciones(evento.target.value)} placeholder="Opcional" />
              </div>

              <button type="button" onClick={confirmarAbrirCaja} disabled={enviando} className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: AZUL }}>
                {enviando ? "Guardando..." : "Abrir caja"}
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
