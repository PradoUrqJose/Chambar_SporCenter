import { redirect } from "next/navigation";
import { obtenerPerfilActual } from "@/lib/perfil";
import { BottomNav } from "@/components/pwa/bottom-nav";

export default async function PwaLayout({ children }: { children: React.ReactNode }) {
  const perfil = await obtenerPerfilActual();

  if (!perfil) redirect("/login");

  return (
    <div className="pt-safe flex min-h-screen flex-col">
      <main className="flex-1 pb-28">{children}</main>
      <BottomNav rol={perfil.rol_global} />
    </div>
  );
}
