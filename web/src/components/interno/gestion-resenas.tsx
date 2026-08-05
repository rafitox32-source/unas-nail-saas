"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Star, MessageSquareQuote } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type { ResenaAdmin } from "@/lib/tipos";

interface ValoresFormulario {
  nombre_clienta: string;
  calificacion: number;
  comentario: string;
}

const VACIO: ValoresFormulario = { nombre_clienta: "", calificacion: 5, comentario: "" };

const columnas = "id, nombre_clienta, calificacion, comentario, visible";

function Estrellas({
  valor,
  onChange,
}: {
  valor: number;
  onChange?: (valor: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={`${n} estrella${n === 1 ? "" : "s"}`}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            className={`h-5 w-5 ${n <= valor ? "fill-dorado text-dorado" : "text-borde"}`}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

export function GestionResenas({
  idNegocio,
  resenasIniciales,
}: {
  idNegocio: string;
  resenasIniciales: ResenaAdmin[];
}) {
  const [resenas, setResenas] = useState(resenasIniciales);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [valores, setValores] = useState<ValoresFormulario>(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function abrirNuevo() {
    setEditandoId(null);
    setValores(VACIO);
    setFormularioAbierto(true);
    setError(null);
  }

  function abrirEdicion(resena: ResenaAdmin) {
    setEditandoId(resena.id);
    setValores({
      nombre_clienta: resena.nombre_clienta,
      calificacion: resena.calificacion,
      comentario: resena.comentario,
    });
    setFormularioAbierto(true);
    setError(null);
  }

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);

    const supabase = crearClienteNavegador();
    const payload = {
      nombre_clienta: valores.nombre_clienta.trim(),
      calificacion: valores.calificacion,
      comentario: valores.comentario.trim(),
    };

    if (editandoId) {
      const { data, error: errorGuardar } = await supabase
        .from("resenas")
        .update(payload)
        .eq("id", editandoId)
        .select(columnas)
        .single<ResenaAdmin>();

      if (errorGuardar) setError(errorGuardar.message);
      else if (data) {
        setResenas((actual) => actual.map((r) => (r.id === data.id ? data : r)));
        setFormularioAbierto(false);
      }
    } else {
      const { data, error: errorGuardar } = await supabase
        .from("resenas")
        .insert({ ...payload, id_negocio: idNegocio })
        .select(columnas)
        .single<ResenaAdmin>();

      if (errorGuardar) setError(errorGuardar.message);
      else if (data) {
        setResenas((actual) => [data, ...actual]);
        setFormularioAbierto(false);
      }
    }

    setGuardando(false);
  }

  async function alternarVisible(resena: ResenaAdmin) {
    const supabase = crearClienteNavegador();
    const { data } = await supabase
      .from("resenas")
      .update({ visible: !resena.visible })
      .eq("id", resena.id)
      .select(columnas)
      .single<ResenaAdmin>();
    if (data) setResenas((actual) => actual.map((r) => (r.id === data.id ? data : r)));
  }

  async function borrar(resena: ResenaAdmin) {
    if (!confirm(`¿Borrar la reseña de "${resena.nombre_clienta}"?`)) return;
    const supabase = crearClienteNavegador();
    const { error: errorBorrar } = await supabase.from("resenas").delete().eq("id", resena.id);
    if (!errorBorrar) setResenas((actual) => actual.filter((r) => r.id !== resena.id));
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-titulo text-lg font-semibold text-texto-primario">Reseñas</h2>
        <button
          type="button"
          onClick={abrirNuevo}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-rosado px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> Agregar
        </button>
      </div>
      <p className="mt-1 text-xs text-texto-secundario">
        Cargá vos misma los comentarios de tus clientas (por ejemplo, los que te mandan por
        WhatsApp) — se muestran en tu página pública las que dejes visibles.
      </p>

      {formularioAbierto && (
        <form
          onSubmit={guardar}
          className="animar-aparecer mt-6 flex flex-col gap-3 rounded-2xl border border-borde bg-superficie p-5 shadow-sm"
        >
          <label className="text-sm text-texto-secundario">
            Nombre de la clienta
            <input
              required
              value={valores.nombre_clienta}
              onChange={(e) => setValores({ ...valores, nombre_clienta: e.target.value })}
              placeholder="Camila R."
              className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
            />
          </label>
          <div className="text-sm text-texto-secundario">
            Calificación
            <div className="mt-1">
              <Estrellas
                valor={valores.calificacion}
                onChange={(v) => setValores({ ...valores, calificacion: v })}
              />
            </div>
          </div>
          <label className="text-sm text-texto-secundario">
            Comentario
            <textarea
              required
              value={valores.comentario}
              onChange={(e) => setValores({ ...valores, comentario: e.target.value })}
              placeholder="Excelente atención, súper prolija con el esmaltado semipermanente."
              className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
            />
          </label>

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
              onClick={() => setFormularioAbierto(false)}
              className="text-sm text-texto-secundario"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {resenas.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-borde py-12 text-center">
            <MessageSquareQuote className="h-8 w-8 text-texto-secundario" strokeWidth={1.5} />
            <p className="text-sm text-texto-secundario">Todavía no cargaste ninguna reseña.</p>
          </div>
        )}
        {resenas.map((resena) => (
          <div
            key={resena.id}
            className={`flex flex-col gap-2 rounded-2xl border border-borde p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-start sm:justify-between ${
              resena.visible ? "bg-superficie" : "bg-borde/30"
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-texto-primario">{resena.nombre_clienta}</p>
                {!resena.visible && (
                  <span className="rounded-full bg-borde px-2 py-0.5 text-[11px] font-semibold text-texto-primario">
                    Oculta
                  </span>
                )}
              </div>
              <Estrellas valor={resena.calificacion} />
              <p className="mt-1 text-sm text-texto-secundario">{resena.comentario}</p>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <button
                type="button"
                onClick={() => alternarVisible(resena)}
                aria-label={resena.visible ? "Ocultar reseña" : "Mostrar reseña"}
                className="flex items-center gap-1 text-xs font-semibold text-texto-secundario transition-colors hover:text-texto-primario"
              >
                {resena.visible ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                {resena.visible ? "Ocultar" : "Mostrar"}
              </button>
              <button
                type="button"
                onClick={() => abrirEdicion(resena)}
                aria-label="Editar reseña"
                className="flex items-center gap-1 text-xs font-semibold text-rosado-texto transition-colors hover:text-texto-primario"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => borrar(resena)}
                aria-label="Borrar reseña"
                className="flex items-center gap-1 text-xs font-semibold text-alerta transition-colors hover:text-texto-primario"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
