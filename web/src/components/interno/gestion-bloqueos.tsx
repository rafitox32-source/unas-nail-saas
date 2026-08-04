"use client";

import { useState } from "react";
import { CalendarOff, Loader2, Trash2, Plus } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type { BloqueoAgenda, Personal } from "@/lib/tipos";

const formateadorFecha = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
});
const formateadorHora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" });

function hoyISO() {
  const hoy = new Date();
  const desfaseMinutos = hoy.getTimezoneOffset();
  const local = new Date(hoy.getTime() - desfaseMinutos * 60000);
  return local.toISOString().slice(0, 10);
}

export function GestionBloqueos({
  idManicurista,
  bloqueosIniciales,
  personal,
}: {
  idManicurista: string;
  bloqueosIniciales: BloqueoAgenda[];
  personal: Personal[];
}) {
  const [bloqueos, setBloqueos] = useState(
    [...bloqueosIniciales].sort((a, b) => a.fecha_hora_inicio.localeCompare(b.fecha_hora_inicio)),
  );
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [fecha, setFecha] = useState(hoyISO());
  const [diaCompleto, setDiaCompleto] = useState(true);
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("18:00");
  const [motivo, setMotivo] = useState("");
  const [idEmpleado, setIdEmpleado] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function agregarBloqueo(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);

    const inicio = diaCompleto ? `${fecha}T00:00:00` : `${fecha}T${horaInicio}:00`;
    const fin = diaCompleto
      ? `${new Date(new Date(fecha).getTime() + 86400000).toISOString().slice(0, 10)}T00:00:00`
      : `${fecha}T${horaFin}:00`;

    if (!diaCompleto && horaFin <= horaInicio) {
      setError("La hora de fin tiene que ser después de la de inicio.");
      return;
    }

    setGuardando(true);
    const supabase = crearClienteNavegador();
    const { data, error: errorGuardar } = await supabase
      .from("bloqueos_agenda")
      .insert({
        id_manicurista: idManicurista,
        fecha_hora_inicio: new Date(inicio).toISOString(),
        fecha_hora_fin: new Date(fin).toISOString(),
        motivo: motivo || null,
        id_empleado: idEmpleado || null,
      })
      .select("id, fecha_hora_inicio, fecha_hora_fin, motivo, id_empleado")
      .single<BloqueoAgenda>();

    setGuardando(false);
    if (errorGuardar) {
      setError(errorGuardar.message);
    } else if (data) {
      setBloqueos((actual) =>
        [...actual, data].sort((a, b) => a.fecha_hora_inicio.localeCompare(b.fecha_hora_inicio)),
      );
      setMotivo("");
      setIdEmpleado("");
      setFormularioAbierto(false);
    }
  }

  async function borrarBloqueo(id: string) {
    setBorrando(id);
    const supabase = crearClienteNavegador();
    const { error: errorBorrar } = await supabase.from("bloqueos_agenda").delete().eq("id", id);
    setBorrando(null);
    if (!errorBorrar) setBloqueos((actual) => actual.filter((b) => b.id !== id));
  }

  function esDiaCompleto(b: BloqueoAgenda) {
    const inicio = new Date(b.fecha_hora_inicio);
    const fin = new Date(b.fecha_hora_fin);
    return (
      inicio.getHours() === 0 &&
      inicio.getMinutes() === 0 &&
      fin.getTime() - inicio.getTime() >= 86400000 - 1
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-titulo text-lg font-semibold text-texto-primario">
          Bloquear horarios
        </h2>
        <button
          type="button"
          onClick={() => setFormularioAbierto((v) => !v)}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-rosado px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> Bloquear
        </button>
      </div>
      <p className="mt-1 text-sm text-texto-secundario">
        Marcá un día libre o un rango de horas en el que no trabajás — tus clientas no van a
        poder reservar ahí.
      </p>

      {formularioAbierto && (
        <form
          onSubmit={agregarBloqueo}
          className="animar-aparecer mt-4 flex flex-col gap-3 rounded-2xl border border-borde bg-superficie p-5 shadow-sm"
        >
          <label className="text-sm text-texto-secundario">
            Fecha
            <input
              required
              type="date"
              min={hoyISO()}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-texto-secundario">
            <input
              type="checkbox"
              checked={diaCompleto}
              onChange={(e) => setDiaCompleto(e.target.checked)}
              className="h-4 w-4 accent-rosado"
            />
            Todo el día
          </label>

          {!diaCompleto && (
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
          )}

          <label className="text-sm text-texto-secundario">
            Motivo (opcional)
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Vacaciones, turno médico, etc."
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
                <option value="">Toda la cuenta</option>
                {personal.map((persona) => (
                  <option key={persona.id} value={persona.id}>
                    {persona.nombre}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-texto-secundario">
                Sin elegir empleada, el bloqueo aplica a todo el negocio.
              </span>
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
              {guardando ? "Guardando…" : "Guardar bloqueo"}
            </button>
            <button
              type="button"
              onClick={() => setFormularioAbierto(false)}
              className="text-sm text-texto-secundario"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {bloqueos.length === 0 && !formularioAbierto && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-borde py-8 text-center">
            <CalendarOff className="h-6 w-6 text-texto-secundario" strokeWidth={1.5} />
            <p className="text-sm text-texto-secundario">No tenés bloqueos cargados.</p>
          </div>
        )}
        {bloqueos.map((b) => (
          <div
            key={b.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-borde bg-superficie px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-texto-primario">
                {formateadorFecha.format(new Date(b.fecha_hora_inicio))}
                {esDiaCompleto(b) ? (
                  " · Todo el día"
                ) : (
                  <>
                    {" · "}
                    {formateadorHora.format(new Date(b.fecha_hora_inicio))}–
                    {formateadorHora.format(new Date(b.fecha_hora_fin))}
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
    </div>
  );
}
