import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Sparkles, Phone, MessageCircle, Image as ImageIcon } from "lucide-react";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { Encabezado } from "@/components/publico/encabezado";
import { SeccionServicios } from "@/components/publico/seccion-servicios";
import type { Manicurista, Servicio, FotoGaleria } from "@/lib/tipos";

async function obtenerManicurista(slug: string) {
  const supabase = await crearClienteServidor();

  const { data: manicurista } = await supabase
    .from("usuarios_manicuristas")
    .select(
      "id, nombre_negocio, nombre_completo, telefono, biografia, color_marca, slug_publico, url_avatar, politica_cancelacion",
    )
    .eq("slug_publico", slug)
    .maybeSingle<Manicurista>();

  if (!manicurista) return null;

  const { data: servicios } = await supabase
    .from("servicios")
    .select("id, nombre, descripcion, precio, duracion_minutos, monto_seña")
    .eq("id_manicurista", manicurista.id)
    .eq("activo", true)
    .order("precio", { ascending: true })
    .returns<Servicio[]>();

  const { data: fotos } = await supabase
    .from("fotos_galeria")
    .select("id, ruta_archivo, orden")
    .eq("id_manicurista", manicurista.id)
    .order("orden", { ascending: true })
    .returns<FotoGaleria[]>();

  const urlsGaleria = (fotos ?? []).map(
    (foto) => supabase.storage.from("fotos-galeria").getPublicUrl(foto.ruta_archivo).data.publicUrl,
  );

  return { manicurista, servicios: servicios ?? [], urlsGaleria };
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
  const datos = await obtenerManicurista(slug);
  if (!datos) return { title: "Nail Artist" };
  return {
    title: datos.manicurista.nombre_negocio,
    description: datos.manicurista.biografia ?? undefined,
  };
}

export default async function PaginaManicurista({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const datos = await obtenerManicurista(slug);
  if (!datos) notFound();

  const { manicurista, servicios, urlsGaleria } = datos;
  const enlaceWhatsapp = urlWhatsapp(manicurista.telefono, manicurista.nombre_negocio);

  return (
    <div
      className="flex flex-1 flex-col"
      style={
        manicurista.color_marca
          ? ({ "--color-rosado": manicurista.color_marca } as React.CSSProperties)
          : undefined
      }
    >
      <Encabezado nombreNegocio={manicurista.nombre_negocio} urlAvatar={manicurista.url_avatar} />

      <main className="flex-1">
        {/* Hero */}
        <section className="animar-aparecer flex flex-col items-center gap-6 px-6 py-24 text-center sm:py-32">
          <Sparkles className="h-8 w-8 text-rosado-texto" strokeWidth={1.5} />
          <h1 className="font-titulo max-w-2xl text-4xl font-semibold leading-tight text-texto-primario sm:text-5xl">
            {manicurista.nombre_negocio}
          </h1>
          {manicurista.biografia && (
            <p className="max-w-md text-base text-texto-secundario">
              {manicurista.biografia}
            </p>
          )}
          <a
            href="#servicios"
            className="rounded-full bg-rosado px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-white shadow-[0_6px_16px_rgba(147,80,96,0.4)] transition-transform hover:-translate-y-0.5"
          >
            Ver servicios
          </a>
        </section>

        {/* Servicios */}
        <SeccionServicios
          servicios={servicios}
          idManicurista={manicurista.id}
          nombreNegocio={manicurista.nombre_negocio}
          urlWhatsapp={enlaceWhatsapp}
          politicaCancelacion={manicurista.politica_cancelacion}
        />

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
                      alt={`Trabajo de ${manicurista.nombre_negocio} ${indice + 1}`}
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
      </main>

      {/* Footer / Contacto */}
      <footer id="contacto" className="border-t border-borde bg-fondo px-6 py-10 text-center">
        <p className="font-titulo text-lg font-semibold text-texto-primario">
          {manicurista.nombre_negocio}
        </p>
        {manicurista.telefono && (
          <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-texto-secundario">
            <Phone className="h-3.5 w-3.5" />
            {manicurista.telefono}
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
