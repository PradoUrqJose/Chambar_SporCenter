import { obtenerPerfilActual } from "@/lib/perfil";
import { obtenerFlujoSemanal, obtenerMovimientosHoy, obtenerSaldoConsolidado } from "@/lib/consultas";
import { InicioAdminOrganizacion } from "@/components/pwa/admin-organizacion/inicio";

export default async function InicioPage() {
  const perfil = await obtenerPerfilActual();

  if (perfil?.rol_global === "admin_organizacion") {
    const [saldoConsolidado, movimientosHoy, flujoSemanal] = await Promise.all([obtenerSaldoConsolidado(), obtenerMovimientosHoy(), obtenerFlujoSemanal()]);

    return <InicioAdminOrganizacion saldoConsolidado={saldoConsolidado} ingresosHoy={movimientosHoy.ingresos} egresosHoy={movimientosHoy.egresos} flujoSemanal={flujoSemanal} />;
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Inicio</h1>
    </main>
  );
}
