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
  const tTotal = performance.now();
  const { empresaId } = await params;
  const perfil = await obtenerPerfilActual();
  console.log(`[TIMING] page cajas: perfil resuelto en ${(performance.now() - tTotal).toFixed(0)}ms`);

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
  const tStage1 = performance.now();
  const [empresaAsignada, caja, categoriasIngreso, categoriasEgreso] = await Promise.all([
    esAdminEmpresa ? obtenerEmpresaAsignada(perfil.id) : Promise.resolve(null),
    obtenerCajaEmpresa(empresaId),
    obtenerCategoriasPorTipo("ingreso"),
    obtenerCategoriasPorTipo("egreso"),
  ]);
  console.log(`[TIMING] page cajas: stage1 (caja+categorias) en ${(performance.now() - tStage1).toFixed(0)}ms`);

  // admin_empresa (rol_global null) solo puede ver la caja de su propia
  // empresa — si el empresaId de la URL no es la suya, 404 (nunca redirigir
  // ni filtrar datos de otra empresa).
  if (esAdminEmpresa && empresaAsignada !== empresaId) notFound();
  if (!caja) notFound();

  const tStage2 = performance.now();
  const [flujoSemanal, movimientos, sesionesSemana, sesionActual, stands] = await Promise.all([
    obtenerFlujoSemanal(caja.cajaId),
    obtenerMovimientosSemana(caja.cajaId),
    obtenerSesionesSemana(caja.cajaId),
    caja.sesionAbiertaId ? obtenerSesionDetalle(caja.sesionAbiertaId) : Promise.resolve(null),
    obtenerStandsActivos(empresaId),
  ]);
  console.log(`[TIMING] page cajas: stage2 (flujo+movs+sesiones+standas) en ${(performance.now() - tStage2).toFixed(0)}ms`);

  const rutasComprobantes = [...movimientos, ...(sesionActual?.movimientos ?? [])].map((mov) => mov.comprobanteUrl).filter((ruta): ruta is string => ruta !== null);
  const tStage3 = performance.now();
  const urlsComprobantes = await obtenerUrlsComprobantes(rutasComprobantes);
  console.log(`[TIMING] page cajas: stage3 (urlsComprobantes, ${rutasComprobantes.length} rutas) en ${(performance.now() - tStage3).toFixed(0)}ms`);
  console.log(`[TIMING] page cajas: TOTAL ${(performance.now() - tTotal).toFixed(0)}ms`);

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
