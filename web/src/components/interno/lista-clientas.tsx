"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Users, ChevronRight, Plus, Loader2, Download } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { formateadorPrecio } from "@/lib/formato";
import { descargarCSV } from "@/lib/csv";
import type { ClientaAdmin } from "@/lib/tipos";

export function ListaClientas({
  clientas: clientasIniciales,
  idManicurista,
}: {
  clientas: ClientaAdmin[];
  idManicurista: string;
}) {
  const [clientas, setClientas] = useState(clientasIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtradas = clientas.filter((c) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return (
      c.nombre_completo.toLowerCase().includes(texto) ||
      (c.telefono ?? "").toLowerCase().includes(texto)
    );
  });

  async function agregarClienta(evento: React.FormEvent) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);

    const supabase = crearClienteNavegador();
    const { data, error: errorGuardar } = await supabase
      .from("clientas")
      .insert({
        id_manicurista: idManicurista,
        nombre_completo: nombre,
        telefono: telefono || null,
      })
      .select("id, nombre_completo, telefono, email, alergias, notas_internas, valor_vida_cliente, visitas_completadas, premios_canjeados")
      .single<ClientaAdmin>();

    setGuardando(false);
    if (errorGuardar) {
      setError(errorGuardar.message);
    } else if (data) {
      setClientas((actual) =>
        [...actual, data].sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo)),
      );
      setNombre("");
      setTelefono("");
      setFormularioAbierto(false);
    }
  }

  function exportar() {
    descargarCSV(
      "clientas.csv",
      ["Nombre", "Teléfono", "Email", "Alergias", "Notas internas", "LTV", "Visitas completadas"],
      clientas.map((c) => [
        c.nombre_completo,
        c.telefono,
        c.email,
        c.alergias,
        c.notas_internas,
        c.valor_vida_cliente,
        c.visitas_completadas,
      ]),
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-titulo text-2xl font-semibold text-texto-primario">Clientas</h1>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={exportar}
            disabled={clientas.length === 0}
            aria-label="Exportar clientas a CSV"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-borde text-texto-secundario transition-colors hover:border-rosado hover:text-rosado disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setFormularioAbierto((v) => !v)}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-rosado px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" /> Agregar
          </button>
        </div>
      </div>

      {formularioAbierto && (
        <form
          onSubmit={agregarClienta}
          className="animar-aparecer mt-4 flex flex-col gap-3 rounded-2xl border border-borde bg-superficie p-5 shadow-sm"
        >
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
            Teléfono
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
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

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-secundario" />
        <input
          placeholder="Buscar por nombre o teléfono…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full rounded-xl border border-borde bg-superficie py-2.5 pl-10 pr-4 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
        />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {filtradas.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-borde py-12 text-center">
            <Users className="h-8 w-8 text-texto-secundario" strokeWidth={1.5} />
            <p className="text-sm text-texto-secundario">No hay clientas para mostrar.</p>
          </div>
        )}
        {filtradas.map((clienta) => (
          <Link
            key={clienta.id}
            href={`/panel/clientas/${clienta.id}`}
            className="flex items-center justify-between gap-3 rounded-2xl border border-borde bg-superficie p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-texto-primario">
                {clienta.nombre_completo}
              </p>
              <p className="text-sm text-texto-secundario">{clienta.telefono}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <p className="text-sm font-semibold text-dorado">
                {formateadorPrecio.format(clienta.valor_vida_cliente)}
              </p>
              <ChevronRight className="h-4 w-4 text-texto-secundario" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
