"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { obtenerPerfilActual } from "@/lib/perfil";
import { puedeOperarTodas } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

async function verificarPuedeGestionarCategorias() {
  const perfil = await obtenerPerfilActual();
  if (!perfil || !puedeOperarTodas(perfil.rol_global)) throw new Error("No autorizado");
}

type CategoriaInput = {
  nombre: string;
  tipo: "ingreso" | "egreso";
  descripcion: string;
  icono: string;
  color: string;
};

export async function crearCategoria(input: CategoriaInput) {
  await verificarPuedeGestionarCategorias();
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
  revalidateTag("categorias", { expire: 0 });
}

export async function actualizarCategoria(id: string, input: CategoriaInput) {
  await verificarPuedeGestionarCategorias();
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
  revalidateTag("categorias", { expire: 0 });
}

export async function cambiarEstadoCategoria(id: string, activa: boolean) {
  await verificarPuedeGestionarCategorias();
  const supabase = await createClient();
  const { error } = await supabase.from("categorias").update({ activa }).eq("id", id);

  if (error) throw new Error(error.message || "No se pudo cambiar el estado");
  revalidatePath("/panel/categorias");
  revalidateTag("categorias", { expire: 0 });
}
