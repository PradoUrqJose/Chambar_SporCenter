import { notFound } from "next/navigation";
import { obtenerPerfilActual } from "@/lib/perfil";
import {
  fechaLima,
  obtenerCajaEmpresa,
  obtenerCategoriasPorTipo,
  obtenerEmpresaAsignada,
  obtenerFlujoSemanal,
  obtenerMovimientosSemana,
  obtenerSesionDetalle,
  obtenerSesionesSemana,
  obtenerStandsActivos,
  obtenerUrlsComprobantes,
} from "@/lib/consultas";
import { puedeOperarTodas } from "@/lib/roles";
import { CajaDetalle } from "@/components/web/cajas/caja-detalle";
import { PlaceholderPanel } from "@/components/web/placeholder-panel";

type Props = {
  params: Promise<{ empresaId: string }>;
};

export default async function CajaEmpresaPanelPage({ params }: Props) {
  const { empresaId } = await params;
  const perfil = await obtenerPerfilActual();

  // admin_general y admin_organizacion ven/administran cualquier caja
  // (org-wide); admin_empresa (rol_global null) solo la suya.
  const puedeVerCualquierCaja = perfil !== null && puedeOperarTodas(perfil.rol_global);
  const esAdminEmpresa = perfil !== null && perfil.rol_global === null;

  if (!puedeVerCualquierCaja && !esAdminEmpresa) {
    return <PlaceholderPanel titulo="Caja" descripcion="Acá va el detalle de la caja." />;
  }

  // Antes: obtenerCajaEmpresa se esperaba solo, y recién después arrancaban
  // categorías (que no dependen de la caja) — un viaje de red desperdiciado.
  // Ahora todo lo que no depende de resolver la caja va en el mismo Promise.all.
  const [empresaAsignada, caja, categoriasIngreso, categoriasEgreso] = await Promise.all([
    esAdminEmpresa ? obtenerEmpresaAsignada(perfil.id) : Promise.resolve(null),
    obtenerCajaEmpresa(empresaId),
    obtenerCategoriasPorTipo("ingreso"),
    obtenerCategoriasPorTipo("egreso"),
  ]);

  // admin_empresa (rol_global null) solo puede ver la caja de su propia
  // empresa — si el empresaId de la URL no es la suya, 404 (nunca redirigir
  // ni filtrar datos de otra empresa).
  if (esAdminEmpresa && empresaAsignada !== empresaId) notFound();
  if (!caja) notFound();

  const [flujoSemanal, movimientos, sesionesSemana, sesionActual, stands] = await Promise.all([
    obtenerFlujoSemanal(caja.cajaId),
    obtenerMovimientosSemana(caja.cajaId),
    obtenerSesionesSemana(caja.cajaId),
    caja.sesionAbiertaId ? obtenerSesionDetalle(caja.sesionAbiertaId) : Promise.resolve(null),
    obtenerStandsActivos(empresaId),
  ]);

  const rutasComprobantes = [...movimientos, ...(sesionActual?.movimientos ?? [])].map((mov) => mov.comprobanteUrl).filter((ruta): ruta is string => ruta !== null);
  const urlsComprobantes = await obtenerUrlsComprobantes(rutasComprobantes);

  return (
    <CajaDetalle
      caja={caja}
      flujoSemanal={flujoSemanal}
      movimientos={movimientos}
      sesionesSemana={sesionesSemana}
      sesionActual={sesionActual}
      fechaHoy={fechaLima()}
      urlsComprobantes={urlsComprobantes}
      categoriasIngreso={categoriasIngreso}
      categoriasEgreso={categoriasEgreso}
      stands={stands}
      mostrarVolver={!esAdminEmpresa}
    />
  );
}
