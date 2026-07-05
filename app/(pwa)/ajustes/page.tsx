import { redirect } from "next/navigation";
import { obtenerPerfilActual } from "@/lib/perfil";
import { Ajustes } from "@/components/pwa/ajustes";

export default async function AjustesPage() {
  const perfil = await obtenerPerfilActual();

  if (!perfil) redirect("/login");

  return <Ajustes perfil={perfil} />;
}
