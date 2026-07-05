"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

type Props = {
  href: string;
  children: ReactNode;
};

export function FilaHistorial({ href, children }: Props) {
  const router = useRouter();

  return (
    <tr onClick={() => router.push(href)} className="cursor-pointer transition hover:bg-muted/50">
      {children}
    </tr>
  );
}
