"use server";

import { revalidatePath } from "next/cache";
import { obtenerPerfilActual } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";

async function verificarAdminGeneral() {
  const perfil = await obtenerPerfilActual();
  if (perfil?.rol_global !== "admin_general") throw new Error("No autorizado");
}

type StandInput = {
  nombre: string;
  empresaId: string;
};

export async function crearStand(input: StandInput) {
  await verificarAdminGeneral();
  const nombre = input.nombre.trim();
  if (!nombre) throw new Error("El nombre es obligatorio");
  if (!input.empresaId) throw new Error("Elige una empresa");

  const supabase = await createClient();
  const { error } = await supabase.from("stands").insert({ nombre, empresa_id: input.empresaId });

  if (error) throw new Error(error.message || "No se pudo crear el stand");
  revalidatePath("/panel/stands");
}

export async function actualizarStand(id: string, input: StandInput) {
  await verificarAdminGeneral();
  const nombre = input.nombre.trim();
  if (!nombre) throw new Error("El nombre es obligatorio");
  if (!input.empresaId) throw new Error("Elige una empresa");

  const supabase = await createClient();
  const { error } = await supabase.from("stands").update({ nombre, empresa_id: input.empresaId }).eq("id", id);

  if (error) throw new Error(error.message || "No se pudo actualizar el stand");
  revalidatePath("/panel/stands");
}

export async function cambiarEstadoStand(id: string, activo: boolean) {
  await verificarAdminGeneral();
  const supabase = await createClient();
  const { error } = await supabase.from("stands").update({ activo }).eq("id", id);

  if (error) throw new Error(error.message || "No se pudo cambiar el estado");
  revalidatePath("/panel/stands");
}
