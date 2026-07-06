"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BankIcon,
  SquaresFourIcon,
  WalletIcon,
  ClockCounterClockwiseIcon as HistoryIcon,
  UsersIcon,
  BuildingsIcon,
  StorefrontIcon,
  TagIcon,
  ChartBarIcon,
  GearIcon,
  SignOutIcon,
  DeviceMobileIcon,
  type Icon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { RolGlobal } from "@/lib/roles";

type NavItem = { href: string; label: string; icon: Icon };
type NavGroup = { label: string; items: NavItem[] };

const iconProps = { className: "h-[19px] w-[19px]" };

function gruposParaRol(rol: RolGlobal, empresaAsignada: string | null): NavGroup[] {
  switch (rol) {
    case "admin_organizacion":
      // Igual que admin_general, excepto Usuarios (eso sigue siendo
      // exclusivo de admin_general).
      return [
        {
          label: "MENÚ",
          items: [
            { href: "/panel/inicio", label: "Inicio", icon: SquaresFourIcon },
            { href: "/panel/cajas", label: "Cajas", icon: WalletIcon },
            { href: "/panel/historial", label: "Historial", icon: HistoryIcon },
          ],
        },
        {
          label: "ADMINISTRACIÓN",
          items: [
            { href: "/panel/empresas", label: "Empresas", icon: BuildingsIcon },
            { href: "/panel/stands", label: "Stands", icon: StorefrontIcon },
            { href: "/panel/categorias", label: "Categorías", icon: TagIcon },
            { href: "/panel/reportes", label: "Reportes", icon: ChartBarIcon },
          ],
        },
      ];
    case "admin_general":
      return [
        {
          label: "MENÚ",
          items: [
            { href: "/panel/inicio", label: "Inicio", icon: SquaresFourIcon },
            { href: "/panel/cajas", label: "Cajas", icon: WalletIcon },
            { href: "/panel/historial", label: "Historial", icon: HistoryIcon },
          ],
        },
        {
          label: "ADMINISTRACIÓN",
          items: [
            { href: "/panel/empresas", label: "Empresas", icon: BuildingsIcon },
            { href: "/panel/stands", label: "Stands", icon: StorefrontIcon },
            { href: "/panel/categorias", label: "Categorías", icon: TagIcon },
            { href: "/panel/usuarios", label: "Usuarios", icon: UsersIcon },
            { href: "/panel/reportes", label: "Reportes", icon: ChartBarIcon },
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
            { href: "/panel/inicio", label: "Inicio", icon: SquaresFourIcon },
            { href: empresaAsignada ? `/panel/cajas/${empresaAsignada}` : "/panel/cajas", label: "Caja", icon: WalletIcon },
            { href: "/panel/historial", label: "Historial", icon: HistoryIcon },
          ],
        },
        {
          label: "ADMINISTRACIÓN",
          items: [
            { href: "/panel/stands", label: "Stands", icon: StorefrontIcon },
            { href: "/panel/reportes", label: "Reportes", icon: ChartBarIcon },
          ],
        },
      ];
  }
}

