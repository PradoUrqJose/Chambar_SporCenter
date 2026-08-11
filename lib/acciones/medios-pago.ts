"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { obtenerPerfilActual } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";

// Exclusivo de admin_general (a diferencia de categorías, que también
// gestiona admin_organizacion): así lo pidió el usuario.
async function verificarEsAdminGeneral() {
  const perfil = await obtenerPerfilActual();
  if (perfil?.rol_global !== "admin_general") throw new Error("No autorizado");
}

type MedioPagoInput = {
  nombre: string;
  tipo: "tarjeta" | "transferencia";
  descripcion: string;
  icono: string;
  color: string;
};

export async function crearMedioPago(input: MedioPagoInput) {
  await verificarEsAdminGeneral();
  const nombre = input.nombre.trim();
  if (!nombre) throw new Error("El nombre es obligatorio");

  const supabase = await createClient();
  const { error } = await supabase.from("medios_pago").insert({
    nombre,
    tipo: input.tipo,
    descripcion: input.descripcion.trim() || null,
    icono: input.icono,
    color: input.color,
  });

  if (error) throw new Error(error.message || "No se pudo crear el medio de pago");
  revalidatePath("/panel/medios-pago");
  revalidateTag("medios-pago", { expire: 0 });
}

export async function actualizarMedioPago(id: string, input: MedioPagoInput) {
  await verificarEsAdminGeneral();
  const nombre = input.nombre.trim();
  if (!nombre) throw new Error("El nombre es obligatorio");

  const supabase = await createClient();
  const { error } = await supabase
    .from("medios_pago")
    .update({
      nombre,
      tipo: input.tipo,
      descripcion: input.descripcion.trim() || null,
      icono: input.icono,
      color: input.color,
    })
    .eq("id", id);

  if (error) throw new Error(error.message || "No se pudo actualizar el medio de pago");
  revalidatePath("/panel/medios-pago");
  revalidateTag("medios-pago", { expire: 0 });
}

export async function cambiarEstadoMedioPago(id: string, activo: boolean) {
  await verificarEsAdminGeneral();
  const supabase = await createClient();
  const { error } = await supabase.from("medios_pago").update({ activo }).eq("id", id);

  if (error) throw new Error(error.message || "No se pudo cambiar el estado");
  revalidatePath("/panel/medios-pago");
  revalidateTag("medios-pago", { expire: 0 });
}
