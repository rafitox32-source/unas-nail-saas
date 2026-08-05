"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Power, Loader2, Users } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type { Personal, CategoriaServicio } from "@/lib/tipos";

interface ValoresFormulario {
  nombre: string;
  categoria: CategoriaServicio;
}

const VACIO: ValoresFormulario = { nombre: "", categoria: "uñas" };

const columnas = "id, nombre, categoria, url_foto, activo";

const ETIQUETAS_CATEGORIA: Record<CategoriaServicio, string> = {
  cabello: "Cabello",
  barberia: "Barbería",
  pestañas: "Pestañas",
  uñas: "Uñas",
  costura: "Costura",
  otro: "Otro",
};

export function GestionPersonal({
  idNegocio,
  personalInicial,
}: {
  idNegocio: string;
  personalInicial: Personal[];
}) {
  const [personal, setPersonal] = useState(personalInicial);
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

  function abrirEdicion(persona: Personal) {
    setEditandoId(persona.id);
    setValores({ nombre: persona.nombre, categoria: persona.categoria });
    setFormularioAbierto(true);
    setError(null);
  }

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);

    const supabase = crearClienteNavegador();
    const payload = { nombre: valores.nombre, categoria: valores.categoria };

    if (editandoId) {
      const { data, error: errorGuardar } = await supabase
        .from("personal")
        .update(payload)
        .eq("id", editandoId)
        .select(columnas)
        .single<Personal>();

      if (errorGuardar) setError(errorGuardar.message);
      else if (data) {
        setPersonal((actual) => actual.map((p) => (p.id === data.id ? data : p)));
        setFormularioAbierto(false);
      }
    } else {
      const { data, error: errorGuardar } = await supabase
        .from("personal")
        .insert({ ...payload, id_negocio: idNegocio })
        .select(columnas)
        .single<Personal>();

      if (errorGuardar) setError(errorGuardar.message);
      else if (data) {
        setPersonal((actual) => [...actual, data]);
        setFormularioAbierto(false);
      }
    }

    setGuardando(false);
  }

  async function alternarActivo(persona: Personal) {
    const supabase = crearClienteNavegador();
    const { data } = await supabase
      .from("personal")
      .update({ activo: !persona.activo })
      .eq("id", persona.id)
      .select(columnas)
      .single<Personal>();
    if (data) setPersonal((actual) => actual.map((p) => (p.id === data.id ? data : p)));
  }

  async function borrar(persona: Personal) {
    if (
      !confirm(
        `¿Borrar a "${persona.nombre}" de tu personal? Los servicios que tenía asignados quedan sin asignar, no se borran.`,
      )
    )
      return;
    const supabase = crearClienteNavegador();
    const { error: errorBorrar } = await supabase.from("personal").delete().eq("id", persona.id);
    if (!errorBorrar) setPersonal((actual) => actual.filter((p) => p.id !== persona.id));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-titulo text-2xl font-semibold text-texto-primario">Personal</h1>
        <button
          type="button"
          onClick={abrirNuevo}
          className="flex items-center gap-1.5 rounded-full bg-rosado px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> Agregar
        </button>
      </div>
      <p className="mt-1 text-sm text-texto-secundario">
        Cargá a las profesionales de tu equipo para poder asignarles servicios.
      </p>

      {formularioAbierto && (
        <form
          onSubmit={guardar}
          className="animar-aparecer mt-6 flex flex-col gap-3 rounded-2xl border border-borde bg-superficie p-5 shadow-sm"
        >
          <label className="text-sm text-texto-secundario">
            Nombre
            <input
              required
              value={valores.nombre}
              onChange={(e) => setValores({ ...valores, nombre: e.target.value })}
              placeholder="Camila"
              className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
            />
          </label>
          <label className="text-sm text-texto-secundario">
            Especialidad
            <select
              value={valores.categoria}
              onChange={(e) =>
                setValores({ ...valores, categoria: e.target.value as CategoriaServicio })
              }
              className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
            >
              {Object.entries(ETIQUETAS_CATEGORIA).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </select>
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
        {personal.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-borde py-12 text-center">
            <Users className="h-8 w-8 text-texto-secundario" strokeWidth={1.5} />
            <p className="text-sm text-texto-secundario">
              Todavía no cargaste a nadie de tu equipo. Si trabajás sola, no hace falta — podés
              seguir cargando servicios directamente.
            </p>
          </div>
        )}
        {personal.map((persona) => (
          <div
            key={persona.id}
            className={`flex flex-col gap-2 rounded-2xl border border-borde p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between ${
              persona.activo ? "bg-superficie" : "bg-borde/30"
            }`}
          >
            <div>
              <p className="font-semibold text-texto-primario">
                {persona.nombre}
                {!persona.activo && (
                  <span className="ml-2 rounded-full bg-borde px-2 py-0.5 text-[11px] font-semibold text-texto-primario">
                    Inactiva
                  </span>
                )}
              </p>
              <p className="text-sm text-texto-secundario">
                {ETIQUETAS_CATEGORIA[persona.categoria]}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => alternarActivo(persona)}
                aria-label={persona.activo ? "Desactivar" : "Activar"}
                className="flex items-center gap-1 text-xs font-semibold text-texto-secundario transition-colors hover:text-texto-primario"
              >
                <Power className="h-3.5 w-3.5" />
                {persona.activo ? "Desactivar" : "Activar"}
              </button>
              <button
                type="button"
                onClick={() => abrirEdicion(persona)}
                aria-label="Editar"
                className="flex items-center gap-1 text-xs font-semibold text-rosado-texto transition-colors hover:text-texto-primario"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => borrar(persona)}
                aria-label="Borrar"
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
