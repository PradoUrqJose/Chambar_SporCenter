import { obtenerPerfilActual } from "@/lib/perfil";
import {
  limitesDelDia,
  obtenerCajaEmpresa,
  obtenerCajasFiltro,
  obtenerEmpresaAsignada,
  obtenerResumenHistorial,
  obtenerSesionDetalle,
  obtenerSesionesCerradas,
  obtenerUrlsComprobantes,
} from "@/lib/consultas";
import { puedeOperarTodas } from "@/lib/roles";
import { HistorialAdminGeneral } from "@/components/web/historial/historial";
import { PlaceholderPanel } from "@/components/web/placeholder-panel";

type Props = {
  searchParams: Promise<{ caja?: string; desde?: string; hasta?: string; sesion?: string }>;
};

export default async function HistorialPanelPage({ searchParams }: Props) {
  const { caja, desde, hasta, sesion } = await searchParams;
  const perfil = await obtenerPerfilActual();

  // admin_general y admin_organizacion: historial org-wide (con filtro por caja opcional).
  if (perfil && puedeOperarTodas(perfil.rol_global)) {
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

  // admin_empresa (rol_global null): mismo historial, pero siempre acotado a
  // su propia caja — el ?caja= de la URL se ignora a propósito, nunca se
  // confía en él para decidir qué caja mostrar.
  if (perfil && perfil.rol_global === null) {
    const empresaId = await obtenerEmpresaAsignada(perfil.id);
    const cajaPropia = empresaId ? await obtenerCajaEmpresa(empresaId) : null;

    if (!cajaPropia) {
      return <PlaceholderPanel titulo="Historial" descripcion="No tienes una empresa asignada todavía." />;
    }

    const rango = {
      desde: desde ? limitesDelDia(desde).inicio : undefined,
      hasta: hasta ? limitesDelDia(hasta).fin : undefined,
    };

    const [sesiones, resumen, sesionDetalle] = await Promise.all([
      obtenerSesionesCerradas(cajaPropia.cajaId, rango),
      obtenerResumenHistorial(cajaPropia.cajaId, rango),
      sesion ? obtenerSesionDetalle(sesion) : Promise.resolve(null),
    ]);

    const rutasComprobantes = (sesionDetalle?.movimientos ?? [])
      .map((movimiento) => movimiento.comprobanteUrl)
      .filter((ruta): ruta is string => ruta !== null);
    const urlsComprobantes = await obtenerUrlsComprobantes(rutasComprobantes);

    return (
      <HistorialAdminGeneral
        cajasFiltro={[{ id: cajaPropia.cajaId, nombre: cajaPropia.nombre, color: cajaPropia.color }]}
        sesiones={sesiones}
        resumen={resumen}
        cajaId={cajaPropia.cajaId}
        desde={desde}
        hasta={hasta}
        sesionDetalle={sesionDetalle}
        urlsComprobantes={urlsComprobantes}
      />
    );
  }

  return <PlaceholderPanel titulo="Historial" descripcion="Acá va el contenido de Historial." />;
}
