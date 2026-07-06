import { notFound } from "next/navigation";
import { obtenerPerfilActual } from "@/lib/perfil";
import { obtenerSesionDetalle } from "@/lib/consultas";
import { SesionDetalleAdminOrganizacion } from "@/components/pwa/historial/sesion-detalle";

type Props = {
  params: Promise<{ sesionId: string }>;
};

export default async function SesionDetallePage({ params }: Props) {
  const { sesionId } = await params;
  const perfil = await obtenerPerfilActual();

  if (perfil?.rol_global === "admin_organizacion" || perfil?.rol_global === null) {
    const sesion = await obtenerSesionDetalle(sesionId);
    if (!sesion) notFound();

    return <SesionDetalleAdminOrganizacion sesion={sesion} />;
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Sesión</h1>
    </main>
  );
}
