import { obtenerPerfilActual } from "@/lib/perfil";
import { buscarMovimientos, obtenerCajasFiltro, obtenerSesionesCerradas } from "@/lib/consultas";
import { HistorialAdminOrganizacion } from "@/components/pwa/historial/historial";

type Props = {
  searchParams: Promise<{ caja?: string; q?: string }>;
};

export default async function HistorialPage({ searchParams }: Props) {
  const { caja, q } = await searchParams;
  const perfil = await obtenerPerfilActual();

  if (perfil?.rol_global === "admin_organizacion" || perfil?.rol_global === null) {
    const [cajas, sesiones, resultadosBusqueda] = await Promise.all([
      obtenerCajasFiltro(),
      obtenerSesionesCerradas(caja),
      q ? buscarMovimientos(q) : Promise.resolve(null),
    ]);

    return <HistorialAdminOrganizacion cajas={cajas} sesiones={sesiones} cajaSeleccionadaId={caja ?? null} resultadosBusqueda={resultadosBusqueda} />;
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Historial</h1>
    </main>
  );
}
