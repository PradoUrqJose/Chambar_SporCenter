import type { ReactNode } from "react";

type Props = {
  label: string;
  valor: ReactNode;
  icon: ReactNode;
};

export function StatCard({ label, valor, icon }: Props) {
  return (
    <div className="rounded-[20px] bg-card p-[22px]">
      <div className="flex items-center justify-between text-[15px] font-semibold">
        {label}
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-black/10 text-foreground">{icon}</span>
      </div>
      <div className="mt-4 mb-2.5 text-[40px] font-extrabold">{valor}</div>
    </div>
  );
}
