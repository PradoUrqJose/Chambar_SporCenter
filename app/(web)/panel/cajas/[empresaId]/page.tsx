import { notFound } from "next/navigation";
import { obtenerPerfilActual } from "@/lib/perfil";
import {
  obtenerCajaEmpresa,
  obtenerCategoriasPorTipo,
  obtenerFlujoSemanal,
  obtenerMovimientosSemana,
  obtenerSesionesSemana,
  obtenerUrlsComprobantes,
} from "@/lib/consultas";
import { CajaDetalleAdminGeneral } from "@/components/web/admin-general/caja-detalle";
import { PlaceholderPanel } from "@/components/web/placeholder-panel";

type Props = {
  params: Promise<{ empresaId: string }>;
};

export default async function CajaEmpresaPanelPage({ params }: Props) {
  const { empresaId } = await params;
  const perfil = await obtenerPerfilActual();

  if (perfil?.rol_global === "admin_general") {
    const caja = await obtenerCajaEmpresa(empresaId);
    if (!caja) notFound();

    const [flujoSemanal, movimientos, sesionesSemana, categoriasIngreso, categoriasEgreso] = await Promise.all([
      obtenerFlujoSemanal(caja.cajaId),
      obtenerMovimientosSemana(caja.cajaId),
      obtenerSesionesSemana(caja.cajaId),
      obtenerCategoriasPorTipo("ingreso"),
      obtenerCategoriasPorTipo("egreso"),
    ]);

    const rutasComprobantes = movimientos.map((mov) => mov.comprobanteUrl).filter((ruta): ruta is string => ruta !== null);
    const urlsComprobantes = await obtenerUrlsComprobantes(rutasComprobantes);

    return (
      <CajaDetalleAdminGeneral
        caja={caja}
        flujoSemanal={flujoSemanal}
        movimientos={movimientos}
        sesionesSemana={sesionesSemana}
        urlsComprobantes={urlsComprobantes}
        categoriasIngreso={categoriasIngreso}
        categoriasEgreso={categoriasEgreso}
      />
    );
  }

  return <PlaceholderPanel titulo="Caja" descripcion="Acá va el detalle de la caja." />;
}
