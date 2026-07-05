import { notFound } from "next/navigation";
import { obtenerPerfilActual } from "@/lib/perfil";
import { obtenerCajaEmpresa, obtenerCategoriasPorTipo, obtenerFlujoSemanal, obtenerMovimientosSemana, obtenerSesionesSemana } from "@/lib/consultas";
import { CajaDetalleAdminOrganizacion } from "@/components/pwa/admin-organizacion/caja-detalle";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CajaEmpresaPage({ params }: Props) {
  const { id } = await params;
  const perfil = await obtenerPerfilActual();

  if (perfil?.rol_global === "admin_organizacion") {
    const caja = await obtenerCajaEmpresa(id);
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
      />
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Caja de empresa</h1>
    </main>
  );
}
