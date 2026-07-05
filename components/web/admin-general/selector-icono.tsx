"use client";

import { obtenerIcono } from "@/lib/iconos";

type Props = {
  valor: string;
  onChange: (icono: string) => void;
  color?: string;
};

export const ICONOS_CATEGORIA = [
  "Wallet",
  "Banknote",
  "Coins",
  "HandCoins",
  "PiggyBank",
  "Receipt",
  "CreditCard",
  "ShoppingCart",
  "Utensils",
  "Fuel",
  "Car",
  "Truck",
  "Home",
  "Building2",
  "Store",
  "Wrench",
  "Zap",
  "Wifi",
  "Phone",
  "Package",
  "Briefcase",
  "Users",
  "Gift",
  "Tag",
];

export function SelectorIcono({ valor, onChange, color = "#1f7a4d" }: Props) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {ICONOS_CATEGORIA.map((nombre) => {
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
