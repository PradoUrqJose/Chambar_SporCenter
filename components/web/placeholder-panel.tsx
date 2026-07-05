type Props = {
  titulo: string;
  descripcion: string;
};

export function PlaceholderPanel({ titulo, descripcion }: Props) {
  return (
    <div className="rounded-[22px] bg-muted p-[60px] text-center text-muted-foreground">
      <h2 className="mb-2 text-[22px] font-bold text-foreground">{titulo}</h2>
      <p>{descripcion}</p>
    </div>
  );
}
