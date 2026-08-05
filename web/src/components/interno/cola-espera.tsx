"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Loader2, Check, X, Play, Copy, CheckCheck, History } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type { TurnoFila, EstadoTurnoFila } from "@/lib/tipos";

const FORMATEADOR_HORA = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" });

function minutosDesde(fechaISO: string) {
  return Math.max(0, Math.round((Date.now() - new Date(fechaISO).getTime()) / 60000));
}

export function ColaEspera({
  idNegocio,
  turnosIniciales,
  slugPublico,
}: {
  idNegocio: string;
  turnosIniciales: TurnoFila[];
  slugPublico: string | null;
}) {
  const [turnos, setTurnos] = useState<TurnoFila[]>(turnosIniciales);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState<string | null>(null);
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlFila, setUrlFila] = useState(slugPublico ? `/${slugPublico}/fila` : "");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (slugPublico) setUrlFila(`${window.location.origin}/${slugPublico}/fila`);
  }, [slugPublico]);

  useEffect(() => {
    const supabase = crearClienteNavegador();
    const canal = supabase
      .channel(`cola_espera_${idNegocio}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cola_espera", filter: `id_negocio=eq.${idNegocio}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const nuevo = payload.new as TurnoFila;
            setTurnos((actual) => (actual.some((t) => t.id === nuevo.id) ? actual : [...actual, nuevo]));
          } else if (payload.eventType === "UPDATE") {
            const actualizado = payload.new as TurnoFila;
            setTurnos((actual) => actual.map((t) => (t.id === actualizado.id ? actualizado : t)));
          } else if (payload.eventType === "DELETE") {
            const idBorrado = (payload.old as { id: string }).id;
            setTurnos((actual) => actual.filter((t) => t.id !== idBorrado));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [idNegocio]);

  async function agregarWalkIn(evento: React.FormEvent) {
    evento.preventDefault();
    if (!nombre.trim()) return;
    setAgregando(true);
    setError(null);
    const supabase = crearClienteNavegador();
    const { data, error: errorGuardar } = await supabase
      .from("cola_espera")
      .insert({ id_negocio: idNegocio, nombre_cliente: nombre.trim(), telefono: telefono.trim() || null })
      .select("id, id_negocio, nombre_cliente, telefono, estado, creado_en")
      .single<TurnoFila>();

    setAgregando(false);
    if (errorGuardar) {
      setError(errorGuardar.message);
      return;
    }
    if (data) {
      setTurnos((actual) => (actual.some((t) => t.id === data.id) ? actual : [...actual, data]));
      setNombre("");
      setTelefono("");
      setFormularioAbierto(false);
    }
  }

  async function cambiarEstado(id: string, estado: EstadoTurnoFila) {
    setCambiandoEstado(id);
    const supabase = crearClienteNavegador();
    const { data, error: errorActualizar } = await supabase
      .from("cola_espera")
      .update({ estado })
      .eq("id", id)
      .select("id, id_negocio, nombre_cliente, telefono, estado, creado_en")
      .single<TurnoFila>();

    setCambiandoEstado(null);
    if (!errorActualizar && data) {
      setTurnos((actual) => actual.map((t) => (t.id === data.id ? data : t)));
    }
  }

  function copiarLink() {
    navigator.clipboard.writeText(urlFila).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  const enEspera = turnos
    .filter((t) => t.estado === "esperando" || t.estado === "atendiendo")
    .sort((a, b) => new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime());
  const historial = turnos
    .filter((t) => t.estado === "atendido" || t.estado === "cancelado")
    .sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime());

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-rosado-texto" />
        <h2 className="font-titulo text-lg font-semibold text-texto-primario">Cola de espera</h2>
      </div>
      <p className="mt-1 text-sm text-texto-secundario">
        Para los clientes que llegan sin turno — se actualiza sola, sin recargar la página.
      </p>

      {slugPublico && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-borde bg-fondo px-4 py-2.5">
          <p className="min-w-0 flex-1 truncate text-xs text-texto-secundario">{urlFila}</p>
          <button
            type="button"
            onClick={copiarLink}
            className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-rosado-texto transition-colors hover:text-texto-primario"
          >
            {copiado ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copiado ? "¡Copiado!" : "Copiar link para tus clientes"}
          </button>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-borde bg-superficie p-5 shadow-sm">
        {enEspera.length === 0 ? (
          <p className="py-4 text-center text-sm text-texto-secundario">
            No hay nadie esperando en este momento.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {enEspera.map((turno, i) => (
              <div
                key={turno.id}
                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 ${
                  turno.estado === "atendiendo"
                    ? "border-rosado bg-rosado-suave"
                    : "border-borde bg-fondo"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-superficie text-xs font-semibold text-texto-primario">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-texto-primario">
                      {turno.nombre_cliente}
                      {turno.estado === "atendiendo" && (
                        <span className="ml-2 text-xs font-normal text-rosado-texto">
                          Atendiendo ahora
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-texto-secundario">
                      Esperando hace {minutosDesde(turno.creado_en)} min
                      {turno.telefono ? ` · ${turno.telefono}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {cambiandoEstado === turno.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-texto-secundario" />
                  ) : turno.estado === "esperando" ? (
                    <button
                      type="button"
                      onClick={() => cambiarEstado(turno.id, "atendiendo")}
                      aria-label="Empezar a atender"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-exito transition-colors hover:bg-exito-suave"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => cambiarEstado(turno.id, "atendido")}
                      aria-label="Marcar como atendido"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-exito transition-colors hover:bg-exito-suave"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => cambiarEstado(turno.id, "cancelado")}
                    disabled={cambiandoEstado === turno.id}
                    aria-label="Cancelar turno"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-alerta transition-colors hover:bg-alerta-suave disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!formularioAbierto ? (
          <button
            type="button"
            onClick={() => setFormularioAbierto(true)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-borde px-4 py-2.5 text-sm font-semibold text-texto-primario transition-colors hover:bg-fondo"
          >
            <Plus className="h-4 w-4" /> Agregar cliente sin turno
          </button>
        ) : (
          <form onSubmit={agregarWalkIn} className="animar-aparecer mt-3 flex flex-col gap-3">
            <label className="text-sm text-texto-secundario">
              Nombre
              <input
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
              />
            </label>
            <label className="text-sm text-texto-secundario">
              Teléfono (opcional)
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
              />
            </label>
            {error && <p className="text-sm text-alerta">{error}</p>}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={agregando}
                className="flex items-center gap-1.5 rounded-full bg-rosado px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {agregando && <Loader2 className="h-4 w-4 animate-spin" />}
                {agregando ? "Agregando…" : "Agregar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormularioAbierto(false);
                  setError(null);
                }}
                className="text-sm text-texto-secundario"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {historial.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setHistorialAbierto((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-texto-secundario transition-colors hover:text-texto-primario"
          >
            <History className="h-3.5 w-3.5" />
            {historialAbierto ? "Ocultar historial de hoy" : `Ver historial de hoy (${historial.length})`}
          </button>
          {historialAbierto && (
            <div className="animar-aparecer mt-2 flex flex-col gap-1.5">
              {historial.map((turno) => (
                <div
                  key={turno.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-borde bg-fondo px-4 py-2 text-sm"
                >
                  <span className="truncate text-texto-primario">{turno.nombre_cliente}</span>
                  <span className="shrink-0 text-xs text-texto-secundario">
                    {FORMATEADOR_HORA.format(new Date(turno.creado_en))} ·{" "}
                    {turno.estado === "atendido" ? "Atendido" : "Cancelado"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
