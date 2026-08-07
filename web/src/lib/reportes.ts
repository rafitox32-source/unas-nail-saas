import type { CitaReporte } from "@/lib/tipos";

export interface MesIngreso {
  etiqueta: string;
  total: number;
}

export interface ServicioIngreso {
  nombre: string;
  total: number;
  citas: number;
}

const FORMATEADOR_MES = new Intl.DateTimeFormat("es-AR", { month: "short" });

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function ingresosPorMes(citas: CitaReporte[], meses = 6): MesIngreso[] {
  const ahora = new Date();
  const cubos = [];
  for (let i = meses - 1; i >= 0; i--) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    cubos.push({
      anio: fecha.getFullYear(),
      mes: fecha.getMonth(),
      etiqueta: capitalizar(FORMATEADOR_MES.format(fecha)),
      total: 0,
    });
  }
  for (const cita of citas) {
    const fecha = new Date(cita.fecha_hora_inicio);
    const cubo = cubos.find((c) => c.anio === fecha.getFullYear() && c.mes === fecha.getMonth());
    if (cubo) cubo.total += cita.monto_total;
  }
  return cubos.map(({ etiqueta, total }) => ({ etiqueta, total }));
}

export function topServiciosPorIngreso(citas: CitaReporte[], top = 5): ServicioIngreso[] {
  const mapa = new Map<string, ServicioIngreso>();
  for (const cita of citas) {
    const nombre = cita.servicios?.nombre ?? "Sin servicio";
    const actual = mapa.get(nombre) ?? { nombre, total: 0, citas: 0 };
    actual.total += cita.monto_total;
    actual.citas += 1;
    mapa.set(nombre, actual);
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total).slice(0, top);
}

export interface ActividadEmpleado {
  nombre: string;
  total: number;
  citas: number;
}

export function actividadPorEmpleado(citas: CitaReporte[]): ActividadEmpleado[] {
  const mapa = new Map<string, ActividadEmpleado>();
  for (const cita of citas) {
    if (!cita.id_empleado) continue;
    const nombre = cita.personal?.nombre ?? "Sin nombre";
    const actual = mapa.get(cita.id_empleado) ?? { nombre, total: 0, citas: 0 };
    actual.total += cita.monto_total;
    actual.citas += 1;
    mapa.set(cita.id_empleado, actual);
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total);
}
