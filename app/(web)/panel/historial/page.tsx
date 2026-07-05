import { obtenerPerfilActual } from "@/lib/perfil";
import {
  limitesDelDia,
  obtenerCajasFiltro,
  obtenerResumenHistorial,
  obtenerSesionDetalle,
  obtenerSesionesCerradas,
  obtenerUrlsComprobantes,
} from "@/lib/consultas";
import { HistorialAdminGeneral } from "@/components/web/admin-general/historial";
import { PlaceholderPanel } from "@/components/web/placeholder-panel";

type Props = {
  searchParams: Promise<{ caja?: string; desde?: string; hasta?: string; sesion?: string }>;
};

export default async function HistorialPanelPage({ searchParams }: Props) {
  const { caja, desde, hasta, sesion } = await searchParams;
  const perfil = await obtenerPerfilActual();

  if (perfil?.rol_global === "admin_general") {
    const rango = {
      desde: desde ? limitesDelDia(desde).inicio : undefined,
      hasta: hasta ? limitesDelDia(hasta).fin : undefined,
    };

    const [cajasFiltro, sesiones, resumen, sesionDetalle] = await Promise.all([
      obtenerCajasFiltro(),
      obtenerSesionesCerradas(caja, rango),
      obtenerResumenHistorial(caja, rango),
      sesion ? obtenerSesionDetalle(sesion) : Promise.resolve(null),
    ]);

    const rutasComprobantes = (sesionDetalle?.movimientos ?? [])
      .map((movimiento) => movimiento.comprobanteUrl)
      .filter((ruta): ruta is string => ruta !== null);
    const urlsComprobantes = await obtenerUrlsComprobantes(rutasComprobantes);

    return (
      <HistorialAdminGeneral
        cajasFiltro={cajasFiltro}
        sesiones={sesiones}
        resumen={resumen}
        cajaId={caja}
        desde={desde}
        hasta={hasta}
        sesionDetalle={sesionDetalle}
        urlsComprobantes={urlsComprobantes}
      />
    );
  }

  return <PlaceholderPanel titulo="Historial" descripcion="Acá va el contenido de Historial." />;
}
