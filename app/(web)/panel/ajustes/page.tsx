import { redirect } from "next/navigation";
import { obtenerPerfilActual } from "@/lib/perfil";
import { AjustesWeb } from "@/components/web/ajustes";

export default async function AjustesPanelPage() {
  const perfil = await obtenerPerfilActual();

  if (!perfil) redirect("/login");

  return <AjustesWeb perfil={perfil} />;
}
