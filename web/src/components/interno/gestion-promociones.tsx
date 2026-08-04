"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Power, Loader2, TicketPercent } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { formateadorPrecio } from "@/lib/formato";
import type { PromocionAdmin, TipoDescuento } from "@/lib/tipos";

const formateadorFecha = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatearFecha(fechaISO: string) {
  // Parseo manual (no new Date(fechaISO) directo) para no correr el día
  // por el desfase UTC en zonas con offset negativo como Argentina.
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  return formateadorFecha.format(new Date(anio, mes - 1, dia));
}

interface ValoresFormulario {
  codigo: string;
  descripcion: string;
  tipo_descuento: TipoDescuento;
  valor_descuento: string;
  fecha_expiracion: string;
  usos_maximos: string;
}

const VACIO: ValoresFormulario = {
  codigo: "",
  descripcion: "",
  tipo_descuento: "porcentaje",
  valor_descuento: "",
  fecha_expiracion: "",
  usos_maximos: "",
};

const columnas =
  "id, codigo, descripcion, tipo_descuento, valor_descuento, fecha_inicio, fecha_expiracion, usos_maximos, usos_actuales, activo";

function etiquetaDescuento(promo: PromocionAdmin) {
  return promo.tipo_descuento === "porcentaje"
    ? `${promo.valor_descuento}%`
    : formateadorPrecio.format(promo.valor_descuento);
}

