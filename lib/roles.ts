export type RolGlobal = "admin_general" | "admin_organizacion" | null;

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
