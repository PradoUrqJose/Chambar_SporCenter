import { redirect } from "next/navigation";
import { obtenerPerfilActual } from "@/lib/perfil";

export default async function Home() {
  const perfil = await obtenerPerfilActual();

  if (!perfil) redirect("/login");

  // El encargado de empresa no tiene dashboard propio (ver bottom-nav.tsx) —
  // su pantalla principal es directamente su caja.
  redirect(perfil.rol_global === null ? "/caja" : "/inicio");
}
