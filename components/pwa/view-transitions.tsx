"use client";

import { createContext, startTransition, useContext, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

type ContextoTransicion = {
  registrarResolver: (resolver: () => void) => void;
};

const TransicionContext = createContext<ContextoTransicion | null>(null);

// El resolver queda pendiente hasta que este provider se vuelve a renderizar
// con un pathname distinto — ese commit es la señal real de "la página nueva
// ya está en el DOM", a diferencia de un setTimeout/rAF a ciegas.
export function ProveedorTransicionesPwa({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const resolverRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    resolverRef.current?.();
    resolverRef.current = null;
  }, [pathname]);

  function registrarResolver(resolver: () => void) {
    resolverRef.current = resolver;
  }

  return <TransicionContext.Provider value={{ registrarResolver }}>{children}</TransicionContext.Provider>;
}

export function useNavegarConTransicion() {
  const router = useRouter();
  const contexto = useContext(TransicionContext);

  return function navegar(href: string) {
    const prefiereMenosMovimiento = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!contexto || prefiereMenosMovimiento || typeof document === "undefined" || !("startViewTransition" in document)) {
      router.push(href);
      return;
    }

    document.startViewTransition(() => {
      return new Promise<void>((resolve) => {
        contexto.registrarResolver(resolve);
        startTransition(() => {
          router.push(href);
        });
      });
    });
  };
}
