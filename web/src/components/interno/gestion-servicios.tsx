"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Power, Loader2, Sparkles } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { formateadorPrecio } from "@/lib/formato";
import type { ServicioAdmin, Personal, CategoriaServicio, TipoNegocio } from "@/lib/tipos";

interface ValoresFormulario {
  nombre: string;
  descripcion: string;
  precio: string;
  duracion_minutos: string;
  monto_seña: string;
  categoria: CategoriaServicio;
  id_empleado: string;
}

const ETIQUETAS_CATEGORIA: Record<CategoriaServicio, string> = {
  cabello: "Cabello",
  pestañas: "Pestañas",
  uñas: "Uñas",
  otro: "Otro",
};

// tipo_negocio (declarado al registrarse) no tiene un "otro"/"spa_completo"
// equivalente en categoria de servicios — para spa_completo no hay una
// categoría obvia por defecto, así que cae en "uñas" como el resto.
function categoriaSugerida(tipoNegocio: TipoNegocio): CategoriaServicio {
  if (tipoNegocio === "cabello" || tipoNegocio === "pestañas" || tipoNegocio === "uñas") {
    return tipoNegocio;
  }
  return "uñas";
}

const columnas =
  "id, nombre, descripcion, precio, duracion_minutos, monto_seña, categoria, id_empleado, activo";

