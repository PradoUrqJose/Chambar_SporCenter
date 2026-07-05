import { obtenerPerfilActual } from "@/lib/perfil";
import { obtenerCajasEmpresas, obtenerSesionesCerradas } from "@/lib/consultas";
import { CajasAdminGeneral } from "@/components/web/admin-general/cajas";
import { PlaceholderPanel } from "@/components/web/placeholder-panel";

type Props = {
  searchParams: Promise<{ estado?: string }>;
};

export default async function CajasPanelPage({ searchParams }: Props) {
  const { estado } = await searchParams;
  const perfil = await obtenerPerfilActual();

  if (perfil?.rol_global === "admin_general") {
    const [cajasEmpresas, sesionesCerradas] = await Promise.all([obtenerCajasEmpresas(), obtenerSesionesCerradas()]);
    const estadoFiltro = estado === "abierta" || estado === "cerrada" ? estado : undefined;

    return <CajasAdminGeneral cajasEmpresas={cajasEmpresas} sesionesCerradas={sesionesCerradas} estadoFiltro={estadoFiltro} />;
  }

  return <PlaceholderPanel titulo="Cajas" descripcion="Acá va el contenido de Cajas." />;
}
