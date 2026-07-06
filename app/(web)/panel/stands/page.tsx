import { obtenerPerfilActual } from "@/lib/perfil";
import { obtenerEmpresaAsignada, obtenerEmpresasActivas, obtenerStandsAdmin } from "@/lib/consultas";
import { puedeOperarTodas } from "@/lib/roles";
import { StandsAdminGeneral } from "@/components/web/stands/stands";
import { PlaceholderPanel } from "@/components/web/placeholder-panel";

export default async function StandsPanelPage() {
  const perfil = await obtenerPerfilActual();

  // admin_general y admin_organizacion: org-wide, ven y gestionan todos los stands.
  if (perfil && puedeOperarTodas(perfil.rol_global)) {
    const [stands, empresas] = await Promise.all([obtenerStandsAdmin(), obtenerEmpresasActivas()]);
    return <StandsAdminGeneral stands={stands} empresas={empresas} />;
  }

  // admin_empresa (rol_global null): mismo CRUD, acotado a los stands de su
  // propia empresa (la política RLS "gestionar stands de su empresa" ya
  // exige lo mismo del lado de la base de datos).
  if (perfil && perfil.rol_global === null) {
    const empresaId = await obtenerEmpresaAsignada(perfil.id);

    if (empresaId) {
      const [stands, empresas] = await Promise.all([obtenerStandsAdmin(empresaId), obtenerEmpresasActivas()]);
      const empresaPropia = empresas.filter((e) => e.id === empresaId);

      return <StandsAdminGeneral stands={stands} empresas={empresaPropia} />;
    }
  }

  return <PlaceholderPanel titulo="Stands" descripcion="Acá va la gestión de Stands (crear, editar, por empresa)." />;
}
