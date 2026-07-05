import { obtenerPerfilActual } from "@/lib/perfil";
import { obtenerEmpresasActivas, obtenerUsuarios } from "@/lib/consultas";
import { UsuariosAdminGeneral } from "@/components/web/admin-general/usuarios";
import { PlaceholderPanel } from "@/components/web/placeholder-panel";

export default async function UsuariosPanelPage() {
  const perfil = await obtenerPerfilActual();

  if (perfil?.rol_global === "admin_general") {
    const [usuarios, empresas] = await Promise.all([obtenerUsuarios(), obtenerEmpresasActivas()]);
    return <UsuariosAdminGeneral usuarios={usuarios} empresas={empresas} />;
  }

  return <PlaceholderPanel titulo="Usuarios" descripcion="Acá va el contenido de Usuarios." />;
}
