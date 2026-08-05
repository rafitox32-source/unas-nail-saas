import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";

// Manifest de PWA por sesión: cada cuenta que instala el panel desde
// su celular ("Agregar a inicio") ve el nombre y el logo de SU negocio en
// el ícono, no uno genérico — se lee el perfil de la sesión activa en el
// momento en que el navegador pide este archivo.
//
// Nota: no se usa la convención especial `manifest.ts` de Next.js porque
// esa solo genera un manifest único en la raíz de la app (`/manifest.
// webmanifest`) — no soporta una versión distinta por ruta/sesión como
// necesitamos acá. Por eso es un Route Handler común.

function tipoImagen(url: string) {
  if (url.endsWith(".webp")) return "image/webp";
  if (url.endsWith(".jpg") || url.endsWith(".jpeg")) return "image/jpeg";
  return "image/png";
}

export async function GET() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nombre = "Mi negocio";
  let logoPropio: string | null = null;

  if (user) {
    const { data: negocio } = await supabase
      .from("usuarios_negocios")
      .select("nombre_negocio, url_avatar")
      .eq("id", user.id)
      .maybeSingle<{ nombre_negocio: string; url_avatar: string | null }>();

    if (negocio?.nombre_negocio) nombre = negocio.nombre_negocio;
    if (negocio?.url_avatar) logoPropio = negocio.url_avatar;
  }

  const manifest = {
    name: nombre,
    short_name: nombre.length > 20 ? `${nombre.slice(0, 19)}…` : nombre,
    description: `Panel de administración de ${nombre}`,
    start_url: "/panel",
    scope: "/panel",
    display: "standalone",
    background_color: "#fbf7f4",
    theme_color: "#935060",
    icons: logoPropio
      ? [{ src: logoPropio, sizes: "512x512", type: tipoImagen(logoPropio), purpose: "any" }]
      : [
          { src: "/icono-app-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icono-app-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        ],
  };

  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
