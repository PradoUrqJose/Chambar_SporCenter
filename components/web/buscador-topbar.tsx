"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SearchIcon, XIcon, Loader2Icon } from "lucide-react";
import { formatearFecha, formatearMontoPartes } from "@/lib/formato";
import { colorConAlpha } from "@/lib/color";
import { obtenerIcono } from "@/lib/iconos";
import { buscarMovimientosAccion } from "@/lib/acciones/busqueda";
import type { ResultadoBusquedaMovimiento } from "@/lib/consultas";

const CATEGORIA_POR_DEFECTO = "#9ca3af";
const COLOR_INGRESO = "#1f7a4d";
const COLOR_EGRESO = "#dc2626";

// En el servidor no hay navigator, así que arrancamos asumiendo Ctrl F
// (Windows/Linux) y el badge se corrige a ⌘F en el cliente si corresponde —
// de ahí el suppressHydrationWarning, es un mismatch cosmético esperado.
function esMacOS(): boolean {
  return typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac");
}

export function BuscadorTopbar() {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusquedaMovimiento[]>([]);
  const [cargando, setCargando] = useState(false);
  const [abierto, setAbierto] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idBusqueda = useRef(0);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setAbierto(false);
      }
    }
    function onClickFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) setAbierto(false);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onClickFuera);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onClickFuera);
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  function actualizarTexto(valor: string) {
    setTexto(valor);
    setAbierto(true);

    if (temporizador.current) clearTimeout(temporizador.current);

    const textoLimpio = valor.trim();
    if (!textoLimpio) {
      setResultados([]);
      setCargando(false);
      return;
    }

    setCargando(true);
    const idActual = ++idBusqueda.current;

    temporizador.current = setTimeout(async () => {
      const datos = await buscarMovimientosAccion(textoLimpio);
      if (idBusqueda.current !== idActual) return; // respuesta obsoleta, se descarta
      setResultados(datos);
      setCargando(false);
    }, 300);
  }

  function limpiar() {
    setTexto("");
    setResultados([]);
    setCargando(false);
    setAbierto(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={contenedorRef} className="relative max-w-[420px] flex-1">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-[15px] h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        value={texto}
        onChange={(e) => actualizarTexto(e.target.value)}
        onFocus={() => setAbierto(true)}
        placeholder="Buscar por descripción o categoría"
        className="w-full rounded-[14px] border border-border bg-muted py-[13px] pr-4 pl-[44px] text-sm outline-none focus:border-ring focus:bg-card"
      />

      {texto ? (
        <button
          type="button"
          onClick={limpiar}
          aria-label="Limpiar búsqueda"
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <XIcon className="h-4 w-4" />
        </button>
      ) : (
        <span
          suppressHydrationWarning
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-[6px] border border-border bg-card px-[7px] py-[2px] text-xs text-muted-foreground"
        >
          {esMacOS() ? "⌘F" : "Ctrl F"}
        </span>
      )}

      {abierto && texto.trim() && (
        <div className="absolute top-[calc(100%+8px)] left-0 z-20 w-full overflow-hidden rounded-[16px] border border-border bg-card shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
          {cargando ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2Icon className="h-4 w-4 animate-spin" />
              Buscando…
            </div>
          ) : resultados.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Sin movimientos que coincidan.</p>
          ) : (
            <div className="flex max-h-[360px] flex-col overflow-y-auto p-1.5">
              {resultados.map((movimiento) => {
                const Icono = obtenerIcono(movimiento.categoriaIcono);
                const color = movimiento.categoriaColor ?? CATEGORIA_POR_DEFECTO;
                const colorMonto = movimiento.tipo === "ingreso" ? COLOR_INGRESO : COLOR_EGRESO;
                const monto = formatearMontoPartes(movimiento.monto);

                return (
                  <Link
                    key={movimiento.id}
                    href={`/panel/historial?sesion=${movimiento.sesionId}`}
                    onClick={() => setAbierto(false)}
                    className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-muted"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: colorConAlpha(color, 0.12), color }}
                    >
                      <Icono className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold">{movimiento.descripcion || movimiento.categoriaNombre || "Movimiento"}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {movimiento.cajaNombre} · {formatearFecha(movimiento.fecha)}
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-xs font-bold" style={{ color: colorMonto }}>
                      {movimiento.tipo === "ingreso" ? "+" : "-"}S/ {monto.entero}.{monto.decimales}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