function NavLink({ item, activo, onRef }: { item: NavItem; activo: boolean; onRef: (href: string, el: HTMLAnchorElement | null) => void }) {
  const Icono = item.icon;

  return (
    <Link
      ref={(el) => onRef(item.href, el)}
      href={item.href}
      className={`flex items-center gap-[13px] rounded-xl px-[14px] py-[11px] text-[15px] font-semibold transition-colors ${
        activo ? "bg-secondary text-primary" : "text-gray-500 hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icono {...iconProps} weight={activo ? "fill" : "regular"} className={`${iconProps.className} transition-colors`} />
      {item.label}
    </Link>
  );
}

type Props = {
  rol: RolGlobal;
  empresaAsignada: string | null;
};

const AJUSTES_HREF = "/panel/ajustes";

function estaActivo(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarWeb({ rol, empresaAsignada }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const grupos = gruposParaRol(rol, empresaAsignada);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [indicador, setIndicador] = useState<{ top: number; height: number } | null>(null);

  function registrarRef(href: string, el: HTMLAnchorElement | null) {
    if (el) linkRefs.current.set(href, el);
    else linkRefs.current.delete(href);
  }

  // Barra deslizante que sigue al item activo (sin importar en qué grupo
  // esté): mide la posición real del <Link> activo contra el contenedor
  // compartido, así funciona con la lista de items variable por rol.
  useLayoutEffect(() => {
    function reposicionar() {
      const hrefActivo = [...linkRefs.current.keys()].find((href) => estaActivo(pathname, href));
      const wrapper = wrapperRef.current;
      const link = hrefActivo ? linkRefs.current.get(hrefActivo) : null;

      if (!wrapper || !link) {
        setIndicador(null);
        return;
      }

      const wrapperRect = wrapper.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      setIndicador({ top: linkRect.top - wrapperRect.top + 2, height: linkRect.height - 4 });
    }

    reposicionar();
    window.addEventListener("resize", reposicionar);
    return () => window.removeEventListener("resize", reposicionar);
  }, [pathname, rol]);

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
          <BankIcon className="h-5 w-5" weight="bold" />
        </span>
        Chambar
      </div>

      <div ref={wrapperRef} className="relative flex flex-col gap-[26px]">
        {indicador && (
          <span
            className="absolute left-[-22px] w-[4px] rounded bg-primary shadow-[0_0_10px_var(--color-primary)] transition-all duration-300 ease-out"
            style={{ top: indicador.top, height: indicador.height }}
          />
        )}

        {grupos.map((grupo) => (
          <div key={grupo.label}>
            <div className="mt-1 mb-[2px] text-[11px] font-bold tracking-[0.12em] text-muted-foreground">
              {grupo.label}
            </div>
            <nav className="flex flex-col gap-1">
              {grupo.items.map((item) => (
                <NavLink key={item.href} item={item} activo={estaActivo(pathname, item.href)} onRef={registrarRef} />
              ))}
            </nav>
          </div>
        ))}

        <div>
          <div className="mt-1 mb-[2px] text-[11px] font-bold tracking-[0.12em] text-muted-foreground">GENERAL</div>
          <nav className="flex flex-col gap-1">
            <NavLink
              item={{ href: AJUSTES_HREF, label: "Ajustes", icon: GearIcon }}
              activo={estaActivo(pathname, AJUSTES_HREF)}
              onRef={registrarRef}
            />
            <button
              type="button"
              onClick={cerrarSesion}
              className="flex items-center gap-[13px] rounded-xl px-[14px] py-[11px] text-[15px] font-semibold text-gray-500 hover:bg-muted hover:text-foreground"
            >
              <SignOutIcon {...iconProps} />
              Cerrar sesión
            </button>
          </nav>
        </div>
      </div>

      <div className="flex-1" />

      <div
        className="relative overflow-hidden rounded-[20px] p-[20px] text-white [@media(max-height:880px)]:p-[14px]"
        style={{ background: "radial-gradient(120% 120% at 20% 10%, #1f8a54 0%, #0c2c1c 70%)" }}
      >
        {/* Versión completa: pantallas con alto de sobra */}
        <div className="[@media(max-height:880px)]:hidden">
          <div className="mb-[14px] flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-white/15">
            <DeviceMobileIcon className="h-[18px] w-[18px]" weight="bold" />
          </div>
          <h4 className="mb-1 text-[17px] leading-[1.25]">Usa Chambar desde tu celular</h4>
          <p className="mb-[14px] text-[12px] opacity-80">
            Instálala como app para abrir cajas y registrar movimientos más rápido en el día a día.
          </p>
        </div>

        {/* Versión compacta: pantallas de poco alto (ej. MacBook 14") */}
        <div className="mb-[10px] hidden items-center gap-[10px] [@media(max-height:880px)]:flex">
          <DeviceMobileIcon className="h-[16px] w-[16px] shrink-0" weight="bold" />
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
