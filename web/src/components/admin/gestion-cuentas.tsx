"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Clock3, Phone, Inbox } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type { CuentaAdmin, EstadoCuenta } from "@/lib/tipos";

const formateadorFecha = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const ETIQUETA_ESTADO: Record<EstadoCuenta, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};

const ESTILO_INSIGNIA: Record<EstadoCuenta, string> = {
  pendiente: "bg-dorado-suave text-dorado",
  aprobada: "bg-exito-suave text-exito",
  rechazada: "bg-alerta-suave text-alerta",
};

export function GestionCuentas({ cuentasIniciales }: { cuentasIniciales: CuentaAdmin[] }) {
  const [cuentas, setCuentas] = useState(cuentasIniciales);
  const [actualizando, setActualizando] = useState<string | null>(null);

  async function cambiarEstado(cuenta: CuentaAdmin, estado: EstadoCuenta) {
    setActualizando(cuenta.id);
    const supabase = crearClienteNavegador();
    const { error } = await supabase
      .from("usuarios_manicuristas")
      .update({ estado_cuenta: estado })
      .eq("id", cuenta.id);
    if (!error) {
      setCuentas((actual) =>
        actual.map((c) => (c.id === cuenta.id ? { ...c, estado_cuenta: estado } : c)),
      );
    }
    setActualizando(null);
  }

  const pendientes = cuentas.filter((c) => c.estado_cuenta === "pendiente");
  const resueltas = cuentas.filter((c) => c.estado_cuenta !== "pendiente");

  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-texto-secundario">
        Pendientes de aprobar {pendientes.length > 0 && `(${pendientes.length})`}
      </h2>

      <div className="mt-3 flex flex-col gap-3">
        {pendientes.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-borde py-10 text-center">
            <Inbox className="h-7 w-7 text-texto-secundario" strokeWidth={1.5} />
            <p className="text-sm text-texto-secundario">No hay registros esperando aprobación.</p>
          </div>
        )}
        {pendientes.map((cuenta) => {
          const ocupada = actualizando === cuenta.id;
          return (
            <div
              key={cuenta.id}
              className="rounded-2xl border border-borde bg-superficie p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-texto-primario">
                    {cuenta.nombre_negocio}
                  </p>
                  <p className="text-sm text-texto-secundario">
                    {cuenta.nombre_completo} · @{cuenta.usuario}
                  </p>
                  {cuenta.telefono && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-texto-secundario">
                      <Phone className="h-3 w-3" /> {cuenta.telefono}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-texto-secundario">
                  {formateadorFecha.format(new Date(cuenta.creado_en))}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-4 border-t border-borde pt-3">
                {ocupada ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-texto-secundario">
                    <Clock3 className="h-3.5 w-3.5" /> Actualizando…
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => cambiarEstado(cuenta, "aprobada")}
                      className="flex items-center gap-1 text-sm font-semibold text-exito transition-colors hover:text-texto-primario"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => cambiarEstado(cuenta, "rechazada")}
                      className="flex items-center gap-1 text-sm font-semibold text-alerta transition-colors hover:text-texto-primario"
                    >
                      <XCircle className="h-4 w-4" /> Rechazar
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {resueltas.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-texto-secundario">
            Ya revisadas
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            {resueltas.map((cuenta) => (
              <div
                key={cuenta.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-borde bg-superficie px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-texto-primario">
                    {cuenta.nombre_negocio}
                  </p>
                  <p className="truncate text-xs text-texto-secundario">@{cuenta.usuario}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILO_INSIGNIA[cuenta.estado_cuenta]}`}
                >
                  {ETIQUETA_ESTADO[cuenta.estado_cuenta]}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
