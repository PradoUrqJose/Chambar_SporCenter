"use client";

import { useEffect, useRef } from "react";
import { SearchIcon } from "lucide-react";
import { obtenerIniciales } from "@/lib/formato";

type Props = {
  nombre: string | null;
  email: string | null;
};

export function TopbarWeb({ nombre, email }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const nombreMostrado = nombre ?? email ?? "Usuario";

  return (
    <header className="flex items-center gap-[18px] border-b border-border px-[30px] py-[22px]">
      <div className="relative max-w-[420px] flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-[15px] h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          placeholder="Buscar"
          className="w-full rounded-[14px] border border-border bg-muted py-[13px] pr-4 pl-[44px] text-sm outline-none focus:border-ring focus:bg-card"
        />
        <span className="absolute top-1/2 right-3 -translate-y-1/2 rounded-[6px] border border-border bg-card px-[7px] py-[2px] text-xs text-muted-foreground">
          ⌘F
        </span>
      </div>

      <div className="ml-auto flex items-center gap-[11px]">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
          {obtenerIniciales(nombreMostrado)}
        </div>
        <div>
          <div className="text-sm font-bold">{nombreMostrado}</div>
          {email && <div className="text-xs text-muted-foreground">{email}</div>}
        </div>
      </div>
    </header>
  );
}
