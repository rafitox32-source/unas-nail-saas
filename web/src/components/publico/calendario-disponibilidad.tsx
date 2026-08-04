"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { generarHorariosDisponibles, hoyISO } from "@/lib/disponibilidad";
import type { RangoOcupado } from "@/lib/tipos";

const DIAS_SEMANA = ["D", "L", "M", "M", "J", "V", "S"];
const FORMATEADOR_MES = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" });

function inicioDeMes(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

function fechaISOLocal(anio: number, mes: number, dia: number) {
  return `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function CalendarioDisponibilidad({
  idManicurista,
  idEmpleado,
  duracionMinutos,
  fechaSeleccionada,
  onSeleccionar,
}: {
  idManicurista: string;
  idEmpleado?: string | null;
  duracionMinutos: number;
  fechaSeleccionada: string;
  onSeleccionar: (fecha: string) => void;
}) {
  const hoy = hoyISO();
  const [mesVisible, setMesVisible] = useState(() => inicioDeMes(new Date(`${hoy}T00:00:00`)));
  const [rangosDelMes, setRangosDelMes] = useState<RangoOcupado[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    const supabase = crearClienteNavegador();
    supabase
      .rpc("horarios_ocupados_mes", {
        p_id_manicurista: idManicurista,
        p_anio: mesVisible.getFullYear(),
        p_mes: mesVisible.getMonth() + 1,
        p_id_empleado: idEmpleado ?? null,
      })
      .then(({ data }) => {
        if (cancelado) return;
        setRangosDelMes(data ?? []);
        setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [idManicurista, idEmpleado, mesVisible]);

  const anio = mesVisible.getFullYear();
  const mes = mesVisible.getMonth();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const primerDiaSemana = new Date(anio, mes, 1).getDay();
  const esMesActual = mesVisible.getTime() === inicioDeMes(new Date(`${hoy}T00:00:00`)).getTime();

  const celdas: (number | null)[] = [
    ...Array(primerDiaSemana).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];

  function estaDisponible(dia: number) {
    const fechaDia = fechaISOLocal(anio, mes, dia);
    if (fechaDia < hoy) return false;
    const rangosDelDia = rangosDelMes.filter(
      (r) => new Date(r.inicio).toDateString() === new Date(`${fechaDia}T00:00:00`).toDateString(),
    );
    return generarHorariosDisponibles(fechaDia, duracionMinutos, rangosDelDia).length > 0;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMesVisible(new Date(anio, mes - 1, 1))}
          disabled={esMesActual}
          aria-label="Mes anterior"
          className="flex h-8 w-8 items-center justify-center rounded-full text-texto-secundario transition-colors hover:bg-borde/50 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold capitalize text-texto-primario">
          {FORMATEADOR_MES.format(mesVisible)}
        </p>
        <button
          type="button"
          onClick={() => setMesVisible(new Date(anio, mes + 1, 1))}
          aria-label="Mes siguiente"
          className="flex h-8 w-8 items-center justify-center rounded-full text-texto-secundario transition-colors hover:bg-borde/50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {cargando ? (
        <p className="mt-4 flex items-center justify-center gap-1.5 py-6 text-xs text-texto-secundario">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Consultando el calendario…
        </p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-texto-secundario">
            {DIAS_SEMANA.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {celdas.map((dia, i) => {
              if (dia === null) return <span key={`vacio-${i}`} />;
              const fechaDia = fechaISOLocal(anio, mes, dia);
              const disponible = estaDisponible(dia);
              const seleccionado = fechaDia === fechaSeleccionada;
              return (
                <button
                  key={fechaDia}
                  type="button"
                  disabled={!disponible}
                  onClick={() => onSeleccionar(fechaDia)}
                  className={`aspect-square rounded-lg text-sm transition-colors ${
                    seleccionado
                      ? "bg-rosado font-semibold text-white"
                      : disponible
                        ? "text-texto-primario hover:bg-rosado-suave"
                        : "text-texto-secundario/40 line-through"
                  }`}
                >
                  {dia}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
