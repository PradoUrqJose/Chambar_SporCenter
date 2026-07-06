"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRightIcon, InfoIcon, KeyRoundIcon, LogOutIcon, PencilIcon } from "lucide-react";
import { obtenerIniciales } from "@/lib/formato";
import { NOMBRE_ORGANIZACION } from "@/lib/organizacion";
import { etiquetaRol } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";
import { SheetEditarNombre } from "@/components/web/sheet-editar-nombre";
import { SheetCambiarPassword } from "@/components/web/sheet-cambiar-password";
import type { Perfil } from "@/lib/perfil";

const PUNTEADO = {
  backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
  backgroundSize: "12px 12px",
};

type Props = {
  perfil: Perfil;
};

export function AjustesWeb({ perfil }: Props) {
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const router = useRouter();
  const nombre = perfil.nombre ?? "Sin nombre";

  async function cerrarSesion() {
    setCerrandoSesion(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-[18px]">
        <h1 className="text-[32px] font-extrabold">Ajustes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tu cuenta y preferencias.</p>
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] gap-[18px] max-[1100px]:grid-cols-1">
        <section
          className="relative overflow-hidden rounded-[26px] p-8 text-white"
          style={{
            background: "radial-gradient(130% 160% at 15% -20%, rgba(255,255,255,0.22), transparent 55%), linear-gradient(135deg, #1f7a4d 0%, #0a2417 100%)",
          }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-10" style={PUNTEADO} />
          <div className="relative z-10 flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold backdrop-blur-sm">
              {obtenerIniciales(nombre)}
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <p className="truncate text-xl font-bold">{nombre}</p>
              <p className="truncate text-sm text-white/70">{perfil.email}</p>
              <span className="mt-2.5 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{etiquetaRol(perfil.rol_global)}</span>
            </div>
            <button
              type="button"
              onClick={() => setEditandoNombre(true)}
              aria-label="Editar nombre"
              title="Editar nombre"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 transition hover:bg-white/10"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </div>
        </section>

        <div className="flex flex-col gap-[18px]">
          <div className="overflow-hidden rounded-[20px] bg-card shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <button
              type="button"
              onClick={() => setCambiandoPassword(true)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-muted/50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <KeyRoundIcon className="h-[18px] w-[18px]" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold">Seguridad</span>
                <span className="block text-xs text-muted-foreground">Cambiar contraseña</span>
              </span>
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </div>

          <button
            type="button"
            onClick={cerrarSesion}
            disabled={cerrandoSesion}
            className="flex items-center justify-center gap-2 rounded-[20px] bg-destructive/10 py-4 text-sm font-bold text-destructive transition hover:bg-destructive/15 disabled:opacity-60"
          >
            <LogOutIcon className="h-4 w-4" />
            {cerrandoSesion ? "Cerrando sesión..." : "Cerrar sesión"}
          </button>
        </div>
      </div>

      <div className="mt-[18px] rounded-[22px] bg-card p-[22px]">
        <div className="mb-1.5 flex items-center gap-2">
          <InfoIcon className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-bold">Acerca de</p>
        </div>
        <p className="text-xs text-muted-foreground">Chambar — control de caja de {NOMBRE_ORGANIZACION}.</p>
      </div>

      <SheetEditarNombre abierto={editandoNombre} onOpenChange={setEditandoNombre} nombreActual={nombre} />
      <SheetCambiarPassword abierto={cambiandoPassword} onOpenChange={setCambiandoPassword} />
    </div>
  );
}
