import { obtenerIniciales } from "@/lib/formato";
import { oscurecerColor } from "@/lib/color";

type Props = {
  nombre: string;
  color?: string | null;
  size?: number;
};

const COLOR_POR_DEFECTO = "#1f7a4d";

export function AvatarInicial({ nombre, color, size = 40 }: Props) {
  const base = color ?? COLOR_POR_DEFECTO;

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        background: `linear-gradient(135deg, ${base}, ${oscurecerColor(base, 0.55)})`,
      }}
    >
      {obtenerIniciales(nombre)}
    </div>
  );
}
