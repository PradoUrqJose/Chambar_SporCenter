"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LandmarkIcon,
  LayoutDashboardIcon,
  WalletIcon,
  HistoryIcon,
  UsersIcon,
  Building2Icon,
  StoreIcon,
  TagsIcon,
  FileBarChart2Icon,
  SettingsIcon,
  LogOutIcon,
  SmartphoneIcon,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { RolGlobal } from "@/lib/roles";

type NavItem = { href: string; label: string; icon: React.ReactNode };
type NavGroup = { label: string; items: NavItem[] };

const iconProps = { className: "h-[19px] w-[19px]", strokeWidth: 1.9 };

function gruposParaRol(rol: RolGlobal, empresaAsignada: string | null): NavGroup[] {
  switch (rol) {
    case "admin_organizacion":
      // Igual que admin_general, excepto Usuarios (eso sigue siendo
      // exclusivo de admin_general).
      return [
        {
          label: "MENÚ",
          items: [
            { href: "/panel/inicio", label: "Inicio", icon: <LayoutDashboardIcon {...iconProps} /> },
            { href: "/panel/cajas", label: "Cajas", icon: <WalletIcon {...iconProps} /> },
            { href: "/panel/historial", label: "Historial", icon: <HistoryIcon {...iconProps} /> },
          ],
        },
        {
          label: "ADMINISTRACIÓN",
          items: [
            { href: "/panel/empresas", label: "Empresas", icon: <Building2Icon {...iconProps} /> },
            { href: "/panel/stands", label: "Stands", icon: <StoreIcon {...iconProps} /> },
            { href: "/panel/categorias", label: "Categorías", icon: <TagsIcon {...iconProps} /> },
            { href: "/panel/reportes", label: "Reportes", icon: <FileBarChart2Icon {...iconProps} /> },
          ],
        },
      ];
    case "admin_general":
      return [
        {
          label: "MENÚ",
          items: [
            { href: "/panel/inicio", label: "Inicio", icon: <LayoutDashboardIcon {...iconProps} /> },
            { href: "/panel/cajas", label: "Cajas", icon: <WalletIcon {...iconProps} /> },
            { href: "/panel/historial", label: "Historial", icon: <HistoryIcon {...iconProps} /> },
          ],
        },
        {
          label: "ADMINISTRACIÓN",
          items: [
            { href: "/panel/empresas", label: "Empresas", icon: <Building2Icon {...iconProps} /> },
            { href: "/panel/stands", label: "Stands", icon: <StoreIcon {...iconProps} /> },
            { href: "/panel/categorias", label: "Categorías", icon: <TagsIcon {...iconProps} /> },
            { href: "/panel/usuarios", label: "Usuarios", icon: <UsersIcon {...iconProps} /> },
            { href: "/panel/reportes", label: "Reportes", icon: <FileBarChart2Icon {...iconProps} /> },
          ],
        },
      ];
    case null:
      // admin_empresa: mismas vistas de Inicio/Cajas/Historial que admin_general
      // (acotadas a su única empresa/caja) + único CRUD propio: Stands.
      // El link va directo a /panel/cajas/{empresaId} para no pasar por el
      // redirect de /panel/cajas (ida y vuelta al servidor sin necesidad).
      return [
        {
          label: "MENÚ",
          items: [
            { href: "/panel/inicio", label: "Inicio", icon: <LayoutDashboardIcon {...iconProps} /> },
            { href: empresaAsignada ? `/panel/cajas/${empresaAsignada}` : "/panel/cajas", label: "Caja", icon: <WalletIcon {...iconProps} /> },
            { href: "/panel/historial", label: "Historial", icon: <HistoryIcon {...iconProps} /> },
          ],
        },
        {
          label: "ADMINISTRACIÓN",
          items: [
            { href: "/panel/stands", label: "Stands", icon: <StoreIcon {...iconProps} /> },
            { href: "/panel/reportes", label: "Reportes", icon: <FileBarChart2Icon {...iconProps} /> },
          ],
        },
      ];
  }
}

