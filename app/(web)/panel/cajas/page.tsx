import { redirect } from "next/navigation";
import { obtenerPerfilActual } from "@/lib/perfil";
import { obtenerCajasEmpresas, obtenerEmpresaAsignada, obtenerSesionesCerradas } from "@/lib/consultas";
import { puedeOperarTodas } from "@/lib/roles";
import { CajasAdminGeneral } from "@/components/web/cajas/cajas";
import { PlaceholderPanel } from "@/components/web/placeholder-panel";

type Props = {
  searchParams: Promise<{ estado?: string }>;
};

export default async function CajasPanelPage({ searchParams }: Props) {
  const { estado } = await searchParams;
  const perfil = await obtenerPerfilActual();

  // admin_general y admin_organizacion: lista org-wide de todas las cajas.
  if (perfil && puedeOperarTodas(perfil.rol_global)) {
    const [cajasEmpresas, sesionesCerradas] = await Promise.all([obtenerCajasEmpresas(), obtenerSesionesCerradas()]);
    const estadoFiltro = estado === "abierta" || estado === "cerrada" ? estado : undefined;

    return <CajasAdminGeneral cajasEmpresas={cajasEmpresas} sesionesCerradas={sesionesCerradas} estadoFiltro={estadoFiltro} />;
  }

  // admin_empresa (rol_global null) solo tiene una caja: sin lista, directo
  // al detalle de su empresa.
  if (perfil && perfil.rol_global === null) {
    const empresaId = await obtenerEmpresaAsignada(perfil.id);
    if (empresaId) redirect(`/panel/cajas/${empresaId}`);
  }

  return <PlaceholderPanel titulo="Cajas" descripcion="Acá va el contenido de Cajas." />;
}
