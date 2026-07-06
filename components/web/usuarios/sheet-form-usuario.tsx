"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { actualizarUsuario, cambiarEstadoUsuario, invitarUsuario } from "@/lib/acciones/usuarios";
import { etiquetaRol, type RolGlobal } from "@/lib/roles";
import type { EmpresaOpcion, UsuarioAdmin } from "@/lib/consultas";

type Props = {
  usuario: UsuarioAdmin | null;
  empresas: EmpresaOpcion[];
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
};

const OPCIONES_ROL: { valor: RolGlobal; etiqueta: string }[] = [
  { valor: "admin_general", etiqueta: etiquetaRol("admin_general") },
  { valor: "admin_organizacion", etiqueta: etiquetaRol("admin_organizacion") },
  { valor: null, etiqueta: etiquetaRol(null) },
];

export function SheetFormUsuario({ usuario, empresas, abierto, onOpenChange }: Props) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [rolGlobal, setRolGlobal] = useState<RolGlobal>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [activo, setActivo] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [abiertoAnterior, setAbiertoAnterior] = useState(abierto);
  const router = useRouter();

  if (abierto !== abiertoAnterior) {
    setAbiertoAnterior(abierto);
    if (abierto) {
      setNombre(usuario?.nombre ?? "");
      setEmail(usuario?.email ?? "");
      setRolGlobal(usuario?.rolGlobal ?? null);
      setEmpresaId(usuario?.empresaIdsAsignadas?.[0] ?? null);
      setActivo(usuario?.activo ?? true);
    }
  }

  async function alternarActivo(valor: boolean) {
    if (!usuario) return;
    setActivo(valor);
    try {
      await cambiarEstadoUsuario(usuario.id, valor);
      router.refresh();
    } catch (error) {
      setActivo(!valor);
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado");
    }
  }

  async function guardar() {
    if (rolGlobal === null && !empresaId) {
      toast.error("Elige la empresa de este encargado");
      return;
    }

    const empresaIds = empresaId ? [empresaId] : [];
    setEnviando(true);

    try {
      if (usuario) {
        await actualizarUsuario(usuario.id, { rolGlobal, empresaIds });
        toast.success("Usuario actualizado");
      } else {
        if (!nombre.trim() || !email.trim()) {
          toast.error("Completa nombre y email");
          setEnviando(false);
          return;
        }
        await invitarUsuario({ nombre, email, rolGlobal, empresaIds });
        toast.success("Invitación enviada");
      }
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el usuario");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>{usuario ? "Editar usuario" : "Invitar usuario"}</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={(evento) => {
            evento.preventDefault();
            guardar();
          }}
          className="flex flex-1 flex-col gap-4 overflow-y-auto p-5"
        >
          {usuario ? (
            <div className="rounded-xl border border-border bg-muted px-3.5 py-2.5">
              <p className="text-sm font-semibold">{usuario.nombre}</p>
              <p className="text-xs text-muted-foreground">{usuario.email}</p>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(evento) => setNombre(evento.target.value)}
                  placeholder="Nombre completo"
                  className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm focus:border-ring focus:bg-card focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm focus:border-ring focus:bg-card focus:outline-none"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Rol</label>
            <div className="flex flex-col gap-2">
              {OPCIONES_ROL.map((opcion) => (
                <button
                  key={opcion.etiqueta}
                  type="button"
                  onClick={() => setRolGlobal(opcion.valor)}
                  className={`rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold transition ${
                    rolGlobal === opcion.valor ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-ring"
                  }`}
                >
                  {opcion.etiqueta}
                </button>
              ))}
            </div>
          </div>

          {rolGlobal === null && (
            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase">Empresa asignada</label>
              <div className="flex flex-col gap-2">
                {empresas.map((empresa) => (
                  <button
                    key={empresa.id}
                    type="button"
                    onClick={() => setEmpresaId(empresa.id)}
                    className={`rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold transition ${
                      empresaId === empresa.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-ring"
                    }`}
                  >
                    {empresa.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {usuario && (
            <div className="flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5">
              <span className="text-sm font-semibold">Usuario activo</span>
              <Switch checked={activo} onCheckedChange={alternarActivo} />
            </div>
          )}

          <button type="submit" disabled={enviando} className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
            {enviando ? "Guardando..." : usuario ? "Guardar cambios" : "Enviar invitación"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
