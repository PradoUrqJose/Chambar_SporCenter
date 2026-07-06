import type { ReactNode } from "react";
import Link from "next/link";

type Props = {
  label: string;
  valor: ReactNode;
  icon: ReactNode;
  href?: string;
};

export function StatCard({ label, valor, icon, href }: Props) {
  const contenido = (
    <>
      <div className="flex items-center justify-between text-[15px] font-semibold">
        {label}
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-black/10 text-foreground transition-colors group-hover:border-primary/40 group-hover:bg-secondary group-hover:text-primary">
          {icon}
        </span>
      </div>
      <div className="mt-4 mb-2.5 text-[40px] font-extrabold">{valor}</div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block rounded-[20px] bg-card p-[22px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
      >
        {contenido}
      </Link>
    );
  }

  return <div className="rounded-[20px] bg-card p-[22px]">{contenido}</div>;
}
