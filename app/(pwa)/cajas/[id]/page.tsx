import { notFound } from "next/navigation";
import { obtenerPerfilActual } from "@/lib/perfil";
import {
  obtenerCajaEmpresa,
  obtenerCategoriasPorTipo,
  obtenerEsperadosPorMedioSesion,
  obtenerFlujoSemanal,
  obtenerMediosPagoActivos,
  obtenerMovimientosSemana,
  obtenerSesionesSemana,
} from "@/lib/consultas";
import { CajaDetalle } from "@/components/pwa/cajas/caja-detalle";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CajaEmpresaPage({ params }: Props) {
  const { id } = await params;
  const perfil = await obtenerPerfilActual();

  if (perfil?.rol_global === "admin_organizacion") {
    const caja = await obtenerCajaEmpresa(id);
    if (!caja) notFound();

    const [flujoSemanal, movimientos, sesionesSemana, categoriasIngreso, categoriasEgreso, mediosPago, esperadosPorMedio] = await Promise.all([
      obtenerFlujoSemanal(caja.cajaId),
      obtenerMovimientosSemana(caja.cajaId),
      obtenerSesionesSemana(caja.cajaId),
      obtenerCategoriasPorTipo("ingreso"),
      obtenerCategoriasPorTipo("egreso"),
      obtenerMediosPagoActivos(),
      caja.sesionAbiertaId ? obtenerEsperadosPorMedioSesion(caja.sesionAbiertaId) : Promise.resolve([]),
    ]);

    return (
      <CajaDetalle
        caja={caja}
        flujoSemanal={flujoSemanal}
        movimientos={movimientos}
        sesionesSemana={sesionesSemana}
        categoriasIngreso={categoriasIngreso}
        categoriasEgreso={categoriasEgreso}
        mediosPago={mediosPago}
        esperadosPorMedio={esperadosPorMedio}
      />
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Caja de empresa</h1>
    </main>
  );
}
