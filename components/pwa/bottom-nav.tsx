"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RolGlobal } from "@/lib/roles";

type Tab = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const TAB_INICIO: Tab = {
  href: "/inicio",
  label: "Inicio",
  icon: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
      />
    </svg>
  ),
};

const TAB_CAJAS: Tab = {
  href: "/cajas",
  label: "Cajas",
  icon: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
    </svg>
  ),
};

const TAB_CAJA: Tab = {
  href: "/caja",
  label: "Caja",
  icon: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
    </svg>
  ),
};

const TAB_HISTORIAL: Tab = {
  href: "/historial",
  label: "Historial",
  icon: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zM3 12a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
      />
    </svg>
  ),
};

const TAB_USUARIOS: Tab = {
  href: "/usuarios",
  label: "Usuarios",
  icon: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M7 9a3 3 0 100-6 3 3 0 000 6zM14 9a3 3 0 100-6 3 3 0 000 6zM3.5 17a3.5 3.5 0 117 0v.25c0 .414-.336.75-.75.75h-5.5a.75.75 0 01-.75-.75V17zM11.5 17.25V17a3.48 3.48 0 00-.7-2.1c.267-.06.55-.09.85-.09a3.5 3.5 0 013.5 3.5v.25c0 .414-.336.75-.75.75h-2.9a.75.75 0 00.5-.71v-.3z" />
    </svg>
  ),
};

const TAB_AJUSTES: Tab = {
  href: "/ajustes",
  label: "Ajustes",
  icon: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
      />
    </svg>
  ),
};

function tabsParaRol(rol: RolGlobal): Tab[] {
  switch (rol) {
    case "admin_organizacion":
      return [TAB_INICIO, TAB_CAJAS, TAB_HISTORIAL, TAB_AJUSTES];
    case "admin_general":
      return [TAB_INICIO, TAB_USUARIOS, TAB_AJUSTES];
    case null:
      // Encargado de empresa: sin dashboard propio, solo su caja/historial/ajustes.
      return [TAB_CAJA, TAB_HISTORIAL, TAB_AJUSTES];
  }
}

type Props = {
  rol: RolGlobal;
};

export function BottomNav({ rol }: Props) {
  const pathname = usePathname();
  const tabs = tabsParaRol(rol);

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 mx-auto flex w-full max-w-100 items-center justify-between rounded-t-3xl border-t border-gray-100 bg-white/95 px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg backdrop-blur">
      {tabs.map((tab) => {
        const activo = pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        return (
          <Link key={tab.href} href={tab.href} aria-label={tab.label} className={`flex h-16 w-16 items-center justify-center rounded-2xl ${activo ? "bg-[#eef9ec] text-green-700" : "text-gray-300"}`}>
            {tab.icon}
          </Link>
        );
      })}
    </nav>
  );
}
