import { notFound } from "next/navigation";
import { obtenerPerfilActual } from "@/lib/perfil";
import {
  fechaLima,
  obtenerCajaEmpresa,
  obtenerCategoriasPorTipo,
  obtenerEmpresaAsignadaSlug,
  obtenerEmpresaIdPorSlug,
  obtenerEsperadosPorMedioSesion,
  obtenerFlujoSemanal,
  obtenerMediosPagoActivos,
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
  params: Promise<{ empresaSlug: string }>;
};

export default async function CajaEmpresaPanelPage({ params }: Props) {
  const { empresaSlug } = await params;
  const perfil = await obtenerPerfilActual();

  // admin_general y admin_organizacion ven/administran cualquier caja
  // (org-wide); admin_empresa (rol_global null) solo la suya.
  const puedeVerCualquierCaja = perfil !== null && puedeOperarTodas(perfil.rol_global);
  const esAdminEmpresa = perfil !== null && perfil.rol_global === null;

  if (!puedeVerCualquierCaja && !esAdminEmpresa) {
    return <PlaceholderPanel titulo="Caja" descripcion="Acá va el detalle de la caja." />;
  }

  // El slug de la URL solo sirve para resolver el empresaId real; todo lo
  // que sigue (obtenerCajaEmpresa y lo que depende de ella) sigue andando
  // con el UUID de siempre. Lo que no depende de ese id va en paralelo.
  const [empresaAsignadaSlug, empresaId, categoriasIngreso, categoriasEgreso, mediosPago] = await Promise.all([
    esAdminEmpresa ? obtenerEmpresaAsignadaSlug(perfil.id) : Promise.resolve(null),
    obtenerEmpresaIdPorSlug(empresaSlug),
    obtenerCategoriasPorTipo("ingreso"),
    obtenerCategoriasPorTipo("egreso"),
    obtenerMediosPagoActivos(),
  ]);

  // admin_empresa (rol_global null) solo puede ver la caja de su propia
  // empresa — si el slug de la URL no es el suyo, 404 (nunca redirigir ni
  // filtrar datos de otra empresa).
  if (esAdminEmpresa && empresaAsignadaSlug !== empresaSlug) notFound();
  if (!empresaId) notFound();

  const caja = await obtenerCajaEmpresa(empresaId);
  if (!caja) notFound();

  const [flujoSemanal, movimientos, sesionesSemana, sesionActual, stands, esperadosPorMedio] = await Promise.all([
    obtenerFlujoSemanal(caja.cajaId),
    obtenerMovimientosSemana(caja.cajaId),
    obtenerSesionesSemana(caja.cajaId),
    caja.sesionAbiertaId ? obtenerSesionDetalle(caja.sesionAbiertaId) : Promise.resolve(null),
    obtenerStandsActivos(caja.empresaId),
    caja.sesionAbiertaId ? obtenerEsperadosPorMedioSesion(caja.sesionAbiertaId) : Promise.resolve([]),
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
      mediosPago={mediosPago}
      esperadosPorMedio={esperadosPorMedio}
      stands={stands}
      mostrarVolver={!esAdminEmpresa}
      esAdmin={puedeVerCualquierCaja}
    />
  );
}