export function GestionServicios({
  idNegocio,
  serviciosIniciales,
  personal,
  tipoNegocio,
}: {
  idNegocio: string;
  serviciosIniciales: ServicioAdmin[];
  personal: Personal[];
  tipoNegocio: TipoNegocio;
}) {
  const vacio: ValoresFormulario = {
    nombre: "",
    descripcion: "",
    precio: "",
    duracion_minutos: "",
    monto_seña: "",
    categoria: categoriaSugerida(tipoNegocio),
    id_empleado: "",
  };
  const [servicios, setServicios] = useState(serviciosIniciales);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [valores, setValores] = useState<ValoresFormulario>(vacio);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function abrirNuevo() {
    setEditandoId(null);
    setValores(vacio);
    setFormularioAbierto(true);
    setError(null);
  }

  function abrirEdicion(servicio: ServicioAdmin) {
    setEditandoId(servicio.id);
    setValores({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion ?? "",
      precio: String(servicio.precio),
      duracion_minutos: String(servicio.duracion_minutos),
      monto_seña: String(servicio.monto_seña),
      categoria: servicio.categoria,
      id_empleado: servicio.id_empleado ?? "",
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
      nombre: valores.nombre,
      descripcion: valores.descripcion || null,
      precio: Number(valores.precio),
      duracion_minutos: Number(valores.duracion_minutos),
      monto_seña: Number(valores.monto_seña || 0),
      categoria: valores.categoria,
      id_empleado: valores.id_empleado || null,
    };

    if (editandoId) {
      const { data, error: errorGuardar } = await supabase
        .from("servicios")
        .update(payload)
        .eq("id", editandoId)
        .select(columnas)
        .single<ServicioAdmin>();

      if (errorGuardar) {
        setError(errorGuardar.message);
      } else if (data) {
        setServicios((actual) => actual.map((s) => (s.id === data.id ? data : s)));
        setFormularioAbierto(false);
      }
    } else {
      const { data, error: errorGuardar } = await supabase
        .from("servicios")
        .insert({ ...payload, id_negocio: idNegocio })
        .select(columnas)
        .single<ServicioAdmin>();

      if (errorGuardar) {
        setError(errorGuardar.message);
      } else if (data) {
        setServicios((actual) => [...actual, data]);
        setFormularioAbierto(false);
      }
    }

    setGuardando(false);
  }

  async function alternarActivo(servicio: ServicioAdmin) {
    const supabase = crearClienteNavegador();
    const { data } = await supabase
      .from("servicios")
      .update({ activo: !servicio.activo })
      .eq("id", servicio.id)
      .select(columnas)
      .single<ServicioAdmin>();

    if (data) {
      setServicios((actual) => actual.map((s) => (s.id === data.id ? data : s)));
    }
  }

  async function borrar(servicio: ServicioAdmin) {
    if (!confirm(`¿Borrar "${servicio.nombre}"? Esta acción no se puede deshacer.`)) return;
    const supabase = crearClienteNavegador();
    const { error: errorBorrar } = await supabase.from("servicios").delete().eq("id", servicio.id);
    if (!errorBorrar) {
      setServicios((actual) => actual.filter((s) => s.id !== servicio.id));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-titulo text-2xl font-semibold text-texto-primario">Servicios</h1>
        <button
          type="button"
          onClick={abrirNuevo}
          className="flex items-center gap-1.5 rounded-full bg-rosado px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> Agregar
        </button>
      </div>

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
              className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
            />
          </label>
          <label className="text-sm text-texto-secundario">
            Descripción
            <textarea
              value={valores.descripcion}
              onChange={(e) => setValores({ ...valores, descripcion: e.target.value })}
              className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
            />
          </label>
          <div className="flex gap-3">
            <label className="flex-1 text-sm text-texto-secundario">
              Precio
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={valores.precio}
                onChange={(e) => setValores({ ...valores, precio: e.target.value })}
                className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
              />
            </label>
            <label className="flex-1 text-sm text-texto-secundario">
              Duración (min)
              <input
                required
                type="number"
                min={1}
                value={valores.duracion_minutos}
                onChange={(e) => setValores({ ...valores, duracion_minutos: e.target.value })}
                className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
              />
            </label>
            <label className="flex-1 text-sm text-texto-secundario">
              Abono
              <input
                type="number"
                min={0}
                step="0.01"
                value={valores.monto_seña}
                onChange={(e) => setValores({ ...valores, monto_seña: e.target.value })}
                className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
              />
            </label>
          </div>
          <div className="flex gap-3">
            <label className="flex-1 text-sm text-texto-secundario">
              Categoría
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
            {personal.length > 0 && (
              <label className="flex-1 text-sm text-texto-secundario">
                Profesional (opcional)
                <select
                  value={valores.id_empleado}
                  onChange={(e) => setValores({ ...valores, id_empleado: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
                >
                  <option value="">Sin asignar</option>
                  {personal.map((persona) => (
                    <option key={persona.id} value={persona.id}>
                      {persona.nombre}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

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
        {servicios.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-borde py-12 text-center">
            <Sparkles className="h-8 w-8 text-texto-secundario" strokeWidth={1.5} />
            <p className="text-sm text-texto-secundario">Todavía no cargaste ningún servicio.</p>
          </div>
        )}
        {servicios.map((servicio) => (
          <div
            key={servicio.id}
            className={`flex flex-col gap-2 rounded-2xl border border-borde p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between ${
              servicio.activo ? "bg-superficie" : "bg-borde/30"
            }`}
          >
            <div>
              <p className="font-semibold text-texto-primario">
                {servicio.nombre}
                {!servicio.activo && (
                  <span className="ml-2 rounded-full bg-borde px-2 py-0.5 text-[11px] font-semibold text-texto-primario">
                    Inactivo
                  </span>
                )}
              </p>
              <p className="text-sm text-texto-secundario">
                {formateadorPrecio.format(servicio.precio)} · {servicio.duracion_minutos} min
                {servicio.monto_seña > 0 && ` · Abono ${formateadorPrecio.format(servicio.monto_seña)}`}
                {personal.length > 0 &&
                  ` · ${
                    personal.find((p) => p.id === servicio.id_empleado)?.nombre ?? "Sin asignar"
                  }`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => alternarActivo(servicio)}
                aria-label={servicio.activo ? "Desactivar servicio" : "Activar servicio"}
                className="flex items-center gap-1 text-xs font-semibold text-texto-secundario transition-colors hover:text-texto-primario"
              >
                <Power className="h-3.5 w-3.5" />
                {servicio.activo ? "Desactivar" : "Activar"}
              </button>
              <button
                type="button"
                onClick={() => abrirEdicion(servicio)}
                aria-label="Editar servicio"
                className="flex items-center gap-1 text-xs font-semibold text-rosado-texto transition-colors hover:text-texto-primario"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => borrar(servicio)}
                aria-label="Borrar servicio"
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
