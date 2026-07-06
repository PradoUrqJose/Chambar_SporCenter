import { obtenerPerfilActual } from "@/lib/perfil";
import { obtenerEmpresasActivas, obtenerUsuarios } from "@/lib/consultas";
import { UsuariosAdminGeneral } from "@/components/pwa/usuarios/usuarios";

export default async function UsuariosPage() {
  const perfil = await obtenerPerfilActual();

  if (perfil?.rol_global === "admin_general") {
    const [usuarios, empresas] = await Promise.all([obtenerUsuarios(), obtenerEmpresasActivas()]);

    return <UsuariosAdminGeneral usuarios={usuarios} empresas={empresas} />;
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Usuarios</h1>
    </main>
  );
}
