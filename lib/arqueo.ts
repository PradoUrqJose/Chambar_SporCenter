export type EstadoArqueo = { label: "Cuadrada" | "Faltante" | "Sobrante"; color: string };

export function obtenerEstadoArqueo(diferencia: number): EstadoArqueo {
  if (Math.abs(diferencia) < 0.005) return { label: "Cuadrada", color: "#059669" };
  return diferencia < 0 ? { label: "Faltante", color: "#E7000B" } : { label: "Sobrante", color: "#d97706" };
}
