import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Phone, MessageCircle, Music2, Image as ImageIcon } from "lucide-react";
import { IconoMarca } from "@/components/icono-marca";
import { IconoPosteBarbero, IconoBigote } from "@/components/iconos-barberia";
import { IconoInstagram, IconoFacebook } from "@/components/iconos-redes";
import { urlRedSocial } from "@/lib/redes-sociales";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { Encabezado } from "@/components/publico/encabezado";
import { SeccionServicios } from "@/components/publico/seccion-servicios";
import { SeccionEquipo } from "@/components/publico/seccion-equipo";
import { SeccionResenas } from "@/components/publico/seccion-resenas";
import type { Negocio, Servicio, FotoGaleria, ResenaPublica, Personal } from "@/lib/tipos";

async function obtenerNegocio(slug: string) {
  const supabase = await crearClienteServidor();

  const { data: negocio } = await supabase
    .from("usuarios_negocios")
    .select(
      "id, nombre_negocio, nombre_completo, telefono, biografia, color_marca, slug_publico, url_avatar, politica_cancelacion, url_instagram, url_tiktok, url_facebook, tipo_negocio",
    )
    .eq("slug_publico", slug)
    .maybeSingle<Negocio>();

  if (!negocio) return null;

  const { data: servicios } = await supabase
    .from("servicios")
    .select("id, nombre, descripcion, precio, duracion_minutos, monto_seña, categoria, id_empleado, url_foto")
    .eq("id_negocio", negocio.id)
    .eq("activo", true)
    .order("precio", { ascending: true })
    .returns<Servicio[]>();

  const { data: personal } = await supabase
    .from("personal")
    .select("id, nombre, categoria, url_foto, activo")
    .eq("id_negocio", negocio.id)
    .eq("activo", true)
    .order("creado_en", { ascending: true })
    .returns<Personal[]>();

  const { data: fotos } = await supabase
    .from("fotos_galeria")
    .select("id, ruta_archivo, orden")
    .eq("id_negocio", negocio.id)
    .order("orden", { ascending: true })
    .returns<FotoGaleria[]>();

  const urlsGaleria = (fotos ?? []).map(
    (foto) => supabase.storage.from("fotos-galeria").getPublicUrl(foto.ruta_archivo).data.publicUrl,
  );

  const { data: resenas } = await supabase
    .from("resenas")
    .select("id, nombre_clienta, calificacion, comentario")
    .eq("id_negocio", negocio.id)
    .eq("visible", true)
    .order("creado_en", { ascending: false })
    .returns<ResenaPublica[]>();

  return {
    negocio,
    servicios: servicios ?? [],
    personal: personal ?? [],
    urlsGaleria,
    resenas: resenas ?? [],
  };
}

function urlWhatsapp(telefono: string | null, nombreNegocio: string) {
  if (!telefono) return null;
  const soloDigitos = telefono.replace(/\D/g, "");
  const mensaje = encodeURIComponent(
    `Hola! Quiero reservar un turno en ${nombreNegocio} ✨`,
  );
  return `https://wa.me/${soloDigitos}?text=${mensaje}`;
}

const degradesGaleria = [
  "from-rosado-suave to-nude",
  "from-dorado-suave to-rosado-suave",
  "from-nude to-dorado-suave",
  "from-rosado-suave to-dorado-suave",
  "from-nude to-rosado",
  "from-dorado-suave to-nude",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const datos = await obtenerNegocio(slug);
  if (!datos) return { title: "Florece" };
  return {
    title: datos.negocio.nombre_negocio,
    description: datos.negocio.biografia ?? undefined,
  };
}

