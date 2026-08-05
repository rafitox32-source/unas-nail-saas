import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { IconoBigote } from "@/components/iconos-barberia";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { UnirseFila } from "@/components/publico/unirse-fila";
import type { Negocio } from "@/lib/tipos";

async function obtenerNegocio(slug: string) {
  const supabase = await crearClienteServidor();
  const { data: negocio } = await supabase
    .from("usuarios_negocios")
    .select("nombre_negocio, color_marca, tipo_negocio, slug_publico")
    .eq("slug_publico", slug)
    .eq("estado_cuenta", "aprobada")
    .maybeSingle<Pick<Negocio, "nombre_negocio" | "color_marca" | "tipo_negocio" | "slug_publico">>();
  return negocio;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const negocio = await obtenerNegocio(slug);
  if (!negocio) return { title: "Florece" };
  return { title: `Fila de espera · ${negocio.nombre_negocio}` };
}

export default async function PaginaFila({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const negocio = await obtenerNegocio(slug);
  if (!negocio) notFound();

  const colorAcento = negocio.color_marca ?? (negocio.tipo_negocio === "barberia" ? "#9c2b2b" : null);

  return (
    <div
      className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16"
      style={colorAcento ? ({ "--color-rosado": colorAcento } as React.CSSProperties) : undefined}
    >
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-8">
        <Link href={`/${slug}`} className="flex items-center gap-2 text-texto-primario">
          <IconoBigote className="h-4 w-7 text-rosado-texto" />
          <span className="font-titulo text-lg font-semibold">{negocio.nombre_negocio}</span>
        </Link>

        {negocio.tipo_negocio === "barberia" ? (
          <UnirseFila slugPublico={slug} nombreNegocio={negocio.nombre_negocio} />
        ) : (
          <div className="rounded-3xl border border-borde bg-superficie p-8 text-center shadow-sm">
            <p className="text-sm text-texto-secundario">
              Este negocio no usa fila de espera en vivo — reservá tu turno desde su página.
            </p>
            <Link
              href={`/${slug}`}
              className="mt-4 inline-block text-sm font-semibold text-rosado-texto hover:text-texto-primario"
            >
              Ir a la página de {negocio.nombre_negocio} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
