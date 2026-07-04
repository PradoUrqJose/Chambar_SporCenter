export function oscurecerColor(hex: string, factor: number): string {
  const valor = hex.replace("#", "");
  const r = parseInt(valor.slice(0, 2), 16);
  const g = parseInt(valor.slice(2, 4), 16);
  const b = parseInt(valor.slice(4, 6), 16);
  const mezclar = (canal: number) => Math.round(canal * (1 - factor));

  return `rgb(${mezclar(r)}, ${mezclar(g)}, ${mezclar(b)})`;
}

export function colorConAlpha(hex: string, alpha: number): string {
  const valor = hex.replace("#", "");
  const r = parseInt(valor.slice(0, 2), 16);
  const g = parseInt(valor.slice(2, 4), 16);
  const b = parseInt(valor.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