export function GestionPromociones({
  idManicurista,
  promocionesIniciales,
}: {
  idManicurista: string;
  promocionesIniciales: PromocionAdmin[];
}) {
  const [promociones, setPromociones] = useState(promocionesIniciales);
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

  function abrirEdicion(promo: PromocionAdmin) {
    setEditandoId(promo.id);
    setValores({
      codigo: promo.codigo,
      descripcion: promo.descripcion ?? "",
      tipo_descuento: promo.tipo_descuento,
      valor_descuento: String(promo.valor_descuento),
      fecha_expiracion: promo.fecha_expiracion ?? "",
      usos_maximos: promo.usos_maximos != null ? String(promo.usos_maximos) : "",
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
      codigo: valores.codigo.trim().toUpperCase(),
      descripcion: valores.descripcion || null,
      tipo_descuento: valores.tipo_descuento,
      valor_descuento: Number(valores.valor_descuento),
      fecha_expiracion: valores.fecha_expiracion || null,
      usos_maximos: valores.usos_maximos ? Number(valores.usos_maximos) : null,
    };

    if (editandoId) {
      const { data, error: errorGuardar } = await supabase
        .from("promociones")
        .update(payload)
        .eq("id", editandoId)
        .select(columnas)
        .single<PromocionAdmin>();

      if (errorGuardar) setError(errorGuardar.message);
      else if (data) {
        setPromociones((actual) => actual.map((p) => (p.id === data.id ? data : p)));
        setFormularioAbierto(false);
      }
    } else {
      const { data, error: errorGuardar } = await supabase
        .from("promociones")
        .insert({ ...payload, id_manicurista: idManicurista })
        .select(columnas)
        .single<PromocionAdmin>();

      if (errorGuardar) {
        setError(
          errorGuardar.message.includes("duplicate key")
            ? "Ya tenés un código con ese nombre."
            : errorGuardar.message,
        );
      } else if (data) {
        setPromociones((actual) => [...actual, data]);
        setFormularioAbierto(false);
      }
    }

    setGuardando(false);
  }

  async function alternarActivo(promo: PromocionAdmin) {
    const supabase = crearClienteNavegador();
    const { data } = await supabase
      .from("promociones")
      .update({ activo: !promo.activo })
      .eq("id", promo.id)
      .select(columnas)
      .single<PromocionAdmin>();
    if (data) setPromociones((actual) => actual.map((p) => (p.id === data.id ? data : p)));
  }

  async function borrar(promo: PromocionAdmin) {
    if (!confirm(`¿Borrar el código "${promo.codigo}"?`)) return;
    const supabase = crearClienteNavegador();
    const { error: errorBorrar } = await supabase.from("promociones").delete().eq("id", promo.id);
    if (!errorBorrar) setPromociones((actual) => actual.filter((p) => p.id !== promo.id));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-titulo text-2xl font-semibold text-texto-primario">Promociones</h1>
        <button
          type="button"
          onClick={abrirNuevo}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-rosado px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
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
            Código
            <input
              required
              value={valores.codigo}
              onChange={(e) => setValores({ ...valores, codigo: e.target.value.toUpperCase() })}
              placeholder="VERANO2026"
              className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 uppercase text-texto-primario transition-colors focus:border-rosado focus:outline-none"
            />
          </label>
          <label className="text-sm text-texto-secundario">
            Descripción
            <input
              value={valores.descripcion}
              onChange={(e) => setValores({ ...valores, descripcion: e.target.value })}
              placeholder="15% en esculpidas por el Día de la Madre"
              className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
            />
          </label>
          <div className="flex gap-3">
            <label className="flex-1 text-sm text-texto-secundario">
              Tipo
              <select
                value={valores.tipo_descuento}
                onChange={(e) =>
                  setValores({ ...valores, tipo_descuento: e.target.value as TipoDescuento })
                }
                className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
              >
                <option value="porcentaje">Porcentaje</option>
                <option value="monto_fijo">Monto fijo</option>
              </select>
            </label>
            <label className="flex-1 text-sm text-texto-secundario">
              Valor
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={valores.valor_descuento}
                onChange={(e) => setValores({ ...valores, valor_descuento: e.target.value })}
                className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
              />
            </label>
          </div>
          <div className="flex gap-3">
            <label className="flex-1 text-sm text-texto-secundario">
              Vence (opcional)
              <input
                type="date"
                value={valores.fecha_expiracion}
                onChange={(e) => setValores({ ...valores, fecha_expiracion: e.target.value })}
                className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
              />
            </label>
            <label className="flex-1 text-sm text-texto-secundario">
              Usos máximos (opcional)
              <input
                type="number"
                min={1}
                value={valores.usos_maximos}
                onChange={(e) => setValores({ ...valores, usos_maximos: e.target.value })}
                className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
              />
            </label>
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
        {promociones.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-borde py-12 text-center">
            <TicketPercent className="h-8 w-8 text-texto-secundario" strokeWidth={1.5} />
            <p className="text-sm text-texto-secundario">Todavía no cargaste ninguna promoción.</p>
          </div>
        )}
        {promociones.map((promo) => (
          <div
            key={promo.id}
            className={`flex flex-col gap-2 rounded-2xl border border-borde p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between ${
              promo.activo ? "bg-superficie" : "bg-borde/30"
            }`}
          >
            <div className="min-w-0">
              <p className="font-mono font-semibold text-texto-primario">
                {promo.codigo}{" "}
                <span className="font-sans font-normal text-dorado">
                  −{etiquetaDescuento(promo)}
                </span>
                {!promo.activo && (
                  <span className="ml-2 rounded-full bg-borde px-2 py-0.5 font-sans text-[11px] font-semibold text-texto-primario">
                    Inactiva
                  </span>
                )}
              </p>
              {promo.descripcion && (
                <p className="truncate text-sm text-texto-secundario">{promo.descripcion}</p>
              )}
              <p className="text-xs text-texto-secundario">
                {promo.usos_actuales} {promo.usos_actuales === 1 ? "uso" : "usos"}
                {promo.usos_maximos ? ` de ${promo.usos_maximos}` : ""}
                {promo.fecha_expiracion && ` · vence ${formatearFecha(promo.fecha_expiracion)}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <button
                type="button"
                onClick={() => alternarActivo(promo)}
                aria-label={promo.activo ? "Desactivar promoción" : "Activar promoción"}
                className="flex items-center gap-1 text-xs font-semibold text-texto-secundario transition-colors hover:text-texto-primario"
              >
                <Power className="h-3.5 w-3.5" />
                {promo.activo ? "Desactivar" : "Activar"}
              </button>
              <button
                type="button"
                onClick={() => abrirEdicion(promo)}
                aria-label="Editar promoción"
                className="flex items-center gap-1 text-xs font-semibold text-rosado-texto transition-colors hover:text-texto-primario"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => borrar(promo)}
                aria-label="Borrar promoción"
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
