import * as LucideIcons from "lucide-react";
import { Wallet, type LucideIcon } from "lucide-react";

export function obtenerIcono(nombre: string | null): LucideIcon {
  if (!nombre) return Wallet;

  const icono = (LucideIcons as unknown as Record<string, LucideIcon>)[nombre];
  return icono ?? Wallet;
}
