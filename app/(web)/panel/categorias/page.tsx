import { obtenerPerfilActual } from "@/lib/perfil";
import { obtenerCategoriasAdmin } from "@/lib/consultas";
import { puedeOperarTodas } from "@/lib/roles";
import { CategoriasAdminGeneral } from "@/components/web/categorias/categorias";
import { PlaceholderPanel } from "@/components/web/placeholder-panel";

export default async function CategoriasPanelPage() {
  const perfil = await obtenerPerfilActual();

  if (perfil && puedeOperarTodas(perfil.rol_global)) {
    const categorias = await obtenerCategoriasAdmin();
    return <CategoriasAdminGeneral categorias={categorias} />;
  }

  return (
    <PlaceholderPanel
      titulo="Categorías"
      descripcion="Acá va el catálogo global de categorías (ingreso/egreso, ícono, color)."
    />
  );
}
