import { obtenerPerfilActual } from "@/lib/perfil";
import {
  obtenerAlertasArqueo,
  obtenerCajasEmpresas,
  obtenerEmpresasConConteo,
  obtenerFlujoSemanal,
  obtenerResumenOrganizacion,
  obtenerSaldoConsolidado,
  obtenerSesionesCerradas,
} from "@/lib/consultas";
import { InicioAdminGeneral } from "@/components/web/admin-general/inicio";
import { PlaceholderPanel } from "@/components/web/placeholder-panel";

export default async function InicioPanelPage() {
  const perfil = await obtenerPerfilActual();

  if (perfil?.rol_global === "admin_general") {
    const [saldoConsolidado, resumen, cajasEmpresas, empresasConConteo, flujoSemanal, alertasArqueo, sesionesCerradas] = await Promise.all([
      obtenerSaldoConsolidado(),
      obtenerResumenOrganizacion(),
      obtenerCajasEmpresas(),
      obtenerEmpresasConConteo(),
      obtenerFlujoSemanal(),
      obtenerAlertasArqueo(),
      obtenerSesionesCerradas(),
    ]);

    return (
      <InicioAdminGeneral
        saldoConsolidado={saldoConsolidado}
        resumen={resumen}
        cajasEmpresas={cajasEmpresas}
        empresasConConteo={empresasConConteo}
        flujoSemanal={flujoSemanal}
        alertasArqueo={alertasArqueo}
        sesionesCerradas={sesionesCerradas}
      />
    );
  }

  return <PlaceholderPanel titulo="Inicio" descripcion="Acá va el contenido de Inicio." />;
}
