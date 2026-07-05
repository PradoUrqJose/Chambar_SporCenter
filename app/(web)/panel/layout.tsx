import { redirect } from "next/navigation";
import { obtenerPerfilActual } from "@/lib/perfil";
import { SidebarWeb } from "@/components/web/sidebar-web";
import { TopbarWeb } from "@/components/web/topbar-web";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const perfil = await obtenerPerfilActual();

  if (!perfil) redirect("/login");

  return (
    <div className="min-h-screen bg-background p-3 max-[1100px]:p-0">
      <div className="grid h-[calc(100vh-24px)] grid-cols-[250px_1fr] overflow-hidden rounded-[24px] bg-card shadow-[0_30px_80px_rgba(0,0,0,0.10)] max-[1100px]:h-screen max-[1100px]:grid-cols-1 max-[1100px]:rounded-none">
        <SidebarWeb rol={perfil.rol_global} />
        <main className="flex flex-col overflow-hidden">
          <TopbarWeb nombre={perfil.nombre} email={perfil.email} />
          <div className="flex-1 overflow-auto bg-muted pt-[26px] pr-[30px] pb-[34px] pl-[30px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
