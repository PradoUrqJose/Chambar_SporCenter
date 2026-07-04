import { redirect } from "next/navigation";
import { obtenerPerfilActual } from "@/lib/perfil";

export default async function Home() {
  const perfil = await obtenerPerfilActual();

  if (!perfil) redirect("/login");

  redirect("/inicio");
}
