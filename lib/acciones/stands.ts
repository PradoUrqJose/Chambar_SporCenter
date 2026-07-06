"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { obtenerPerfilActual } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";

// admin_general y admin_organizacion gestionan cualquier stand (org-wide);
// admin_empresa (rol_global null) solo los de su propia empresa — eso ya lo
// exige la política RLS "gestionar stands" (puede_operar_todas() or
// esta_asignado(empresa_id)), acá solo se descarta a un usuario sin perfil.
async function verificarPuedeGestionarStands() {
  const perfil = await obtenerPerfilActual();
  if (!perfil) throw new Error("No autorizado");
}

type StandInput = {
  nombre: string;
  empresaId: string;
};

export async function crearStand(input: StandInput) {
  await verificarPuedeGestionarStands();
  const nombre = input.nombre.trim();
  if (!nombre) throw new Error("El nombre es obligatorio");
  if (!input.empresaId) throw new Error("Elige una empresa");

  const supabase = await createClient();
  const { error } = await supabase.from("stands").insert({ nombre, empresa_id: input.empresaId });

  if (error) throw new Error(error.message || "No se pudo crear el stand");
  revalidatePath("/panel/stands");
  revalidateTag("stands", { expire: 0 });
}

export async function actualizarStand(id: string, input: StandInput) {
  await verificarPuedeGestionarStands();
  const nombre = input.nombre.trim();
  if (!nombre) throw new Error("El nombre es obligatorio");
  if (!input.empresaId) throw new Error("Elige una empresa");

  const supabase = await createClient();
  const { data, error } = await supabase.from("stands").update({ nombre, empresa_id: input.empresaId }).eq("id", id).select("id");

  if (error) throw new Error(error.message || "No se pudo actualizar el stand");
  if (!data || data.length === 0) throw new Error("No autorizado o el stand ya no existe");
  revalidatePath("/panel/stands");
  revalidateTag("stands", { expire: 0 });
}

export async function cambiarEstadoStand(id: string, activo: boolean) {
  await verificarPuedeGestionarStands();
  const supabase = await createClient();
  const { data, error } = await supabase.from("stands").update({ activo }).eq("id", id).select("id");

  if (error) throw new Error(error.message || "No se pudo cambiar el estado");
  if (!data || data.length === 0) throw new Error("No autorizado o el stand ya no existe");
  revalidatePath("/panel/stands");
  revalidateTag("stands", { expire: 0 });
}
