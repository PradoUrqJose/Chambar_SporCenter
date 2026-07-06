"use server";

import { obtenerPerfilActual } from "@/lib/perfil";
import { buscarMovimientos, type ResultadoBusquedaMovimiento } from "@/lib/consultas";

// Sin scoping manual por empresa/caja: la RLS de "movimientos" ya restringe
// las filas visibles al usuario autenticado (ver seguridad_rls.sql), así que
// solo validamos que haya sesión antes de delegar.
export async function buscarMovimientosAccion(texto: string): Promise<ResultadoBusquedaMovimiento[]> {
  const perfil = await obtenerPerfilActual();
  if (!perfil) throw new Error("No autorizado");

  return buscarMovimientos(texto);
}
