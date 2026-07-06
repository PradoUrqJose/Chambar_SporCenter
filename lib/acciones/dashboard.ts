"use server";

import { obtenerPerfilActual } from "@/lib/perfil";
import { obtenerCajaEmpresa, obtenerEmpresaAsignada, obtenerFlujoSemanal, type FlujoDia } from "@/lib/consultas";
import { puedeOperarTodas } from "@/lib/roles";

// Solo navegación hacia semanas pasadas (estadística de solo lectura para el
// dashboard de admin_general/admin_organizacion/admin_empresa) — sin límite
// superior porque desplazamientoSemanas negativo ya queda bloqueado acá.
//
// admin_empresa nunca manda su cajaId desde el cliente: se resuelve acá a
// partir de su asignación, para que no pueda pedir el flujo de otra caja.
export async function obtenerFlujoSemanalAccion(desplazamientoSemanas: number): Promise<FlujoDia[]> {
  const perfil = await obtenerPerfilActual();
  if (!Number.isInteger(desplazamientoSemanas) || desplazamientoSemanas < 0) {
    throw new Error("Semana inválida");
  }

  if (perfil && puedeOperarTodas(perfil.rol_global)) {
    return obtenerFlujoSemanal(undefined, desplazamientoSemanas);
  }

  if (perfil && perfil.rol_global === null) {
    const empresaId = await obtenerEmpresaAsignada(perfil.id);
    const caja = empresaId ? await obtenerCajaEmpresa(empresaId) : null;
    if (!caja) throw new Error("No autorizado");

    return obtenerFlujoSemanal(caja.cajaId, desplazamientoSemanas);
  }

  throw new Error("No autorizado");
}
