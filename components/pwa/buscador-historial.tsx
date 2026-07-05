"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";

export function BuscadorHistorial() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [texto, setTexto] = useState(searchParams.get("q") ?? "");
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (temporizador.current) clearTimeout(temporizador.current);
  }, []);

  function actualizarTexto(valor: string) {
    setTexto(valor);

    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (valor.trim()) params.set("q", valor.trim());
      else params.delete("q");
      router.replace(`/historial?${params.toString()}`);
    }, 300);
  }

  return (
    <div className="mb-2 flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <SearchIcon className="h-4 w-4 shrink-0 text-gray-400" />
      <input
        type="text"
        value={texto}
        onChange={(evento) => actualizarTexto(evento.target.value)}
        placeholder="Buscar por descripción..."
        className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
      />
      {texto && (
        <button type="button" onClick={() => actualizarTexto("")} aria-label="Limpiar búsqueda" className="shrink-0 text-gray-300">
          <XIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
