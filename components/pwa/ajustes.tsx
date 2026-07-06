"use client";

import { useState } from "react";
import { KeyRoundIcon, PencilIcon, InfoIcon, ChevronRightIcon } from "lucide-react";
import { obtenerIniciales } from "@/lib/formato";
import { NOMBRE_ORGANIZACION } from "@/lib/organizacion";
import { etiquetaRol } from "@/lib/roles";
import { BotonCerrarSesion } from "@/components/boton-cerrar-sesion";
import { SheetEditarNombre } from "@/components/pwa/sheet-editar-nombre";
import { SheetCambiarPassword } from "@/components/pwa/sheet-cambiar-password";
import type { Perfil } from "@/lib/perfil";

type Props = {
  perfil: Perfil;
};

export function Ajustes({ perfil }: Props) {
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const nombre = perfil.nombre ?? "Sin nombre";

  return (
    <div className="flex flex-col gap-3 px-5 py-3 pb-8">
      <header className="px-1 pt-3 pb-2">
        <h1 className="text-2xl font-bold text-gray-800">Ajustes</h1>
        <p className="text-base font-medium text-gray-400">{etiquetaRol(perfil.rol_global)}</p>
      </header>

      <section className="rounded-2xl border border-gray-50 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#eef9ec] text-lg font-bold text-green-700">
            {obtenerIniciales(nombre)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-gray-800">{nombre}</p>
            <p className="truncate text-sm text-gray-400">{perfil.email}</p>
          </div>
          <button
            type="button"
            onClick={() => setEditandoNombre(true)}
            aria-label="Editar nombre"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-500"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-50 bg-white shadow-sm">
        <button type="button" onClick={() => setCambiandoPassword(true)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-500">
            <KeyRoundIcon className="h-4 w-4" />
          </div>
          <span className="flex-1 text-sm font-semibold text-gray-700">Cambiar contraseña</span>
          <ChevronRightIcon className="h-4 w-4 text-gray-300" />
        </button>
      </section>

      <section className="rounded-2xl border border-gray-50 bg-white p-4 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <InfoIcon className="h-4 w-4 text-gray-400" />
          <p className="text-sm font-bold text-gray-800">Acerca de</p>
        </div>
        <p className="text-xs text-gray-400">Chambar — control de caja de {NOMBRE_ORGANIZACION}</p>
      </section>

      <div className="mt-2">
        <BotonCerrarSesion />
      </div>

      <SheetEditarNombre abierto={editandoNombre} onOpenChange={setEditandoNombre} nombreActual={nombre} />
      <SheetCambiarPassword abierto={cambiandoPassword} onOpenChange={setCambiandoPassword} />
    </div>
  );
}
