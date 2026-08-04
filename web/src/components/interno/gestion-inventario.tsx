"use client";

import { useState } from "react";
import { Plus, Minus, Pencil, Trash2, Loader2, AlertTriangle, PackageOpen } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { formateadorPrecio } from "@/lib/formato";
import type { InsumoInventario } from "@/lib/tipos";

interface ValoresFormulario {
  nombre_insumo: string;
  categoria: string;
  cantidad_actual: string;
  unidad_medida: string;
  cantidad_minima_alerta: string;
  costo_unitario: string;
}

const VACIO: ValoresFormulario = {
  nombre_insumo: "",
  categoria: "",
  cantidad_actual: "0",
  unidad_medida: "unidad",
  cantidad_minima_alerta: "0",
  costo_unitario: "",
};

export function GestionInventario({
  idManicurista,
  insumosIniciales,
}: {
  idManicurista: string;
  insumosIniciales: InsumoInventario[];
}) {
  const [insumos, setInsumos] = useState(insumosIniciales);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [valores, setValores] = useState<ValoresFormulario>(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const columnas =
    "id, nombre_insumo, categoria, cantidad_actual, unidad_medida, cantidad_minima_alerta, costo_unitario";

  function abrirNuevo() {
    setEditandoId(null);
    setValores(VACIO);
    setFormularioAbierto(true);
    setError(null);
  }

  function abrirEdicion(insumo: InsumoInventario) {
    setEditandoId(insumo.id);
    setValores({
      nombre_insumo: insumo.nombre_insumo,
      categoria: insumo.categoria ?? "",
      cantidad_actual: String(insumo.cantidad_actual),
      unidad_medida: insumo.unidad_medida,
      cantidad_minima_alerta: String(insumo.cantidad_minima_alerta),
      costo_unitario: insumo.costo_unitario != null ? String(insumo.costo_unitario) : "",
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
      nombre_insumo: valores.nombre_insumo,
      categoria: valores.categoria || null,
      cantidad_actual: Number(valores.cantidad_actual || 0),
      unidad_medida: valores.unidad_medida || "unidad",
      cantidad_minima_alerta: Number(valores.cantidad_minima_alerta || 0),
      costo_unitario: valores.costo_unitario ? Number(valores.costo_unitario) : null,
    };

    if (editandoId) {
      const { data, error: errorGuardar } = await supabase
        .from("inventario")
        .update(payload)
        .eq("id", editandoId)
        .select(columnas)
        .single<InsumoInventario>();

      if (errorGuardar) setError(errorGuardar.message);
      else if (data) {
        setInsumos((actual) => actual.map((i) => (i.id === data.id ? data : i)));
        setFormularioAbierto(false);
      }
    } else {
      const { data, error: errorGuardar } = await supabase
        .from("inventario")
        .insert({ ...payload, id_manicurista: idManicurista })
        .select(columnas)
        .single<InsumoInventario>();

      if (errorGuardar) setError(errorGuardar.message);
      else if (data) {
        setInsumos((actual) => [...actual, data]);
        setFormularioAbierto(false);
      }
    }

    setGuardando(false);
  }

  async function ajustarCantidad(insumo: InsumoInventario, delta: number) {
    const nuevaCantidad = Math.max(0, insumo.cantidad_actual + delta);
    setInsumos((actual) =>
      actual.map((i) => (i.id === insumo.id ? { ...i, cantidad_actual: nuevaCantidad } : i)),
    );
    const supabase = crearClienteNavegador();
    await supabase.from("inventario").update({ cantidad_actual: nuevaCantidad }).eq("id", insumo.id);
  }

  async function borrar(insumo: InsumoInventario) {
    if (!confirm(`¿Borrar "${insumo.nombre_insumo}"?`)) return;
    const supabase = crearClienteNavegador();
    const { error: errorBorrar } = await supabase.from("inventario").delete().eq("id", insumo.id);
    if (!errorBorrar) setInsumos((actual) => actual.filter((i) => i.id !== insumo.id));
  }

  const insumosBajos = insumos.filter((i) => i.cantidad_actual <= i.cantidad_minima_alerta);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-titulo text-2xl font-semibold text-texto-primario">Inventario</h1>
        <button
          type="button"
          onClick={abrirNuevo}
          className="flex items-center gap-1.5 rounded-full bg-rosado px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> Agregar
        </button>
      </div>

      {insumosBajos.length > 0 && (
        <div className="animar-aparecer mt-4 flex gap-3 rounded-2xl border border-alerta/30 bg-alerta-suave p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-alerta" strokeWidth={1.75} />
          <div>
            <p className="text-sm font-semibold text-alerta">
              {insumosBajos.length === 1
                ? "1 insumo necesita reposición"
                : `${insumosBajos.length} insumos necesitan reposición`}
            </p>
            <p className="mt-1 text-sm text-alerta">
              {insumosBajos.map((i) => i.nombre_insumo).join(", ")}
            </p>
          </div>
        </div>
      )}

      {formularioAbierto && (
        <form
          onSubmit={guardar}
          className="animar-aparecer mt-6 flex flex-col gap-3 rounded-2xl border border-borde bg-superficie p-5 shadow-sm"
        >
          <label className="text-sm text-texto-secundario">
            Nombre del insumo
            <input
              required
              value={valores.nombre_insumo}
              onChange={(e) => setValores({ ...valores, nombre_insumo: e.target.value })}
              className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
            />
          </label>
          <label className="text-sm text-texto-secundario">
            Categoría
            <input
              value={valores.categoria}
              onChange={(e) => setValores({ ...valores, categoria: e.target.value })}
              placeholder="Esmaltes, limas, geles…"
              className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
            />
          </label>
          <div className="flex gap-3">
            <label className="flex-1 text-sm text-texto-secundario">
              Cantidad actual
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={valores.cantidad_actual}
                onChange={(e) => setValores({ ...valores, cantidad_actual: e.target.value })}
                className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
              />
            </label>
            <label className="flex-1 text-sm text-texto-secundario">
              Unidad
              <input
                required
                value={valores.unidad_medida}
                onChange={(e) => setValores({ ...valores, unidad_medida: e.target.value })}
                placeholder="unidad, ml, g…"
                className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
              />
            </label>
          </div>
          <div className="flex gap-3">
            <label className="flex-1 text-sm text-texto-secundario">
              Alerta de reposición cuando baja de
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={valores.cantidad_minima_alerta}
                onChange={(e) =>
                  setValores({ ...valores, cantidad_minima_alerta: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
              />
            </label>
            <label className="flex-1 text-sm text-texto-secundario">
              Costo unitario
              <input
                type="number"
                min={0}
                step="0.01"
                value={valores.costo_unitario}
                onChange={(e) => setValores({ ...valores, costo_unitario: e.target.value })}
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
        {insumos.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-borde py-12 text-center">
            <PackageOpen className="h-8 w-8 text-texto-secundario" strokeWidth={1.5} />
            <p className="text-sm text-texto-secundario">Todavía no cargaste ningún insumo.</p>
          </div>
        )}
        {insumos.map((insumo) => {
          const bajoStock = insumo.cantidad_actual <= insumo.cantidad_minima_alerta;
          return (
            <div
              key={insumo.id}
              className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between ${
                bajoStock ? "border-alerta/40 bg-alerta-suave/40" : "border-borde bg-superficie"
              }`}
            >
              <div>
                <p className="font-semibold text-texto-primario">
                  {insumo.nombre_insumo}
                  {bajoStock && (
                    <span className="ml-2 rounded-full bg-alerta-boton px-2 py-0.5 text-[11px] font-semibold text-white">
                      Reponer
                    </span>
                  )}
                </p>
                <p className="text-sm text-texto-secundario">
                  {insumo.categoria && `${insumo.categoria} · `}
                  {insumo.costo_unitario != null &&
                    `${formateadorPrecio.format(insumo.costo_unitario)} c/u`}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => ajustarCantidad(insumo, -1)}
                    aria-label={`Restar una unidad de ${insumo.nombre_insumo}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-borde text-texto-primario transition-colors hover:bg-borde/40"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-[70px] text-center text-sm font-semibold text-texto-primario">
                    {insumo.cantidad_actual} {insumo.unidad_medida}
                  </span>
                  <button
                    type="button"
                    onClick={() => ajustarCantidad(insumo, 1)}
                    aria-label={`Sumar una unidad de ${insumo.nombre_insumo}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-borde text-texto-primario transition-colors hover:bg-borde/40"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => abrirEdicion(insumo)}
                  aria-label="Editar insumo"
                  className="flex items-center gap-1 text-xs font-semibold text-rosado-texto transition-colors hover:text-texto-primario"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => borrar(insumo)}
                  aria-label="Borrar insumo"
                  className="flex items-center gap-1 text-xs font-semibold text-alerta transition-colors hover:text-texto-primario"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Borrar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
