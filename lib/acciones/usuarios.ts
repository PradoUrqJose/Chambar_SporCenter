"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { obtenerPerfilActual } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RolGlobal } from "@/lib/roles";
import type { Database } from "@/lib/supabase/database.types";

// asignar_rol_usuario acepta p_rol_global null (encargado de empresa) — el
// generador de tipos no marca nullable los parámetros de función aunque
// Postgres sí lo permita, así que hace falta este cast puntual.
type RolParaRpc = Database["public"]["Enums"]["rol_global"];

// Server Action: no hay window.location.origin disponible (a diferencia de
// recuperar/page.tsx, que corre en el cliente). Se arma el origen desde los
// headers de la petición para que el link de invitación apunte al mismo host
// desde el que se disparó (localhost en dev, el dominio real en producción).
async function obtenerOrigen(): Promise<string> {
  const listaHeaders = await headers();
  const host = listaHeaders.get("host") ?? "localhost:3000";
  const protocolo = listaHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}

type InvitarUsuarioInput = {
  nombre: string;
  email: string;
  rolGlobal: RolGlobal;
  empresaIds: string[];
};

export async function invitarUsuario(input: InvitarUsuarioInput) {
  const perfil = await obtenerPerfilActual();
  if (perfil?.rol_global !== "admin_general") throw new Error("No autorizado");

  const nombre = input.nombre.trim();
  const email = input.email.trim().toLowerCase();

  if (!nombre) throw new Error("El nombre es obligatorio");
  if (!email) throw new Error("El email es obligatorio");
  if (input.rolGlobal === null && input.empresaIds.length !== 1) {
    throw new Error("Un encargado de empresa necesita exactamente una empresa asignada");
  }

  const origen = await obtenerOrigen();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { nombre },
    redirectTo: `${origen}/auth/confirm?next=/actualizar-password`,
  });

  if (error) {
    console.error("invitarUsuario: fallo al invitar por email", error);
    throw new Error(error.message || "No se pudo enviar la invitación (revisa la configuración de SMTP en Supabase)");
  }

  const supabase = await createClient();
  const { error: errorRol } = await supabase.rpc("asignar_rol_usuario", {
    p_usuario_id: data.user.id,
    p_rol_global: input.rolGlobal as RolParaRpc,
    p_empresa_ids: input.rolGlobal === null ? input.empresaIds : [],
  });

  if (errorRol) {
    console.error("invitarUsuario: fallo al asignar rol", errorRol);
    throw new Error(errorRol.message || "No se pudo asignar el rol al usuario invitado");
  }

  revalidatePath("/usuarios");
  revalidatePath("/panel/usuarios");
}

type ActualizarUsuarioInput = {
  rolGlobal: RolGlobal;
  empresaIds: string[];
};

export async function actualizarUsuario(usuarioId: string, input: ActualizarUsuarioInput) {
  const perfil = await obtenerPerfilActual();
  if (perfil?.rol_global !== "admin_general") throw new Error("No autorizado");

  if (input.rolGlobal === null && input.empresaIds.length !== 1) {
    throw new Error("Un encargado de empresa necesita exactamente una empresa asignada");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("asignar_rol_usuario", {
    p_usuario_id: usuarioId,
    p_rol_global: input.rolGlobal as RolParaRpc,
    p_empresa_ids: input.rolGlobal === null ? input.empresaIds : [],
  });

  if (error) {
    console.error("actualizarUsuario: fallo al asignar rol", error);
    throw new Error(error.message || "No se pudo actualizar el usuario");
  }

  revalidatePath("/panel/usuarios");
}

export async function cambiarEstadoUsuario(usuarioId: string, activo: boolean) {
  const perfil = await obtenerPerfilActual();
  if (perfil?.rol_global !== "admin_general") throw new Error("No autorizado");

  const supabase = await createClient();
  const { error } = await supabase.from("perfiles").update({ activo }).eq("id", usuarioId);

  if (error) throw new Error(error.message || "No se pudo cambiar el estado del usuario");
  revalidatePath("/panel/usuarios");
}
