import type { RangoOcupado } from "@/lib/tipos";

export const HORA_APERTURA_MIN = 9 * 60;
export const HORA_CIERRE_MIN = 20 * 60;
export const PASO_MINUTOS = 30;

export function hoyISO() {
  const hoy = new Date();
  const desfaseMinutos = hoy.getTimezoneOffset();
  const local = new Date(hoy.getTime() - desfaseMinutos * 60000);
  return local.toISOString().slice(0, 10);
}

// Genera los horarios de inicio que entran completos en el horario de
// atención y no se superponen con ningún turno ya ocupado ese día — la
// clienta elige de una lista de horarios reales, no adivina uno a mano.
export function generarHorariosDisponibles(
  fecha: string,
  duracionMinutos: number,
  horariosOcupados: RangoOcupado[],
) {
  const disponibles: string[] = [];
  const ahora = new Date();
  const esHoy = fecha === hoyISO();

  for (
    let minutos = HORA_APERTURA_MIN;
    minutos + duracionMinutos <= HORA_CIERRE_MIN;
    minutos += PASO_MINUTOS
  ) {
    const horaTexto = `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
    const inicio = new Date(`${fecha}T${horaTexto}:00`);
    const fin = new Date(inicio.getTime() + duracionMinutos * 60000);

    if (esHoy && inicio <= ahora) continue;

    const seSuperpone = horariosOcupados.some((h) => {
      const ocupadoInicio = new Date(h.inicio);
      const ocupadoFin = new Date(h.fin);
      return inicio < ocupadoFin && fin > ocupadoInicio;
    });

    if (!seSuperpone) disponibles.push(horaTexto);
  }

  return disponibles;
}
