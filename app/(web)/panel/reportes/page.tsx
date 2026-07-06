import { obtenerPerfilActual } from "@/lib/perfil";
import { fechaLima, limitesDelDia, obtenerEmpresaAsignada, obtenerEmpresasActivas, obtenerMovimientosReporte } from "@/lib/consultas";
import { puedeOperarTodas } from "@/lib/roles";
import { ReportesAdminGeneral } from "@/components/web/reportes/reportes";
import { PlaceholderPanel } from "@/components/web/placeholder-panel";

type Props = {
  searchParams: Promise<{ empresa?: string; desde?: string; hasta?: string }>;
};

export default async function ReportesPanelPage({ searchParams }: Props) {
  const { empresa, desde: desdeParam, hasta: hastaParam } = await searchParams;
  const perfil = await obtenerPerfilActual();

  const hoy = fechaLima();
  const desde = desdeParam ?? `${hoy.slice(0, 7)}-01`;
  const hasta = hastaParam ?? hoy;
  const rango = { desde: limitesDelDia(desde).inicio, hasta: limitesDelDia(hasta).fin };

  // admin_general y admin_organizacion: reporte org-wide (con filtro por empresa opcional).
  if (perfil && puedeOperarTodas(perfil.rol_global)) {
    const [empresas, movimientos] = await Promise.all([obtenerEmpresasActivas(), obtenerMovimientosReporte(rango, empresa)]);

    return <ReportesAdminGeneral empresas={empresas} movimientos={movimientos} empresaId={empresa} desde={desde} hasta={hasta} />;
  }

  // admin_empresa (rol_global null): mismo reporte, acotado a su propia
  // empresa — el ?empresa= de la URL se ignora, siempre se fuerza la suya.
  if (perfil && perfil.rol_global === null) {
    const empresaId = await obtenerEmpresaAsignada(perfil.id);

    if (empresaId) {
      const [empresas, movimientos] = await Promise.all([obtenerEmpresasActivas(), obtenerMovimientosReporte(rango, empresaId)]);
      const empresaPropia = empresas.filter((e) => e.id === empresaId);

      return <ReportesAdminGeneral empresas={empresaPropia} movimientos={movimientos} empresaId={empresaId} desde={desde} hasta={hasta} />;
    }
  }

  return <PlaceholderPanel titulo="Reportes" descripcion="Acá va el contenido de Reportes." />;
}
