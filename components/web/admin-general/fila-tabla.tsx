"use client";

import type { ReactNode } from "react";

type Props = {
  onClick: () => void;
  children: ReactNode;
};

export function FilaTabla({ onClick, children }: Props) {
  return (
    <tr onClick={onClick} className="cursor-pointer transition hover:bg-muted/50">
      {children}
    </tr>
  );
}
