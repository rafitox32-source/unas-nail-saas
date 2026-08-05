"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Home, Sparkles, Calendar, Users, Package, Tag } from "lucide-react";
import { BotonCerrarSesion } from "@/components/interno/cerrar-sesion";
import { ToggleTema } from "@/components/interno/toggle-tema";
import { ToggleNotificaciones } from "@/components/interno/toggle-notificaciones";
import { BotonAyuda } from "@/components/interno/boton-ayuda";

const enlaces = [
  { etiqueta: "Inicio", href: "/panel", icono: Home },
  { etiqueta: "Servicios", href: "/panel/servicios", icono: Sparkles },
  { etiqueta: "Agenda", href: "/panel/agenda", icono: Calendar },
  { etiqueta: "Clientas", href: "/panel/clientas", icono: Users },
  { etiqueta: "Inventario", href: "/panel/inventario", icono: Package },
  { etiqueta: "Promociones", href: "/panel/promociones", icono: Tag },
];

export function NavInterno({
  idNegocio,
  nombreNegocio,
}: {
  idNegocio: string;
  nombreNegocio?: string;
}) {
  const ruta = usePathname();
  const enlaceActivoRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    enlaceActivoRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [ruta]);

  return (
    <header className="sticky top-0 z-50 border-b border-borde bg-superficie/90 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <div className="relative min-w-0 flex-1">
          <nav className="flex gap-4 overflow-x-auto sm:gap-5">
            {enlaces.map((enlace) => {
              const activo = ruta === enlace.href;
              const Icono = enlace.icono;
              return (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  ref={activo ? enlaceActivoRef : undefined}
                  className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[13px] font-medium transition-colors sm:text-sm ${
                    activo ? "text-rosado-texto" : "text-texto-secundario hover:text-texto-primario"
                  }`}
                >
                  <Icono className="h-4 w-4" strokeWidth={activo ? 2.25 : 1.75} />
                  {enlace.etiqueta}
                </Link>
              );
            })}
          </nav>
          {/* pistas visuales de que la nav sigue para los costados en pantallas chicas */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-4 bg-gradient-to-r from-superficie to-transparent sm:hidden" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-superficie to-transparent sm:hidden" />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <BotonAyuda nombreNegocio={nombreNegocio} />
          <ToggleNotificaciones idNegocio={idNegocio} />
          <ToggleTema />
          <BotonCerrarSesion />
        </div>
      </div>
    </header>
  );
}
