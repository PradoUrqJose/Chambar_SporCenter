"use server";

import { revalidatePath } from "next/cache";
import { obtenerPerfilActual } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";

async function verificarAdminGeneral() {
  const perfil = await obtenerPerfilActual();
  if (perfil?.rol_global !== "admin_general") throw new Error("No autorizado");
}

type EmpresaInput = {
  nombre: string;
  ruc: string;
  color: string;
};

export async function crearEmpresa(input: EmpresaInput) {
  await verificarAdminGeneral();
  const nombre = input.nombre.trim();
  if (!nombre) throw new Error("El nombre es obligatorio");

  const supabase = await createClient();
  const { error } = await supabase.from("empresas").insert({
    nombre,
    ruc: input.ruc.trim() || null,
    color: input.color,
  });

  if (error) throw new Error(error.message || "No se pudo crear la empresa");
  revalidatePath("/panel/empresas");
}

export async function actualizarEmpresa(id: string, input: EmpresaInput) {
  await verificarAdminGeneral();
  const nombre = input.nombre.trim();
  if (!nombre) throw new Error("El nombre es obligatorio");

  const supabase = await createClient();
  const { error } = await supabase
    .from("empresas")
    .update({ nombre, ruc: input.ruc.trim() || null, color: input.color })
    .eq("id", id);

  if (error) throw new Error(error.message || "No se pudo actualizar la empresa");
  revalidatePath("/panel/empresas");
}

export async function cambiarEstadoEmpresa(id: string, activa: boolean) {
  await verificarAdminGeneral();
  const supabase = await createClient();
  const { error } = await supabase.from("empresas").update({ activa }).eq("id", id);

  if (error) throw new Error(error.message || "No se pudo cambiar el estado");
  revalidatePath("/panel/empresas");
}
