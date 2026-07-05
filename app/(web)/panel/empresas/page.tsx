import { obtenerPerfilActual } from "@/lib/perfil";
import { obtenerEmpresasAdmin } from "@/lib/consultas";
import { EmpresasAdminGeneral } from "@/components/web/admin-general/empresas";
import { PlaceholderPanel } from "@/components/web/placeholder-panel";

export default async function EmpresasPanelPage() {
  const perfil = await obtenerPerfilActual();

  if (perfil?.rol_global === "admin_general") {
    const empresas = await obtenerEmpresasAdmin();
    return <EmpresasAdminGeneral empresas={empresas} />;
  }

  return <PlaceholderPanel titulo="Empresas" descripcion="Acá va la gestión de Empresas (crear, editar, RUC, color)." />;
}
