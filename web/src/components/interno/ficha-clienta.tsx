"use client";

import { useState } from "react";
import { TrendingUp, Loader2, CheckCircle2, CalendarClock, Gift } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { NotaVisita } from "@/components/interno/nota-visita";
import { formateadorPrecio } from "@/lib/formato";
import type {
  ClientaAdmin,
  CitaHistorial,
  EstadoCita,
  NotaVisita as TipoNotaVisita,
  FotoFirmada,
  ProgramaLealtad,
} from "@/lib/tipos";

const formateadorFecha = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const ETIQUETA_ESTADO: Record<EstadoCita, string> = {
  pendiente_seña: "Pendiente de abono",
  confirmada: "Confirmada",
  completada: "Completada",
  cancelada: "Cancelada",
  no_asistio: "No asistió",
};

export function FichaClienta({
  clienta,
  idNegocio,
  historial,
  notasPorCita,
  lealtad,
}: {
  clienta: ClientaAdmin;
  idNegocio: string;
  historial: CitaHistorial[];
  notasPorCita: Record<string, { nota: TipoNotaVisita | null; fotos: FotoFirmada[] }>;
  lealtad: ProgramaLealtad;
}) {
  const [alergias, setAlergias] = useState(clienta.alergias ?? "");
  const [notas, setNotas] = useState(clienta.notas_internas ?? "");
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [premiosCanjeados, setPremiosCanjeados] = useState(clienta.premios_canjeados);
  const [canjeando, setCanjeando] = useState(false);

  async function guardar() {
    setGuardando(true);
    setGuardado(false);
    const supabase = crearClienteNavegador();
    const { error } = await supabase
      .from("clientas")
      .update({ alergias: alergias || null, notas_internas: notas || null })
      .eq("id", clienta.id);
    setGuardando(false);
    if (!error) setGuardado(true);
  }

  const objetivo = lealtad.lealtad_visitas_objetivo ?? 0;
  const premiosDisponibles =
    lealtad.lealtad_activo && objetivo > 0
      ? Math.floor(clienta.visitas_completadas / objetivo) - premiosCanjeados
      : 0;
  const visitasEnCicloActual = objetivo > 0 ? clienta.visitas_completadas % objetivo : 0;

  async function canjearPremio() {
    setCanjeando(true);
    const supabase = crearClienteNavegador();
    const { error } = await supabase
      .from("clientas")
      .update({ premios_canjeados: premiosCanjeados + 1 })
      .eq("id", clienta.id);
    setCanjeando(false);
    if (!error) setPremiosCanjeados((actual) => actual + 1);
  }

  return (
    <div>
      <h1 className="font-titulo text-2xl font-semibold text-texto-primario">
        {clienta.nombre_completo}
      </h1>
      <p className="text-sm text-texto-secundario">{clienta.telefono}</p>

      <div className="mt-4 rounded-2xl border border-borde bg-superficie p-5 shadow-sm">
        <p className="flex items-center gap-1.5 text-sm text-texto-secundario">
          <TrendingUp className="h-4 w-4" /> Valor de vida (LTV)
        </p>
        <p className="font-titulo text-2xl font-semibold text-dorado">
          {formateadorPrecio.format(clienta.valor_vida_cliente)}
        </p>
        <p className="mt-1 text-xs text-texto-secundario">
          Se suma automáticamente al marcar una cita como completada.
        </p>
      </div>

      {lealtad.lealtad_activo && objetivo > 0 && (
        <div className="mt-4 rounded-2xl border border-borde bg-superficie p-5 shadow-sm">
          <p className="flex items-center gap-1.5 text-sm text-texto-secundario">
            <Gift className="h-4 w-4" /> Programa de lealtad
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-borde">
            <div
              className="h-full rounded-full bg-rosado transition-all"
              style={{ width: `${(visitasEnCicloActual / objetivo) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-texto-secundario">
            {visitasEnCicloActual} de {objetivo} visitas para: {lealtad.lealtad_premio_descripcion}
          </p>
          {premiosDisponibles > 0 && (
            <button
              type="button"
              onClick={canjearPremio}
              disabled={canjeando}
              className="mt-3 flex items-center gap-1.5 rounded-full bg-dorado-boton px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {canjeando && <Loader2 className="h-4 w-4 animate-spin" />}
              {canjeando
                ? "Canjeando…"
                : `Canjear premio${premiosDisponibles > 1 ? ` (${premiosDisponibles} disponibles)` : ""}`}
            </button>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-borde bg-superficie p-5 shadow-sm">
        <label className="text-sm text-texto-secundario">
          Alergias
          <textarea
            value={alergias}
            onChange={(e) => setAlergias(e.target.value)}
            placeholder="Sin alergias conocidas"
            className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
          />
        </label>
        <label className="text-sm text-texto-secundario">
          Notas internas
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Preferencias generales, etc."
            className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="flex items-center gap-1.5 rounded-full bg-rosado px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            {guardando ? "Guardando…" : "Guardar"}
          </button>
          {guardado && (
            <span className="animar-aparecer flex items-center gap-1 text-xs text-exito">
              <CheckCircle2 className="h-3.5 w-3.5" /> Guardado
            </span>
          )}
        </div>
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-texto-secundario">
        Historial de citas
      </h2>
      <div className="mt-3 flex flex-col gap-2">
        {historial.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-borde py-10 text-center">
            <CalendarClock className="h-7 w-7 text-texto-secundario" strokeWidth={1.5} />
            <p className="text-sm text-texto-secundario">Todavía no tiene citas.</p>
          </div>
        )}
        {historial.map((cita) => {
          const infoNota = notasPorCita[cita.id] ?? { nota: null, fotos: [] };
          return (
            <div
              key={cita.id}
              className="rounded-xl border border-borde bg-superficie px-4 py-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-texto-primario">
                    {cita.servicios?.nombre}
                  </p>
                  <p className="text-xs text-texto-secundario">
                    {formateadorFecha.format(new Date(cita.fecha_hora_inicio))} ·{" "}
                    {ETIQUETA_ESTADO[cita.estado_cita]}
                  </p>
                </div>
                <span className="shrink-0 text-sm text-texto-secundario">
                  {formateadorPrecio.format(cita.monto_total)}
                </span>
              </div>
              <NotaVisita
                idCita={cita.id}
                idNegocio={idNegocio}
                notaInicial={infoNota.nota}
                fotosIniciales={infoNota.fotos}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
