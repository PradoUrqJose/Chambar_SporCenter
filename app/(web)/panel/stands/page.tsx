import { obtenerPerfilActual } from "@/lib/perfil";
import { obtenerEmpresasActivas, obtenerStandsAdmin } from "@/lib/consultas";
import { StandsAdminGeneral } from "@/components/web/admin-general/stands";
import { PlaceholderPanel } from "@/components/web/placeholder-panel";

export default async function StandsPanelPage() {
  const perfil = await obtenerPerfilActual();

  if (perfil?.rol_global === "admin_general") {
    const [stands, empresas] = await Promise.all([obtenerStandsAdmin(), obtenerEmpresasActivas()]);
    return <StandsAdminGeneral stands={stands} empresas={empresas} />;
  }

  return <PlaceholderPanel titulo="Stands" descripcion="Acá va la gestión de Stands (crear, editar, por empresa)." />;
}