function NavLink({ item, activo }: { item: NavItem; activo: boolean }) {
  return (
    <Link
      href={item.href}
      className={`relative flex items-center gap-[13px] rounded-xl px-[14px] py-[11px] text-[15px] font-semibold transition-colors ${
        activo ? "bg-secondary text-primary" : "text-gray-500 hover:bg-muted hover:text-foreground"
      }`}
    >
      {activo && <span className="absolute top-2 bottom-2 left-[-22px] w-[4px] rounded bg-primary" />}
      {item.icon}
      {item.label}
    </Link>
  );
}

type Props = {
  rol: RolGlobal;
  empresaAsignada: string | null;
};

export function SidebarWeb({ rol, empresaAsignada }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const grupos = gruposParaRol(rol, empresaAsignada);

  async function cerrarSesion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function avisarInstalacion() {
    toast('En tu navegador: menú ⋮ → "Agregar a pantalla de inicio" (o "Instalar app")');
  }

  return (
    <aside className="flex flex-col gap-[26px] overflow-y-auto border-r border-border p-[26px_22px] max-[1100px]:hidden">
      <div className="flex items-center gap-[10px] text-[22px] font-extrabold">
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] bg-primary text-primary-foreground">
          <LandmarkIcon className="h-5 w-5" strokeWidth={2.4} />
        </span>
        Chambar
      </div>

      {grupos.map((grupo) => (
        <div key={grupo.label}>
          <div className="mt-1 mb-[2px] text-[11px] font-bold tracking-[0.12em] text-muted-foreground">
            {grupo.label}
          </div>
          <nav className="flex flex-col gap-1">
            {grupo.items.map((item) => {
              const activo = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return <NavLink key={item.href} item={item} activo={activo} />;
            })}
          </nav>
        </div>
      ))}

      <div>
        <div className="mt-1 mb-[2px] text-[11px] font-bold tracking-[0.12em] text-muted-foreground">GENERAL</div>
        <nav className="flex flex-col gap-1">
          <NavLink
            item={{ href: "/panel/ajustes", label: "Ajustes", icon: <SettingsIcon {...iconProps} /> }}
            activo={pathname === "/panel/ajustes" || pathname.startsWith("/panel/ajustes/")}
          />
          <button
            type="button"
            onClick={cerrarSesion}
            className="flex items-center gap-[13px] rounded-xl px-[14px] py-[11px] text-[15px] font-semibold text-gray-500 hover:bg-muted hover:text-foreground"
          >
            <LogOutIcon {...iconProps} />
            Cerrar sesión
          </button>
        </nav>
      </div>

      <div className="flex-1" />

      <div
        className="relative overflow-hidden rounded-[20px] p-[20px] text-white [@media(max-height:880px)]:p-[14px]"
        style={{ background: "radial-gradient(120% 120% at 20% 10%, #1f8a54 0%, #0c2c1c 70%)" }}
      >
        {/* Versión completa: pantallas con alto de sobra */}
        <div className="[@media(max-height:880px)]:hidden">
          <div className="mb-[14px] flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-white/15">
            <SmartphoneIcon className="h-[18px] w-[18px]" strokeWidth={2} />
          </div>
          <h4 className="mb-1 text-[17px] leading-[1.25]">Usa Chambar desde tu celular</h4>
          <p className="mb-[14px] text-[12px] opacity-80">
            Instálala como app para abrir cajas y registrar movimientos más rápido en el día a día.
          </p>
        </div>

        {/* Versión compacta: pantallas de poco alto (ej. MacBook 14") */}
        <div className="mb-[10px] hidden items-center gap-[10px] [@media(max-height:880px)]:flex">
          <SmartphoneIcon className="h-[16px] w-[16px] shrink-0" strokeWidth={2} />
          <span className="text-[13px] leading-[1.2] font-semibold">Usa Chambar desde tu celular</span>
        </div>

        <button
          type="button"
          onClick={avisarInstalacion}
          className="w-full rounded-xl bg-[#2ecc71] py-[11px] text-sm font-bold text-[#06331d] hover:bg-[#37e07d] [@media(max-height:880px)]:py-[8px] [@media(max-height:880px)]:text-xs"
        >
          Cómo instalar
        </button>
      </div>
    </aside>
  );
}
