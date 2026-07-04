export function formatearMontoPartes(monto: number) {
  const [entero, decimales] = Math.abs(monto).toFixed(2).split(".");
  const signo = monto < 0 ? "-" : "";

  return {
    entero: `${signo}${new Intl.NumberFormat("es-PE").format(Number(entero))}`,
    decimales,
  };
}

const formateadorHora = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatearHora(fechaISO: string): string {
  return formateadorHora.format(new Date(fechaISO));
}
