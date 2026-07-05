import { notFound } from "next/navigation";
import { obtenerPerfilActual } from "@/lib/perfil";
import { obtenerCajaEmpresa, obtenerCategoriasPorTipo, obtenerEmpresaAsignada, obtenerFlujoSemanal, obtenerMovimientosSemana, obtenerSesionesSemana } from "@/lib/consultas";
import { CajaDetalleAdminOrganizacion } from "@/components/pwa/admin-organizacion/caja-detalle";

export default async function CajaPage() {
  const perfil = await obtenerPerfilActual();

  if (perfil?.rol_global === null) {
    const empresaId = await obtenerEmpresaAsignada(perfil.id);
    if (!empresaId) notFound();

    const caja = await obtenerCajaEmpresa(empresaId);
    if (!caja) notFound();

    const [flujoSemanal, movimientos, sesionesSemana, categoriasIngreso, categoriasEgreso] = await Promise.all([
      obtenerFlujoSemanal(caja.cajaId),
      obtenerMovimientosSemana(caja.cajaId),
      obtenerSesionesSemana(caja.cajaId),
      obtenerCategoriasPorTipo("ingreso"),
      obtenerCategoriasPorTipo("egreso"),
    ]);

    return (
      <CajaDetalleAdminOrganizacion
        caja={caja}
        flujoSemanal={flujoSemanal}
        movimientos={movimientos}
        sesionesSemana={sesionesSemana}
        categoriasIngreso={categoriasIngreso}
        categoriasEgreso={categoriasEgreso}
        nombreUsuario={perfil.nombre ?? undefined}
      />
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Caja</h1>
    </main>
  );
}
