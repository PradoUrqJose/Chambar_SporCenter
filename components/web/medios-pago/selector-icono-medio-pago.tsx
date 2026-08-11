"use client";

import { obtenerIcono } from "@/lib/iconos";

type Props = {
  valor: string;
  onChange: (icono: string) => void;
  color?: string;
};

// Mismo mecanismo que SelectorIcono de categorías (lookup dinámico en
// lucide-react vía obtenerIcono), con un set acotado a bancos/tarjetas.
export const ICONOS_MEDIO_PAGO = [
  "CreditCard",
  "Landmark",
  "Banknote",
  "Building2",
  "Smartphone",
  "QrCode",
  "Wallet",
  "ArrowLeftRight",
];

export function SelectorIconoMedioPago({ valor, onChange, color = "#1f7a4d" }: Props) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {ICONOS_MEDIO_PAGO.map((nombre) => {
        const Icono = obtenerIcono(nombre);
        const seleccionado = nombre === valor;

        return (
          <button
            key={nombre}
            type="button"
            onClick={() => onChange(nombre)}
            aria-label={nombre}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
              seleccionado ? "" : "border-border text-muted-foreground hover:border-ring"
            }`}
            style={seleccionado ? { borderColor: color, backgroundColor: `${color}1a`, color } : undefined}
          >
            <Icono className="h-[18px] w-[18px]" />
          </button>
        );
      })}
    </div>
  );
}
