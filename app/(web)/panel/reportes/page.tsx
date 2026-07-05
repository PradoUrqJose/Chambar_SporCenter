import { obtenerPerfilActual } from "@/lib/perfil";
import { fechaLima, limitesDelDia, obtenerEmpresasActivas, obtenerMovimientosReporte } from "@/lib/consultas";
import { ReportesAdminGeneral } from "@/components/web/admin-general/reportes";
import { PlaceholderPanel } from "@/components/web/placeholder-panel";

type Props = {
  searchParams: Promise<{ empresa?: string; desde?: string; hasta?: string }>;
};

export default async function ReportesPanelPage({ searchParams }: Props) {
  const { empresa, desde: desdeParam, hasta: hastaParam } = await searchParams;
  const perfil = await obtenerPerfilActual();

  if (perfil?.rol_global !== "admin_general") {
    return <PlaceholderPanel titulo="Reportes" descripcion="Acá va el contenido de Reportes." />;
  }

  const hoy = fechaLima();
  const desde = desdeParam ?? `${hoy.slice(0, 7)}-01`;
  const hasta = hastaParam ?? hoy;
  const rango = { desde: limitesDelDia(desde).inicio, hasta: limitesDelDia(hasta).fin };

  const [empresas, movimientos] = await Promise.all([
    obtenerEmpresasActivas(),
    obtenerMovimientosReporte(rango, empresa),
  ]);

  return <ReportesAdminGeneral empresas={empresas} movimientos={movimientos} empresaId={empresa} desde={desde} hasta={hasta} />;
}
