import { obtenerPerfilActual } from "@/lib/perfil";
import { obtenerCajasEmpresas } from "@/lib/consultas";
import { CajasAdminOrganizacion } from "@/components/pwa/admin-organizacion/cajas";

export default async function CajasPage() {
  const perfil = await obtenerPerfilActual();

  if (perfil?.rol_global === "admin_organizacion") {
    const cajas = await obtenerCajasEmpresas();

    return <CajasAdminOrganizacion nombreUsuario={perfil.nombre} cajas={cajas} />;
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Cajas</h1>
    </main>
  );
}
