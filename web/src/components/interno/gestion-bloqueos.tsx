"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Trash2, Plus, Ban } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type { BloqueoAgenda, Personal } from "@/lib/tipos";

const DIAS_SEMANA = ["D", "L", "M", "M", "J", "V", "S"];
const FORMATEADOR_MES = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" });
const FORMATEADOR_DIA_LARGO = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});
const FORMATEADOR_HORA = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" });

function hoyISO() {
  const hoy = new Date();
  const desfaseMinutos = hoy.getTimezoneOffset();
  const local = new Date(hoy.getTime() - desfaseMinutos * 60000);
  return local.toISOString().slice(0, 10);
}

function inicioDeMes(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

function fechaISOLocal(anio: number, mes: number, dia: number) {
  return `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function limitesDelDia(fechaISO: string) {
  const inicio = new Date(`${fechaISO}T00:00:00`);
  const fin = new Date(inicio.getTime() + 86400000);
  return { inicio, fin };
}

function diaCubiertoCompleto(fechaISO: string, bloqueos: BloqueoAgenda[]) {
  const { inicio, fin } = limitesDelDia(fechaISO);
  return bloqueos.some(
    (b) => new Date(b.fecha_hora_inicio) <= inicio && new Date(b.fecha_hora_fin) >= fin,
  );
}

function diaTieneBloqueoParcial(fechaISO: string, bloqueos: BloqueoAgenda[]) {
  const { inicio, fin } = limitesDelDia(fechaISO);
  return bloqueos.some((b) => {
    const bInicio = new Date(b.fecha_hora_inicio);
    const bFin = new Date(b.fecha_hora_fin);
    const seSolapa = bInicio < fin && bFin > inicio;
    const cubreCompleto = bInicio <= inicio && bFin >= fin;
    return seSolapa && !cubreCompleto;
  });
}

function bloqueosDelDia(fechaISO: string, bloqueos: BloqueoAgenda[]) {
  const { inicio, fin } = limitesDelDia(fechaISO);
  return bloqueos.filter((b) => new Date(b.fecha_hora_inicio) < fin && new Date(b.fecha_hora_fin) > inicio);
}

function esBloqueoDeDiaCompleto(b: BloqueoAgenda) {
  const inicio = new Date(b.fecha_hora_inicio);
  const fin = new Date(b.fecha_hora_fin);
  return (
    inicio.getHours() === 0 &&
    inicio.getMinutes() === 0 &&
    fin.getTime() - inicio.getTime() >= 86400000 - 1
  );
}

export function GestionBloqueos({
  idNegocio,
  bloqueosIniciales,
  personal,
}: {
  idNegocio: string;
  bloqueosIniciales: BloqueoAgenda[];
  personal: Personal[];
}) {
  const hoy = hoyISO();
  const [bloqueos, setBloqueos] = useState(bloqueosIniciales);
  const [mesVisible, setMesVisible] = useState(() => inicioDeMes(new Date(`${hoy}T00:00:00`)));
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
  const [formularioHorarioAbierto, setFormularioHorarioAbierto] = useState(false);
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("18:00");
  const [motivo, setMotivo] = useState("");
  const [idEmpleado, setIdEmpleado] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const anio = mesVisible.getFullYear();
  const mes = mesVisible.getMonth();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const primerDiaSemana = new Date(anio, mes, 1).getDay();

  const celdas: (number | null)[] = [
    ...Array(primerDiaSemana).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];

  function limpiarFormulario() {
    setFormularioHorarioAbierto(false);
    setHoraInicio("09:00");
    setHoraFin("18:00");
    setMotivo("");
    setIdEmpleado("");
    setError(null);
  }

  function seleccionarDia(fechaDia: string) {
    setDiaSeleccionado((actual) => (actual === fechaDia ? null : fechaDia));
    limpiarFormulario();
  }

  async function bloquearDiaCompleto() {
    if (!diaSeleccionado) return;
    setGuardando(true);
    setError(null);
    const { inicio, fin } = limitesDelDia(diaSeleccionado);
    const supabase = crearClienteNavegador();
    const { data, error: errorGuardar } = await supabase
      .from("bloqueos_agenda")
      .insert({
        id_negocio: idNegocio,
        fecha_hora_inicio: inicio.toISOString(),
        fecha_hora_fin: fin.toISOString(),
        motivo: null,
        id_empleado: null,
      })
      .select("id, fecha_hora_inicio, fecha_hora_fin, motivo, id_empleado")
      .single<BloqueoAgenda>();

    setGuardando(false);
    if (errorGuardar) setError(errorGuardar.message);
    else if (data) setBloqueos((actual) => [...actual, data]);
  }

  async function agregarBloqueoHorario(evento: React.FormEvent) {
    evento.preventDefault();
    if (!diaSeleccionado) return;
    setError(null);

    if (horaFin <= horaInicio) {
      setError("La hora de fin tiene que ser después de la de inicio.");
      return;
    }

    setGuardando(true);
    const supabase = crearClienteNavegador();
    const { data, error: errorGuardar } = await supabase
      .from("bloqueos_agenda")
      .insert({
        id_negocio: idNegocio,
        fecha_hora_inicio: new Date(`${diaSeleccionado}T${horaInicio}:00`).toISOString(),
        fecha_hora_fin: new Date(`${diaSeleccionado}T${horaFin}:00`).toISOString(),
        motivo: motivo || null,
        id_empleado: idEmpleado || null,
      })
      .select("id, fecha_hora_inicio, fecha_hora_fin, motivo, id_empleado")
      .single<BloqueoAgenda>();

    setGuardando(false);
    if (errorGuardar) {
      setError(errorGuardar.message);
    } else if (data) {
      setBloqueos((actual) => [...actual, data]);
      limpiarFormulario();
    }
  }

  async function borrarBloqueo(id: string) {
    setBorrando(id);
    const supabase = crearClienteNavegador();
    const { error: errorBorrar } = await supabase.from("bloqueos_agenda").delete().eq("id", id);
    setBorrando(null);
    if (!errorBorrar) setBloqueos((actual) => actual.filter((b) => b.id !== id));
  }

  const bloqueosDelDiaSeleccionado = diaSeleccionado ? bloqueosDelDia(diaSeleccionado, bloqueos) : [];
  const yaTieneDiaCompleto = diaSeleccionado ? diaCubiertoCompleto(diaSeleccionado, bloqueos) : false;

  return (
    <div className="mt-8">
      <h2 className="font-titulo text-lg font-semibold text-texto-primario">Bloquear horarios</h2>
      <p className="mt-1 text-sm text-texto-secundario">
        Tocá un día para bloquearlo entero o cargar un horario puntual — tus clientas no van a
        poder reservar ahí.
      </p>

      <div className="mt-4 rounded-2xl border border-borde bg-superficie p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMesVisible(new Date(anio, mes - 1, 1))}
            aria-label="Mes anterior"
            className="flex h-8 w-8 items-center justify-center rounded-full text-texto-secundario transition-colors hover:bg-borde/50"
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

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-texto-secundario">
          {DIAS_SEMANA.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {celdas.map((dia, i) => {
            if (dia === null) return <span key={`vacio-${i}`} />;
            const fechaDia = fechaISOLocal(anio, mes, dia);
            const esPasado = fechaDia < hoy;
            const bloqueadoCompleto = diaCubiertoCompleto(fechaDia, bloqueos);
            const bloqueoParcial = !bloqueadoCompleto && diaTieneBloqueoParcial(fechaDia, bloqueos);
            const seleccionado = fechaDia === diaSeleccionado;

            return (
              <button
                key={fechaDia}
                type="button"
                disabled={esPasado}
                onClick={() => seleccionarDia(fechaDia)}
                className={`relative aspect-square rounded-lg text-sm transition-colors ${
                  seleccionado
                    ? "ring-2 ring-rosado ring-offset-1"
                    : ""
                } ${
                  esPasado
                    ? "text-texto-secundario/30"
                    : bloqueadoCompleto
                      ? "bg-bloqueado text-bloqueado-texto hover:brightness-95"
                      : "bg-fondo text-texto-primario hover:bg-rosado-suave"
                }`}
              >
                {dia}
                {bloqueoParcial && (
                  <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-alerta" />
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-texto-secundario">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-bloqueado" /> Día bloqueado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-alerta" /> Horario puntual bloqueado
          </span>
        </div>
      </div>

      {diaSeleccionado && (
        <div className="animar-aparecer mt-4 flex flex-col gap-3 rounded-2xl border border-borde bg-superficie p-5 shadow-sm">
          <p className="font-titulo capitalize text-texto-primario">
            {FORMATEADOR_DIA_LARGO.format(new Date(`${diaSeleccionado}T00:00:00`))}
          </p>

          {bloqueosDelDiaSeleccionado.length > 0 && (
            <div className="flex flex-col gap-2">
              {bloqueosDelDiaSeleccionado.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-borde bg-fondo px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-texto-primario">
                      {esBloqueoDeDiaCompleto(b) ? (
                        "Todo el día"
                      ) : (
                        <>
                          {FORMATEADOR_HORA.format(new Date(b.fecha_hora_inicio))}–
                          {FORMATEADOR_HORA.format(new Date(b.fecha_hora_fin))}
                        </>
                      )}
                    </p>
                    {(b.motivo || b.id_empleado) && (
                      <p className="truncate text-xs text-texto-secundario">
                        {b.id_empleado &&
                          (personal.find((p) => p.id === b.id_empleado)?.nombre ?? "Empleada")}
                        {b.motivo && b.id_empleado && " · "}
                        {b.motivo}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => borrarBloqueo(b.id)}
                    disabled={borrando === b.id}
                    aria-label="Borrar bloqueo"
                    className="flex shrink-0 items-center gap-1 text-xs font-semibold text-alerta transition-colors hover:text-texto-primario disabled:opacity-50"
                  >
                    {borrando === b.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {!yaTieneDiaCompleto && (
            <button
              type="button"
              onClick={bloquearDiaCompleto}
              disabled={guardando}
              className="flex items-center justify-center gap-1.5 rounded-full border border-borde px-4 py-2.5 text-sm font-semibold text-texto-primario transition-colors hover:bg-fondo disabled:opacity-50"
            >
              {guardando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Ban className="h-4 w-4" />
              )}
              Bloquear todo el día
            </button>
          )}

          {!formularioHorarioAbierto ? (
            <button
              type="button"
              onClick={() => setFormularioHorarioAbierto(true)}
              className="flex items-center justify-center gap-1.5 text-sm font-semibold text-rosado-texto transition-colors hover:text-texto-primario"
            >
              <Plus className="h-4 w-4" /> Bloquear un horario puntual
            </button>
          ) : (
            <form onSubmit={agregarBloqueoHorario} className="flex flex-col gap-3">
              <div className="flex gap-3">
                <label className="flex-1 text-sm text-texto-secundario">
                  Desde
                  <input
                    required
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-borde bg-fondo px-3 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
                  />
                </label>
                <label className="flex-1 text-sm text-texto-secundario">
                  Hasta
                  <input
                    required
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-borde bg-fondo px-3 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
                  />
                </label>
              </div>

              <label className="text-sm text-texto-secundario">
                Motivo (opcional)
                <input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Turno médico, etc."
                  className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
                />
              </label>

              {personal.length > 0 && (
                <label className="text-sm text-texto-secundario">
                  Empleada (opcional)
                  <select
                    value={idEmpleado}
                    onChange={(e) => setIdEmpleado(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
                  >
                    <option value="">Todo el negocio</option>
                    {personal.map((persona) => (
                      <option key={persona.id} value={persona.id}>
                        {persona.nombre}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {error && <p className="text-sm text-alerta">{error}</p>}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex items-center gap-1.5 rounded-full bg-rosado px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
                  {guardando ? "Guardando…" : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="text-sm text-texto-secundario"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {error && !formularioHorarioAbierto && (
            <p className="text-sm text-alerta">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
