"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  rutaPwa: string;
  rutaWeb: string;
};

// El script bloqueante en <head> (ver SCRIPT_DETECCION_PWA en app/layout.tsx)
// solo se ejecuta en una carga dura del documento — un <script> insertado por
// React vía dangerouslySetInnerHTML durante una navegación cliente (router.push)
// nunca corre, porque el DOM lo inserta con innerHTML y el navegador no
// ejecuta <script> insertados así. Por eso esto es un componente cliente con
// useEffect (código real, no un tag de script), que sí corre en cualquier
// tipo de navegación.
export function RedirigirSegunModo({ rutaPwa, rutaWeb }: Props) {
  const router = useRouter();

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const esStandalone = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
    router.replace(esStandalone ? rutaPwa : rutaWeb);
  }, [router, rutaPwa, rutaWeb]);

  return null;
}
