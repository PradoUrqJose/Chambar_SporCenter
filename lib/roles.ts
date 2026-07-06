export type RolGlobal = "admin_general" | "admin_organizacion" | null;

// Mismo criterio que la función puede_operar_todas() en RLS: admin_general y
// admin_organizacion administran cualquier empresa/caja/stand/categoría a
// nivel organización (a diferencia de admin_empresa, acotado a la suya).
export function puedeOperarTodas(rol: RolGlobal): boolean {
  return rol === "admin_general" || rol === "admin_organizacion";
}

export function etiquetaRol(rol: RolGlobal): string {
  switch (rol) {
    case "admin_general":
      return "Administrador general";
    case "admin_organizacion":
      return "Administrador de organización";
    default:
      return "Encargado de empresa";
  }
}
