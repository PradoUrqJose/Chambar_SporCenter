"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { invitarUsuario } from "@/lib/acciones/usuarios";
import { etiquetaRol } from "@/lib/roles";
import type { RolGlobal } from "@/lib/roles";
import type { EmpresaOpcion } from "@/lib/consultas";

type Props = {
  empresas: EmpresaOpcion[];
};

const OPCIONES_ROL: { valor: RolGlobal; etiqueta: string }[] = [
  { valor: "admin_general", etiqueta: etiquetaRol("admin_general") },
  { valor: "admin_organizacion", etiqueta: etiquetaRol("admin_organizacion") },
  { valor: null, etiqueta: etiquetaRol(null) },
];

export function SheetInvitarUsuario({ empresas }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [rolGlobal, setRolGlobal] = useState<RolGlobal>(null);
  const [empresaIds, setEmpresaIds] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  function limpiar() {
    setNombre("");
    setEmail("");
    setRolGlobal(null);
    setEmpresaIds([]);
  }

  function alternarEmpresa(id: string) {
    setEmpresaIds((actual) => (actual.includes(id) ? actual.filter((empresaId) => empresaId !== id) : [...actual, id]));
  }

  async function enviar() {
    if (!nombre.trim() || !email.trim()) {
      toast.error("Completa nombre y email");
      return;
    }

    if (rolGlobal === null && empresaIds.length === 0) {
      toast.error("Elige al menos una empresa para este encargado");
      return;
    }

    setEnviando(true);

    try {
      await invitarUsuario({ nombre, email, rolGlobal, empresaIds });
      toast.success("Invitación enviada");
      limpiar();
      setAbierto(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo invitar al usuario");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg"
        style={{ backgroundColor: "#006d36" }}
      >
        <PlusIcon className="h-4 w-4" /> Invitar usuario
      </button>

      <Sheet
        open={abierto}
        onOpenChange={(valor) => {
          setAbierto(valor);
          if (!valor) limpiar();
        }}
      >
        <SheetContent side="bottom" className="gap-0">
          <div className="flex flex-1 flex-col overflow-y-auto px-6 pt-1 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <h2 className="mb-4 text-center text-lg font-bold text-gray-800">Invitar usuario</h2>

            <label className="mb-2 block text-xs font-bold text-gray-500 uppercase">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              placeholder="Nombre completo"
              className="mb-4 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:outline-none"
            />

            <label className="mb-2 block text-xs font-bold text-gray-500 uppercase">Email</label>
            <input
              type="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              placeholder="correo@ejemplo.com"
              className="mb-4 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:outline-none"
            />

            <label className="mb-2 block text-xs font-bold text-gray-500 uppercase">Rol</label>
            <div className="mb-4 flex flex-col gap-2">
              {OPCIONES_ROL.map((opcion) => (
                <button
                  key={opcion.etiqueta}
                  type="button"
                  onClick={() => setRolGlobal(opcion.valor)}
                  className="rounded-2xl border px-4 py-3 text-left text-sm font-semibold"
                  style={
                    rolGlobal === opcion.valor
                      ? { borderColor: "#006d36", backgroundColor: "#eef9ec", color: "#15803d" }
                      : { borderColor: "#e5e7eb", color: "#374151" }
                  }
                >
                  {opcion.etiqueta}
                </button>
              ))}
            </div>

            {rolGlobal === null && (
              <>
                <label className="mb-2 block text-xs font-bold text-gray-500 uppercase">Empresas asignadas</label>
                <div className="mb-2 flex flex-col gap-2">
                  {empresas.map((empresa) => {
                    const activa = empresaIds.includes(empresa.id);

                    return (
                      <button
                        key={empresa.id}
                        type="button"
                        onClick={() => alternarEmpresa(empresa.id)}
                        className="rounded-2xl border px-4 py-3 text-left text-sm font-semibold"
                        style={activa ? { borderColor: "#006d36", backgroundColor: "#eef9ec", color: "#15803d" } : { borderColor: "#e5e7eb", color: "#374151" }}
                      >
                        {empresa.nombre}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={enviar}
              disabled={enviando}
              className="mt-4 w-full rounded-2xl py-4 text-base font-bold text-white shadow-lg disabled:opacity-60"
              style={{ backgroundColor: "#006d36" }}
            >
              {enviando ? "Enviando..." : "Enviar invitación"}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
