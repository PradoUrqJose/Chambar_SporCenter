import { obtenerPerfilActual } from "@/lib/perfil";
import { obtenerEmpresasAdmin } from "@/lib/consultas";
import { puedeOperarTodas } from "@/lib/roles";
import { EmpresasAdminGeneral } from "@/components/web/empresas/empresas";
import { PlaceholderPanel } from "@/components/web/placeholder-panel";

export default async function EmpresasPanelPage() {
  const perfil = await obtenerPerfilActual();

  if (perfil && puedeOperarTodas(perfil.rol_global)) {
    const empresas = await obtenerEmpresasAdmin();
    return <EmpresasAdminGeneral empresas={empresas} />;
  }

  return <PlaceholderPanel titulo="Empresas" descripcion="Acá va la gestión de Empresas (crear, editar, RUC, color)." />;
}
