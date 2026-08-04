"use client";

import { useState } from "react";
import { Sparkles, Menu, X } from "lucide-react";

export function Encabezado({
  nombreNegocio,
  urlAvatar,
}: {
  nombreNegocio: string;
  urlAvatar?: string | null;
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const enlaces = [
    { etiqueta: "Servicios", href: "#servicios" },
    { etiqueta: "Galería", href: "#galeria" },
    { etiqueta: "Contacto", href: "#contacto" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-borde bg-superficie/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-4">
        <span className="flex min-w-0 items-center gap-2 truncate font-titulo text-lg font-semibold text-texto-primario">
          {urlAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urlAvatar}
              alt=""
              className="h-6 w-6 shrink-0 rounded-full object-cover"
            />
          ) : (
            <Sparkles className="h-5 w-5 shrink-0 text-rosado-texto" strokeWidth={1.75} />
          )}
          <span className="truncate">{nombreNegocio}</span>
        </span>

        <nav className="hidden shrink-0 gap-8 md:flex">
          {enlaces.map((enlace) => (
            <a
              key={enlace.href}
              href={enlace.href}
              className="text-sm font-medium text-texto-secundario transition-colors hover:text-rosado-texto"
            >
              {enlace.etiqueta}
            </a>
          ))}
        </nav>

        <button
          type="button"
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuAbierto}
          onClick={() => setMenuAbierto((valor) => !valor)}
          className="flex h-9 w-9 items-center justify-center text-texto-primario md:hidden"
        >
          {menuAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuAbierto && (
        <nav className="animar-aparecer flex flex-col gap-1 border-t border-borde bg-superficie px-6 py-4 md:hidden">
          {enlaces.map((enlace) => (
            <a
              key={enlace.href}
              href={enlace.href}
              onClick={() => setMenuAbierto(false)}
              className="py-2 text-sm font-medium text-texto-secundario"
            >
              {enlace.etiqueta}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
