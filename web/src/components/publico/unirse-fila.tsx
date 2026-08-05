"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Users, Scissors, CheckCircle2, XCircle, Clock } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type { EstadoTurnoFila } from "@/lib/tipos";

interface EstadoTurno {
  id: string;
  estado: EstadoTurnoFila;
  posicion: number | null;
}

export function UnirseFila({
  slugPublico,
  nombreNegocio,
}: {
  slugPublico: string;
  nombreNegocio: string;
}) {
  const claveStorage = `florece_fila_${slugPublico}`;
  const [turno, setTurno] = useState<EstadoTurno | null>(null);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [uniendose, setUniendose] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function consultarPosicion(id: string) {
    const supabase = crearClienteNavegador();
    const { data, error: errorConsulta } = await supabase
      .rpc("posicion_en_fila", { p_id: id })
      .maybeSingle<{ estado: EstadoTurnoFila; posicion: number | null; nombre_negocio: string }>();

    if (errorConsulta || !data) {
      localStorage.removeItem(claveStorage);
      setTurno(null);
      return;
    }
    setTurno({ id, estado: data.estado, posicion: data.posicion });
  }

  useEffect(() => {
    const idGuardado = localStorage.getItem(claveStorage);
    if (idGuardado) {
      consultarPosicion(idGuardado).finally(() => setCargandoInicial(false));
    } else {
      setCargandoInicial(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    if (turno && (turno.estado === "esperando" || turno.estado === "atendiendo")) {
      intervaloRef.current = setInterval(() => consultarPosicion(turno.id), 5000);
    }
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turno?.id, turno?.estado]);

  async function unirseAFila(evento: React.FormEvent) {
    evento.preventDefault();
    if (!nombre.trim()) return;
    setUniendose(true);
    setError(null);
    const supabase = crearClienteNavegador();
    const { data, error: errorUnirse } = await supabase
      .rpc("unirse_a_fila", {
        p_slug_publico: slugPublico,
        p_nombre_cliente: nombre.trim(),
        p_telefono: telefono.trim() || null,
      })
      .maybeSingle<{ id: string; posicion: number }>();

    setUniendose(false);
    if (errorUnirse || !data) {
      setError("No pudimos sumarte a la fila. Probá de nuevo en un momento.");
      return;
    }
    localStorage.setItem(claveStorage, data.id);
    setTurno({ id: data.id, estado: "esperando", posicion: data.posicion });
  }

  async function cancelarTurno() {
    if (!turno) return;
    setCancelando(true);
    const supabase = crearClienteNavegador();
    await supabase.rpc("cancelar_mi_turno", { p_id: turno.id });
    setCancelando(false);
    localStorage.removeItem(claveStorage);
    setTurno(null);
    setNombre("");
    setTelefono("");
  }

  function unirseDeNuevo() {
    localStorage.removeItem(claveStorage);
    setTurno(null);
    setNombre("");
    setTelefono("");
  }

  if (cargandoInicial) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-texto-secundario" />
      </div>
    );
  }

  if (turno) {
    if (turno.estado === "esperando") {
      return (
        <div className="animar-aparecer flex flex-col items-center gap-4 rounded-3xl border border-borde bg-superficie p-8 text-center shadow-sm">
          <Users className="h-9 w-9 text-rosado-texto" />
          <p className="text-sm text-texto-secundario">Tu lugar en la fila</p>
          <p className="font-titulo text-6xl font-semibold text-texto-primario">
            {turno.posicion ?? "…"}
          </p>
          <p className="max-w-xs text-sm text-texto-secundario">
            {turno.posicion === 1
              ? "¡Sos el siguiente! Acercate cuando puedas."
              : `Hay ${(turno.posicion ?? 1) - 1} persona${(turno.posicion ?? 1) - 1 === 1 ? "" : "s"} antes que vos.`}
          </p>
          <button
            type="button"
            onClick={cancelarTurno}
            disabled={cancelando}
            className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-alerta transition-colors hover:text-texto-primario disabled:opacity-50"
          >
            {cancelando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Cancelar mi turno
          </button>
        </div>
      );
    }

    if (turno.estado === "atendiendo") {
      return (
        <div className="animar-aparecer flex flex-col items-center gap-4 rounded-3xl border border-rosado bg-rosado-suave p-8 text-center shadow-sm">
          <Scissors className="h-9 w-9 text-rosado-texto" />
          <p className="font-titulo text-2xl font-semibold text-texto-primario">
            ¡Te están atendiendo!
          </p>
          <p className="max-w-xs text-sm text-texto-secundario">Acercate al mostrador si todavía no lo hiciste.</p>
        </div>
      );
    }

    if (turno.estado === "atendido") {
      return (
        <div className="animar-aparecer flex flex-col items-center gap-4 rounded-3xl border border-borde bg-superficie p-8 text-center shadow-sm">
          <CheckCircle2 className="h-9 w-9 text-exito" />
          <p className="font-titulo text-2xl font-semibold text-texto-primario">¡Gracias por tu visita!</p>
          <button
            type="button"
            onClick={unirseDeNuevo}
            className="mt-2 text-sm font-semibold text-rosado-texto hover:text-texto-primario"
          >
            Unirme a la fila de nuevo
          </button>
        </div>
      );
    }

    return (
      <div className="animar-aparecer flex flex-col items-center gap-4 rounded-3xl border border-borde bg-superficie p-8 text-center shadow-sm">
        <XCircle className="h-9 w-9 text-texto-secundario" />
        <p className="font-titulo text-2xl font-semibold text-texto-primario">Tu turno fue cancelado</p>
        <button
          type="button"
          onClick={unirseDeNuevo}
          className="mt-2 text-sm font-semibold text-rosado-texto hover:text-texto-primario"
        >
          Unirme a la fila de nuevo
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={unirseAFila}
      className="animar-aparecer flex flex-col gap-4 rounded-3xl border border-borde bg-superficie p-8 shadow-sm"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <Clock className="h-8 w-8 text-rosado-texto" />
        <p className="text-sm text-texto-secundario">
          Sumate a la fila de {nombreNegocio} sin sacar turno — te avisamos acá mismo cuando te toque.
        </p>
      </div>
      <label className="text-sm text-texto-secundario">
        Tu nombre
        <input
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-3 text-base text-texto-primario transition-colors focus:border-rosado focus:outline-none"
        />
      </label>
      <label className="text-sm text-texto-secundario">
        Teléfono (opcional)
        <input
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-3 text-base text-texto-primario transition-colors focus:border-rosado focus:outline-none"
        />
      </label>
      {error && <p className="text-sm text-alerta">{error}</p>}
      <button
        type="submit"
        disabled={uniendose}
        className="mt-1 flex items-center justify-center gap-1.5 rounded-full bg-rosado px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-white shadow-[0_6px_16px_rgba(147,80,96,0.4)] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
      >
        {uniendose && <Loader2 className="h-4 w-4 animate-spin" />}
        {uniendose ? "Sumándote…" : "Unirme a la fila"}
      </button>
    </form>
  );
}
