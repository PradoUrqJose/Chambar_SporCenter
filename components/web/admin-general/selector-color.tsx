"use client";

import { CheckIcon } from "lucide-react";

type Props = {
  valor: string;
  onChange: (color: string) => void;
};

export const PALETA_COLORES = [
  "#1f7a4d",
  "#2563eb",
  "#dc2626",
  "#d97706",
  "#7c3aed",
  "#db2777",
  "#0891b2",
  "#ea580c",
  "#64748b",
  "#0f172a",
];

export function SelectorColor({ valor, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {PALETA_COLORES.map((color) => {
        const seleccionado = color === valor;

        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={color}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
              seleccionado ? "scale-110 shadow-[0_0_0_3px_rgba(0,0,0,0.15)]" : "hover:scale-105"
            }`}
            style={{ backgroundColor: color }}
          >
            {seleccionado && <CheckIcon className="h-4 w-4 text-white" />}
          </button>
        );
      })}
    </div>
  );
}
