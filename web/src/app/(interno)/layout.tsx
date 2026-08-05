import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Clock3, XCircle, MessageCircle } from "lucide-react";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { NavInterno } from "@/components/interno/nav-interno";
import { BotonCerrarSesion } from "@/components/interno/cerrar-sesion";
import { urlWhatsappSoporte } from "@/lib/soporte";
import type { SesionNegocio } from "@/lib/tipos";

// Nombre dinámico según la sesión: si Aurora instala el panel como app
// desde su celular ("Agregar a inicio"), el ícono queda con "Aurora Nails
// Studio", no un nombre genérico — mismo dato que lee manifest.webmanifest.
//
// `other["apple-mobile-web-app-capable"]` es a propósito, además de
// `appleWebApp.capable`: esta versión de Next solo emite la etiqueta nueva
// sin prefijo (`mobile-web-app-capable`), pero versiones de iOS Safari
// anteriores a la adopción del estándar nuevo solo entienden la vieja con
// prefijo `apple-`. Verificado leyendo el HTML real que genera esta
// página, no solo confiando en la config de `appleWebApp`.
export async function generateMetadata(): Promise<Metadata> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nombre = "Mi negocio";
  if (user) {
    const { data: negocio } = await supabase
      .from("usuarios_negocios")
      .select("nombre_negocio")
      .eq("id", user.id)
      .maybeSingle<{ nombre_negocio: string }>();
    if (negocio?.nombre_negocio) nombre = negocio.nombre_negocio;
  }

  return {
    title: nombre,
    manifest: "/panel/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: nombre,
      statusBarStyle: "default",
    },
    other: {
      "apple-mobile-web-app-capable": "yes",
    },
    icons: {
      apple: "/icono-app-180.png",
    },
  };
}

export default async function LayoutInterno({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await crearClienteServidor();
  const {
    data: { user: usuario },
  } = await supabase.auth.getUser();

  if (!usuario) redirect("/ingresar");

  const { data: cuenta } = await supabase
    .from("usuarios_negocios")
    .select("estado_cuenta, es_admin, nombre_negocio")
    .eq("id", usuario.id)
    .maybeSingle<SesionNegocio>();

  if (cuenta && cuenta.estado_cuenta !== "aprobada") {
    const pendiente = cuenta.estado_cuenta === "pendiente";
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        {pendiente ? (
          <Clock3 className="h-10 w-10 text-dorado" strokeWidth={1.5} />
        ) : (
          <XCircle className="h-10 w-10 text-alerta" strokeWidth={1.5} />
        )}
        <h1 className="font-titulo text-2xl font-semibold text-texto-primario">
          {pendiente ? "Tu cuenta está en revisión" : "Tu cuenta no fue aprobada"}
        </h1>
        <p className="max-w-sm text-sm text-texto-secundario">
          {pendiente
            ? "Ya recibimos el registro de " +
              cuenta.nombre_negocio +
              ". En cuanto la aprobemos vas a poder entrar al panel."
            : "Si creés que es un error, contactanos para revisarlo."}
        </p>
        <a
          href={urlWhatsappSoporte(
            `Hola! Tengo una duda sobre mi cuenta (${cuenta.nombre_negocio}).`,
          )}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs font-semibold text-texto-secundario transition-colors hover:text-rosado-texto"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          ¿Algo no anda bien? Escribinos por WhatsApp
        </a>
        <BotonCerrarSesion />
      </main>
    );
  }

  return (
    <>
      <NavInterno idNegocio={usuario.id} nombreNegocio={cuenta?.nombre_negocio} />
      {children}
    </>
  );
}
