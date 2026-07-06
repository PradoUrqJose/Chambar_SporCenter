type Props = {
  activo: boolean;
};

export function BadgeEstado({ activo }: Props) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${
        activo ? "bg-[#e6f4ec] text-[#1f7a4d]" : "bg-muted text-muted-foreground"
      }`}
    >
      {activo ? "Activo" : "Inactivo"}
    </span>
  );
}
