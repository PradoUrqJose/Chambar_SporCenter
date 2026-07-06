import { obtenerPerfilActual } from "@/lib/perfil";
import {
  obtenerAlertasArqueo,
  obtenerCajaEmpresa,
  obtenerCajasEmpresas,
  obtenerCategoriasTop,
  obtenerEmpresaAsignada,
  obtenerEmpresasConConteo,
  obtenerFlujoSemanal,
  obtenerResumenEmpresa,
  obtenerResumenOrganizacion,
  obtenerSaldoConsolidado,
  obtenerSesionesCerradas,
} from "@/lib/consultas";
import { puedeOperarTodas } from "@/lib/roles";
import { InicioAdminGeneral } from "@/components/web/inicio/inicio";
import { PlaceholderPanel } from "@/components/web/placeholder-panel";

export default async function InicioPanelPage() {
  const perfil = await obtenerPerfilActual();

  // admin_general y admin_organizacion: mismo dashboard org-wide.
  if (perfil && puedeOperarTodas(perfil.rol_global)) {
    const [saldoConsolidado, resumen, cajasEmpresas, empresasConConteo, flujoSemanal, alertasArqueo, sesionesCerradas, categoriasTop] =
      await Promise.all([
        obtenerSaldoConsolidado(),
        obtenerResumenOrganizacion(),
        obtenerCajasEmpresas(),
        obtenerEmpresasConConteo(),
        obtenerFlujoSemanal(),
        obtenerAlertasArqueo(),
        obtenerSesionesCerradas(),
        obtenerCategoriasTop(),
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
        categoriasTop={categoriasTop}
      />
    );
  }

  // admin_empresa (rol_global null): mismo dashboard, acotado a su única
  // empresa/caja — nunca a partir de un parámetro del cliente, siempre desde
  // su asignación real.
  if (perfil && perfil.rol_global === null) {
    const empresaId = await obtenerEmpresaAsignada(perfil.id);
    const caja = empresaId ? await obtenerCajaEmpresa(empresaId) : null;

    if (!empresaId || !caja) {
      return <PlaceholderPanel titulo="Inicio" descripcion="No tienes una empresa asignada todavía." />;
    }

    const [resumen, flujoSemanal, alertasArqueo, sesionesCerradas, categoriasTop] = await Promise.all([
      obtenerResumenEmpresa(empresaId),
      obtenerFlujoSemanal(caja.cajaId),
      obtenerAlertasArqueo(7, caja.cajaId),
      obtenerSesionesCerradas(caja.cajaId),
      obtenerCategoriasTop(caja.cajaId),
    ]);

    return (
      <InicioAdminGeneral
        saldoConsolidado={caja.saldo}
        resumen={resumen}
        cajasEmpresas={[caja]}
        empresasConConteo={[
          {
            id: empresaId,
            nombre: caja.nombre,
            color: caja.color,
            standsCount: resumen.standsActivos,
            usuariosCount: resumen.usuariosTotales,
          },
        ]}
        flujoSemanal={flujoSemanal}
        alertasArqueo={alertasArqueo}
        sesionesCerradas={sesionesCerradas}
        categoriasTop={categoriasTop}
      />
    );
  }

  return <PlaceholderPanel titulo="Inicio" descripcion="Acá va el contenido de Inicio." />;
}
