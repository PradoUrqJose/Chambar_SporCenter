import { obtenerPerfilActual } from "@/lib/perfil";
import {
  obtenerAlertasArqueo,
  obtenerCajasEmpresas,
  obtenerEmpresasConConteo,
  obtenerFlujoSemanal,
  obtenerMovimientosHoy,
  obtenerResumenOrganizacion,
  obtenerSaldoConsolidado,
} from "@/lib/consultas";
import { InicioAdminOrganizacion } from "@/components/pwa/inicio/admin-organizacion";
import { InicioAdminGeneral } from "@/components/pwa/inicio/admin-general";

export default async function InicioPage() {
  const perfil = await obtenerPerfilActual();

  if (perfil?.rol_global === "admin_organizacion") {
    const [saldoConsolidado, movimientosHoy, flujoSemanal, cajas, alertasArqueo] = await Promise.all([
      obtenerSaldoConsolidado(),
      obtenerMovimientosHoy(),
      obtenerFlujoSemanal(),
      obtenerCajasEmpresas(),
      obtenerAlertasArqueo(),
    ]);

    return (
      <InicioAdminOrganizacion
        saldoConsolidado={saldoConsolidado}
        ingresosHoy={movimientosHoy.ingresos}
        egresosHoy={movimientosHoy.egresos}
        flujoSemanal={flujoSemanal}
        cajas={cajas}
        alertasArqueo={alertasArqueo}
      />
    );
  }

  if (perfil?.rol_global === "admin_general") {
    const [resumen, empresas] = await Promise.all([obtenerResumenOrganizacion(), obtenerEmpresasConConteo()]);

    return <InicioAdminGeneral nombreUsuario={perfil.nombre} resumen={resumen} empresas={empresas} />;
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Inicio</h1>
    </main>
  );
}
