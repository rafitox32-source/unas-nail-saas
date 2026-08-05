"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  BadgeCheck,
  Wallet,
  UserX,
  XCircle,
  Receipt,
  MessageCircle,
  CalendarX,
  Loader2,
  Download,
} from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { formateadorPrecio } from "@/lib/formato";
import { descargarCSV } from "@/lib/csv";
import type { CitaAgenda, EstadoCita, Personal } from "@/lib/tipos";

const formateadorFecha = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const ESTILO_INSIGNIA: Record<EstadoCita, string> = {
  pendiente_seña: "bg-alerta-suave text-alerta",
  confirmada: "bg-exito-suave text-exito",
  completada: "bg-dorado-suave text-dorado",
  cancelada: "bg-borde text-texto-secundario",
  no_asistio: "bg-borde text-texto-secundario",
};

const ETIQUETA_ESTADO: Record<EstadoCita, string> = {
  pendiente_seña: "Pendiente de abono",
  confirmada: "Confirmada",
  completada: "Completada",
  cancelada: "Cancelada",
  no_asistio: "No asistió",
};

const ICONO_ESTADO: Record<EstadoCita, typeof Clock> = {
  pendiente_seña: Clock,
  confirmada: CheckCircle2,
  completada: BadgeCheck,
  cancelada: XCircle,
  no_asistio: UserX,
};

export function GestionAgenda({
  citasIniciales,
  personal,
}: {
  citasIniciales: CitaAgenda[];
  personal: Personal[];
}) {
  const [citas, setCitas] = useState(citasIniciales);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [filtroEmpleado, setFiltroEmpleado] = useState<string>("todas");

  const citasFiltradas =
    filtroEmpleado === "todas" ? citas : citas.filter((c) => c.id_empleado === filtroEmpleado);

  async function cambiarEstado(id: string, estado: EstadoCita) {
    setActualizando(id);
    const supabase = crearClienteNavegador();
    const { error } = await supabase.from("citas_apartados").update({ estado_cita: estado }).eq("id", id);
    if (!error) {
      setCitas((actual) => actual.map((c) => (c.id === id ? { ...c, estado_cita: estado } : c)));
    }
    setActualizando(null);
  }

  async function liquidarYCompletar(cita: CitaAgenda) {
    setActualizando(cita.id);
    const supabase = crearClienteNavegador();
    const { error } = await supabase
      .from("citas_apartados")
      .update({ estado_cita: "completada", monto_seña_pagado: cita.monto_total })
      .eq("id", cita.id);
    if (!error) {
      setCitas((actual) =>
        actual.map((c) =>
          c.id === cita.id
            ? { ...c, estado_cita: "completada", monto_seña_pagado: c.monto_total }
            : c,
        ),
      );
    }
    setActualizando(null);
  }

  function exportar() {
    descargarCSV(
      "agenda.csv",
      ["Clienta", "Teléfono", "Servicio", "Fecha y hora", "Estado", "Total", "Pagado"],
      citas.map((c) => [
        c.clientas?.nombre_completo ?? "",
        c.clientas?.telefono ?? "",
        c.servicios?.nombre ?? "",
        new Date(c.fecha_hora_inicio).toLocaleString("es-AR"),
        ETIQUETA_ESTADO[c.estado_cita],
        c.monto_total,
        c.monto_seña_pagado,
      ]),
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-titulo text-2xl font-semibold text-texto-primario">Agenda</h1>
        <button
          type="button"
          onClick={exportar}
          disabled={citas.length === 0}
          aria-label="Exportar agenda a CSV"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-borde text-texto-secundario transition-colors hover:border-rosado hover:text-rosado-texto disabled:opacity-40"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      {personal.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFiltroEmpleado("todas")}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filtroEmpleado === "todas"
                ? "bg-rosado text-white"
                : "bg-borde/50 text-texto-primario"
            }`}
          >
            Todas
          </button>
          {personal.map((persona) => (
            <button
              key={persona.id}
              type="button"
              onClick={() => setFiltroEmpleado(persona.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filtroEmpleado === persona.id
                  ? "bg-rosado text-white"
                  : "bg-borde/50 text-texto-primario"
              }`}
            >
              {persona.nombre}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {citasFiltradas.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-borde py-12 text-center">
            <CalendarX className="h-8 w-8 text-texto-secundario" strokeWidth={1.5} />
            <p className="text-sm text-texto-secundario">Todavía no tenés citas reservadas.</p>
          </div>
        )}
        {citasFiltradas.map((cita) => {
          const IconoEstado = ICONO_ESTADO[cita.estado_cita];
          const ocupada = actualizando === cita.id;
          return (
            <div
              key={cita.id}
              className="rounded-2xl border border-borde bg-superficie p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-texto-primario">
                    {cita.clientas?.nombre_completo ?? "Clienta"}
                  </p>
                  <p className="truncate text-sm text-texto-secundario">
                    {cita.servicios?.nombre}
                    {cita.personal?.nombre && ` · ${cita.personal.nombre}`}
                  </p>
                  <p className="mt-1 text-sm text-texto-secundario">
                    {formateadorFecha.format(new Date(cita.fecha_hora_inicio))}
                  </p>
                </div>
                <span
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILO_INSIGNIA[cita.estado_cita]}`}
                >
                  <IconoEstado className="h-3.5 w-3.5" />
                  {ETIQUETA_ESTADO[cita.estado_cita]}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <span className="text-texto-secundario">
                  Total {formateadorPrecio.format(cita.monto_total)} · Pagado{" "}
                  {formateadorPrecio.format(cita.monto_seña_pagado)}
                </span>
                {cita.clientas?.telefono && (
                  <a
                    href={`https://wa.me/${cita.clientas.telefono.replace(/\D/g, "")}`}
                    className="flex shrink-0 items-center gap-1 font-semibold text-rosado-texto transition-colors hover:text-texto-primario"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                )}
              </div>

              {(cita.estado_cita === "pendiente_seña" || cita.estado_cita === "confirmada") && (
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-borde pt-3">
                  {ocupada ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-texto-secundario">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Actualizando…
                    </span>
                  ) : (
                    <>
                      {cita.estado_cita === "pendiente_seña" && (
                        <button
                          type="button"
                          onClick={() => cambiarEstado(cita.id, "confirmada")}
                          className="flex items-center gap-1 text-xs font-semibold text-exito transition-colors hover:text-texto-primario"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Confirmar abono
                        </button>
                      )}
                      {cita.estado_cita === "confirmada" && (
                        <button
                          type="button"
                          onClick={() => liquidarYCompletar(cita)}
                          className="flex items-center gap-1 text-xs font-semibold text-dorado transition-colors hover:text-texto-primario"
                        >
                          <Wallet className="h-3.5 w-3.5" />
                          Cobrar resto y completar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => cambiarEstado(cita.id, "no_asistio")}
                        className="flex items-center gap-1 text-xs font-semibold text-texto-secundario transition-colors hover:text-texto-primario"
                      >
                        <UserX className="h-3.5 w-3.5" />
                        No asistió
                      </button>
                      <button
                        type="button"
                        onClick={() => cambiarEstado(cita.id, "cancelada")}
                        className="flex items-center gap-1 text-xs font-semibold text-alerta transition-colors hover:text-texto-primario"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              )}

              {cita.estado_cita === "completada" && (
                <div className="mt-4 border-t border-borde pt-3">
                  <Link
                    href={`/panel/recibo/${cita.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-rosado-texto transition-colors hover:text-texto-primario"
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    Ver recibo →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
