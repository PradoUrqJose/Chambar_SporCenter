import { redirect } from "next/navigation";
import { obtenerPerfilActual } from "@/lib/perfil";
import { RedirigirSegunModo } from "@/components/redirigir-segun-modo";

export default async function Home() {
  const perfil = await obtenerPerfilActual();

  if (!perfil) redirect("/login");

  // El encargado de empresa no tiene dashboard propio (ver bottom-nav.tsx) —
  // su pantalla principal es directamente su caja.
  const rutaPwa = perfil.rol_global === null ? "/caja" : "/inicio";
  const rutaWeb = perfil.rol_global === null ? "/panel/caja" : "/panel/inicio";

  // El servidor no puede saber si esto corre como PWA instalada o como
  // navegador de escritorio normal — se resuelve en el cliente (ver
  // RedirigirSegunModo, mismo criterio de matchMedia que app/layout.tsx usa
  // para detectar .pwa-mode).
  return <RedirigirSegunModo rutaPwa={rutaPwa} rutaWeb={rutaWeb} />;
}
