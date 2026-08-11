import { obtenerPerfilActual } from "@/lib/perfil";
import { obtenerMediosPagoAdmin } from "@/lib/consultas";
import { MediosPagoAdminGeneral } from "@/components/web/medios-pago/medios-pago";
import { PlaceholderPanel } from "@/components/web/placeholder-panel";

export default async function MediosPagoPanelPage() {
  const perfil = await obtenerPerfilActual();

  if (perfil?.rol_global === "admin_general") {
    const mediosPago = await obtenerMediosPagoAdmin();
    return <MediosPagoAdminGeneral mediosPago={mediosPago} />;
  }

  return (
    <PlaceholderPanel
      titulo="Medios de pago"
      descripcion="Acá va el catálogo de tarjetas y bancos para cuadrar transferencias (solo administrador general)."
    />
  );
}
