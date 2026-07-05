"use server";

import { revalidatePath } from "next/cache";
import { obtenerPerfilActual } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";

async function verificarAdminGeneral() {
  const perfil = await obtenerPerfilActual();
  if (perfil?.rol_global !== "admin_general") throw new Error("No autorizado");
}

type CategoriaInput = {
  nombre: string;
  tipo: "ingreso" | "egreso";
  descripcion: string;
  icono: string;
  color: string;
};

export async function crearCategoria(input: CategoriaInput) {
  await verificarAdminGeneral();
  const nombre = input.nombre.trim();
  if (!nombre) throw new Error("El nombre es obligatorio");

  const supabase = await createClient();
  const { error } = await supabase.from("categorias").insert({
    nombre,
    tipo: input.tipo,
    descripcion: input.descripcion.trim() || null,
    icono: input.icono,
    color: input.color,
  });

  if (error) throw new Error(error.message || "No se pudo crear la categoría");
  revalidatePath("/panel/categorias");
}

export async function actualizarCategoria(id: string, input: CategoriaInput) {
  await verificarAdminGeneral();
  const nombre = input.nombre.trim();
  if (!nombre) throw new Error("El nombre es obligatorio");

  const supabase = await createClient();
  const { error } = await supabase
    .from("categorias")
    .update({
      nombre,
      tipo: input.tipo,
      descripcion: input.descripcion.trim() || null,
      icono: input.icono,
      color: input.color,
    })
    .eq("id", id);

  if (error) throw new Error(error.message || "No se pudo actualizar la categoría");
  revalidatePath("/panel/categorias");
}

export async function cambiarEstadoCategoria(id: string, activa: boolean) {
  await verificarAdminGeneral();
  const supabase = await createClient();
  const { error } = await supabase.from("categorias").update({ activa }).eq("id", id);

  if (error) throw new Error(error.message || "No se pudo cambiar el estado");
  revalidatePath("/panel/categorias");
}
