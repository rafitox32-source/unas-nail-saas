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
  MessageSquareText,
  Plus,
  X,
} from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { formateadorPrecio } from "@/lib/formato";
import { descargarCSV } from "@/lib/csv";
import { ETIQUETA_METODO_PAGO, ICONO_METODO_PAGO, CLASES_METODO_PAGO } from "@/lib/metodo-pago";
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

function TarjetaCita({
  cita,
  ocupada,
  onCambiarEstado,
  onLiquidarYCompletar,
}: {
  cita: CitaAgenda;
  ocupada: boolean;
  onCambiarEstado: (id: string, estado: EstadoCita) => void;
  onLiquidarYCompletar: (cita: CitaAgenda, cargoExtra: { descripcion: string; monto: number } | null) => void;
}) {
  const IconoEstado = ICONO_ESTADO[cita.estado_cita];
  const [formularioExtraAbierto, setFormularioExtraAbierto] = useState(false);
  const [descripcionExtra, setDescripcionExtra] = useState("");
  const [montoExtra, setMontoExtra] = useState("");

  function completar() {
    const monto = Number(montoExtra);
    const cargoExtra =
      formularioExtraAbierto && descripcionExtra.trim() && monto > 0
        ? { descripcion: descripcionExtra.trim(), monto }
        : null;
    onLiquidarYCompletar(cita, cargoExtra);
  }

  return (
    <div className="rounded-2xl border border-borde bg-superficie p-5 shadow-sm transition-shadow hover:shadow-md">
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
          {cita.notas_clienta && (
            <p className="mt-1.5 flex items-start gap-1 rounded-lg bg-dorado-suave px-2.5 py-1.5 text-xs text-texto-primario">
              <MessageSquareText className="mt-0.5 h-3 w-3 shrink-0 text-dorado" />
              {cita.notas_clienta}
            </p>
          )}
          {cita.cargo_extra_monto && cita.cargo_extra_monto > 0 && (
            <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-dorado">
              <Plus className="h-3 w-3" />
              {cita.cargo_extra_descripcion} · {formateadorPrecio.format(cita.cargo_extra_monto)}
            </p>
          )}
        </div>
        <span
          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILO_INSIGNIA[cita.estado_cita]}`}
        >
          <IconoEstado className="h-3.5 w-3.5" />
          {ETIQUETA_ESTADO[cita.estado_cita]}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 text-texto-secundario">
          <span>
            Total {formateadorPrecio.format(cita.monto_total)} · Pagado{" "}
            {formateadorPrecio.format(cita.monto_seña_pagado)}
          </span>
          {cita.metodo_pago && (
            <span
              className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${CLASES_METODO_PAGO[cita.metodo_pago].fondoSuave} ${CLASES_METODO_PAGO[cita.metodo_pago].texto}`}
            >
              {(() => {
                const IconoMetodo = ICONO_METODO_PAGO[cita.metodo_pago];
                return <IconoMetodo className="h-3 w-3" />;
              })()}
              {ETIQUETA_METODO_PAGO[cita.metodo_pago]}
            </span>
          )}
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
        <div className="mt-4 flex flex-col gap-3 border-t border-borde pt-3">
          {ocupada ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-texto-secundario">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Actualizando…
            </span>
          ) : (
            <>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {cita.estado_cita === "pendiente_seña" && (
                  <button
                    type="button"
                    onClick={() => onCambiarEstado(cita.id, "confirmada")}
                    className="flex items-center gap-1 text-xs font-semibold text-exito transition-colors hover:text-texto-primario"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Confirmar abono
                  </button>
                )}
                {cita.estado_cita === "confirmada" && (
                  <button
                    type="button"
                    onClick={completar}
                    className="flex items-center gap-1 text-xs font-semibold text-dorado transition-colors hover:text-texto-primario"
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    Cobrar resto y completar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onCambiarEstado(cita.id, "no_asistio")}
                  className="flex items-center gap-1 text-xs font-semibold text-texto-secundario transition-colors hover:text-texto-primario"
                >
                  <UserX className="h-3.5 w-3.5" />
                  No asistió
                </button>
                <button
                  type="button"
                  onClick={() => onCambiarEstado(cita.id, "cancelada")}
                  className="flex items-center gap-1 text-xs font-semibold text-alerta transition-colors hover:text-texto-primario"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Cancelar
                </button>
              </div>

              {cita.estado_cita === "confirmada" && (
                <div>
                  {!formularioExtraAbierto ? (
                    <button
                      type="button"
                      onClick={() => setFormularioExtraAbierto(true)}
                      className="flex items-center gap-1 text-xs font-semibold text-texto-secundario transition-colors hover:text-texto-primario"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar cargo extra
                    </button>
                  ) : (
                    <div className="animar-aparecer flex flex-col gap-2 rounded-xl border border-borde bg-fondo p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-texto-primario">
                          Cargo extra (se suma al total al cobrar)
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setFormularioExtraAbierto(false);
                            setDescripcionExtra("");
                            setMontoExtra("");
                          }}
                          aria-label="Quitar cargo extra"
                          className="text-texto-secundario hover:text-alerta"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={descripcionExtra}
                          onChange={(e) => setDescripcionExtra(e.target.value)}
                          placeholder="Ej: Diseño a mano alzada"
                          className="min-w-0 flex-1 rounded-lg border border-borde bg-superficie px-3 py-2 text-xs text-texto-primario transition-colors focus:border-rosado focus:outline-none"
                        />
                        <input
                          value={montoExtra}
                          onChange={(e) => setMontoExtra(e.target.value)}
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="S/"
                          className="w-20 shrink-0 rounded-lg border border-borde bg-superficie px-3 py-2 text-xs text-texto-primario transition-colors focus:border-rosado focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
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
}

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

  async function liquidarYCompletar(
    cita: CitaAgenda,
    cargoExtra: { descripcion: string; monto: number } | null,
  ) {
    setActualizando(cita.id);
    const nuevoTotal = cita.monto_total + (cargoExtra?.monto ?? 0);
    const supabase = crearClienteNavegador();
    const { error } = await supabase
      .from("citas_apartados")
      .update({
        estado_cita: "completada",
        monto_total: nuevoTotal,
        monto_seña_pagado: nuevoTotal,
        cargo_extra_monto: cargoExtra?.monto ?? null,
        cargo_extra_descripcion: cargoExtra?.descripcion ?? null,
      })
      .eq("id", cita.id);
    if (!error) {
      setCitas((actual) =>
        actual.map((c) =>
          c.id === cita.id
            ? {
                ...c,
                estado_cita: "completada",
                monto_total: nuevoTotal,
                monto_seña_pagado: nuevoTotal,
                cargo_extra_monto: cargoExtra?.monto ?? null,
                cargo_extra_descripcion: cargoExtra?.descripcion ?? null,
              }
            : c,
        ),
      );
    }
    setActualizando(null);
  }

  function exportar() {
    descargarCSV(
      "agenda.csv",
      [
        "Clienta",
        "Teléfono",
        "Servicio",
        "Fecha y hora",
        "Estado",
        "Total",
        "Pagado",
        "Método de pago",
        "Notas",
        "Cargo extra",
        "Descripción cargo extra",
      ],
      citas.map((c) => [
        c.clientas?.nombre_completo ?? "",
        c.clientas?.telefono ?? "",
        c.servicios?.nombre ?? "",
        new Date(c.fecha_hora_inicio).toLocaleString("es-AR"),
        ETIQUETA_ESTADO[c.estado_cita],
        c.monto_total,
        c.monto_seña_pagado,
        c.metodo_pago ? ETIQUETA_METODO_PAGO[c.metodo_pago] : "",
        c.notas_clienta ?? "",
        c.cargo_extra_monto ?? "",
        c.cargo_extra_descripcion ?? "",
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
        {citasFiltradas.map((cita) => (
          <TarjetaCita
            key={cita.id}
            cita={cita}
            ocupada={actualizando === cita.id}
            onCambiarEstado={cambiarEstado}
            onLiquidarYCompletar={liquidarYCompletar}
          />
        ))}
      </div>
    </div>
  );
}
