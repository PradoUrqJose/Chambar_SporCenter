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

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const formateadorFechaPartes = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Lima",
  day: "2-digit",
  month: "numeric",
});

const formateadorFechaISO = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Lima",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function fechaLimaISO(fechaISO: string): string {
  return formateadorFechaISO.format(new Date(fechaISO));
}

export function formatearFecha(fechaISO: string): string {
  const partes = formateadorFechaPartes.formatToParts(new Date(fechaISO));
  const dia = partes.find((parte) => parte.type === "day")!.value;
  const mes = Number(partes.find((parte) => parte.type === "month")!.value) - 1;
  return `${dia} ${MESES_CORTOS[mes]}`;
}

const formateadorDatetimeLocalLima = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Lima",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

// Valor inicial para un <input type="datetime-local"> mostrando la hora
// actual en Lima (no en la zona horaria del navegador de quien lo usa).
export function ahoraLimaDatetimeLocal(): string {
  const partes = formateadorDatetimeLocalLima.formatToParts(new Date());
  const obtener = (tipo: string) => partes.find((parte) => parte.type === tipo)!.value;
  return `${obtener("year")}-${obtener("month")}-${obtener("day")}T${obtener("hour")}:${obtener("minute")}`;
}

// Lima no tiene horario de verano: el offset -05:00 es fijo todo el año.
export function datetimeLocalAIsoLima(valor: string): string {
  return `${valor}:00-05:00`;
}

export function obtenerIniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/);
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
}