export default async function PaginaNegocio({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const datos = await obtenerNegocio(slug);
  if (!datos) notFound();

  const { negocio, servicios, personal, urlsGaleria, resenas } = datos;
  const enlaceWhatsapp = urlWhatsapp(negocio.telefono, negocio.nombre_negocio);
  const enlaceInstagram = urlRedSocial("instagram", negocio.url_instagram);
  const enlaceTiktok = urlRedSocial("tiktok", negocio.url_tiktok);
  const enlaceFacebook = urlRedSocial("facebook", negocio.url_facebook);
  const tieneRedes = enlaceInstagram || enlaceTiktok || enlaceFacebook;

  // Barbería francesa: tema propio (más rudo/varonil) para negocios de ese
  // rubro — poste de barbero en vez del isotipo floral, encabezado en
  // mayúsculas, y un color de acento oscuro por defecto (rojo de barbería)
  // cuando la dueña todavía no eligió su propio color de marca. Si ya
  // personalizó un color, ese siempre gana — esto es solo el punto de
  // partida para una cuenta nueva de barbería.
  const esBarberia = negocio.tipo_negocio === "barberia";
  const colorAcento = negocio.color_marca ?? (esBarberia ? "#9c2b2b" : null);

  return (
    <div
      className="flex flex-1 flex-col"
      style={colorAcento ? ({ "--color-rosado": colorAcento } as React.CSSProperties) : undefined}
    >
      <Encabezado
        nombreNegocio={negocio.nombre_negocio}
        urlAvatar={negocio.url_avatar}
        esBarberia={esBarberia}
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="animar-aparecer flex flex-col items-center gap-6 px-6 py-24 text-center sm:py-32">
          {esBarberia ? (
            <IconoPosteBarbero className="h-16 w-9" />
          ) : (
            <IconoMarca className="h-8 w-8 text-rosado-texto" />
          )}
          <h1
            className={`font-titulo max-w-2xl text-4xl font-semibold leading-tight text-texto-primario sm:text-5xl ${
              esBarberia ? "uppercase tracking-wide" : ""
            }`}
          >
            {negocio.nombre_negocio}
          </h1>
          {negocio.biografia && (
            <p className="max-w-md text-base text-texto-secundario">
              {negocio.biografia}
            </p>
          )}
          <a
            href="#servicios"
            className="rounded-full bg-rosado px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-white shadow-[0_6px_16px_rgba(147,80,96,0.4)] transition-transform hover:-translate-y-0.5"
          >
            Ver servicios
          </a>
        </section>

        {esBarberia && (
          <div
            aria-hidden="true"
            className="flex items-center justify-center gap-10 overflow-hidden py-2 text-rosado opacity-20"
          >
            {Array.from({ length: 7 }).map((_, i) => (
              <IconoBigote key={i} className="h-5 w-12 shrink-0" />
            ))}
          </div>
        )}

        {/* Servicios */}
        <SeccionServicios
          servicios={servicios}
          personal={personal}
          idNegocio={negocio.id}
          nombreNegocio={negocio.nombre_negocio}
          urlWhatsapp={enlaceWhatsapp}
          politicaCancelacion={negocio.politica_cancelacion}
        />

        {/* Equipo */}
        <SeccionEquipo personal={personal} />

        {/* Galería */}
        <section id="galeria" className="border-t border-borde bg-superficie px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-titulo text-center text-3xl font-semibold text-texto-primario">
              Nuestro trabajo
            </h2>
            {urlsGaleria.length === 0 && (
              <p className="mx-auto mt-2 max-w-sm text-center text-sm text-texto-secundario">
                Pronto vas a poder ver fotos reales de nuestros diseños acá.
              </p>
            )}
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {urlsGaleria.length > 0
                ? urlsGaleria.map((url, indice) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={url}
                      src={url}
                      alt={`Trabajo de ${negocio.nombre_negocio} ${indice + 1}`}
                      className="aspect-square w-full rounded-2xl object-cover shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md"
                    />
                  ))
                : degradesGaleria.map((degrade, indice) => (
                    <div
                      key={indice}
                      className={`group flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md ${degrade}`}
                    >
                      <ImageIcon
                        className="h-7 w-7 text-white/40 transition-transform duration-300 group-hover:scale-110"
                        strokeWidth={1.25}
                      />
                    </div>
                  ))}
            </div>
          </div>
        </section>

        {/* Reseñas */}
        <SeccionResenas resenas={resenas} />
      </main>

      {/* Footer / Contacto */}
      <footer id="contacto" className="border-t border-borde bg-fondo px-6 py-10 text-center">
        <p className="font-titulo text-lg font-semibold text-texto-primario">
          {negocio.nombre_negocio}
        </p>
        {negocio.telefono && (
          <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-texto-secundario">
            <Phone className="h-3.5 w-3.5" />
            {negocio.telefono}
          </p>
        )}
        {enlaceWhatsapp && (
          <a
            href={enlaceWhatsapp}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-rosado-texto hover:underline"
          >
            <MessageCircle className="h-4 w-4" />
            Escribinos por WhatsApp →
          </a>
        )}

        {tieneRedes && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-texto-primario">
              ¡Seguinos en redes! ✨
            </p>
            <div className="mt-3 flex items-center justify-center gap-4">
              {enlaceInstagram && (
                <a
                  href={enlaceInstagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-texto-secundario transition-colors hover:text-rosado-texto"
                >
                  <IconoInstagram className="h-6 w-6" />
                </a>
              )}
              {enlaceTiktok && (
                <a
                  href={enlaceTiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="text-texto-secundario transition-colors hover:text-rosado-texto"
                >
                  <Music2 className="h-6 w-6" strokeWidth={1.75} />
                </a>
              )}
              {enlaceFacebook && (
                <a
                  href={enlaceFacebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="text-texto-secundario transition-colors hover:text-rosado-texto"
                >
                  <IconoFacebook className="h-6 w-6" />
                </a>
              )}
            </div>
          </div>
        )}

        <p className="mt-6 flex items-center justify-center gap-3 text-xs text-texto-secundario">
          <a href="/terminos" className="hover:text-rosado-texto hover:underline">
            Términos
          </a>
          <span>·</span>
          <a href="/privacidad" className="hover:text-rosado-texto hover:underline">
            Privacidad
          </a>
        </p>
      </footer>
    </div>
  );
}
