"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  soportaNotificaciones,
  notificacionesActivas,
  suscribirNotificaciones,
  desuscribirNotificaciones,
} from "@/lib/notificaciones-push";

type Estado = "cargando" | "sin-soporte" | "inactivo" | "activo";

export function ToggleNotificaciones({ idManicurista }: { idManicurista: string }) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!soportaNotificaciones()) {
      setEstado("sin-soporte");
      return;
    }
    notificacionesActivas().then((activo) => setEstado(activo ? "activo" : "inactivo"));
  }, []);

  async function alternar() {
    setError(null);
    if (estado === "activo") {
      setEstado("cargando");
      await desuscribirNotificaciones();
      setEstado("inactivo");
      return;
    }
    if (estado === "inactivo") {
      setEstado("cargando");
      try {
        await suscribirNotificaciones(idManicurista);
        setEstado("activo");
      } catch {
        setError("No se pudieron activar. Revisá el permiso de notificaciones del navegador.");
        setEstado("inactivo");
      }
    }
  }

  if (estado === "sin-soporte") return null;

  if (estado === "cargando") {
    return <div className="h-8 w-8" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={estado === "activo" ? "Desactivar notificaciones" : "Activar notificaciones"}
      title={error ?? undefined}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-texto-secundario transition-colors hover:bg-borde/50 hover:text-texto-primario"
    >
      {estado === "activo" ? (
        <Bell className="h-4 w-4 text-rosado-texto" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
    </button>
  );
}
