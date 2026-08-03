"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Users, ChevronRight } from "lucide-react";
import { formateadorPrecio } from "@/lib/formato";
import type { ClientaAdmin } from "@/lib/tipos";

export function ListaClientas({ clientas }: { clientas: ClientaAdmin[] }) {
  const [busqueda, setBusqueda] = useState("");

  const filtradas = clientas.filter((c) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return (
      c.nombre_completo.toLowerCase().includes(texto) ||
      (c.telefono ?? "").toLowerCase().includes(texto)
    );
  });

  return (
    <div>
      <h1 className="font-titulo text-2xl font-semibold text-texto-primario">Clientas</h1>

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
