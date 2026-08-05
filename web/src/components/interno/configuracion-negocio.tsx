"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2, XCircle, ImagePlus, Palette } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { generarSlug } from "@/lib/slug";
import type { Negocio } from "@/lib/tipos";

const COLOR_POR_DEFECTO = "#935060";

export function ConfiguracionNegocio({ negocio }: { negocio: Negocio }) {
  const [nombreNegocio, setNombreNegocio] = useState(negocio.nombre_negocio);
  const [telefono, setTelefono] = useState(negocio.telefono ?? "");
  const [biografia, setBiografia] = useState(negocio.biografia ?? "");
  const [colorMarca, setColorMarca] = useState(negocio.color_marca ?? COLOR_POR_DEFECTO);
  // Si nunca tocó el selector, no queremos persistir el color por defecto
  // como si lo hubiera elegido — eso la dejaría "pegada" a ese color para
  // siempre en vez de seguir el acento del tema (claro u oscuro) de quien
  // visite su página. Solo se guarda un color si ya tenía uno antes o si
  // lo cambia en esta sesión.
  const [colorTocado, setColorTocado] = useState(negocio.color_marca !== null);
  const [slug, setSlug] = useState(negocio.slug_publico ?? "");
  const [urlAvatar, setUrlAvatar] = useState(negocio.url_avatar);
  const [politicaCancelacion, setPoliticaCancelacion] = useState(
    negocio.politica_cancelacion ?? "",
  );

  const [slugDisponible, setSlugDisponible] = useState<boolean | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputArchivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!slug || slug === negocio.slug_publico) {
      setSlugDisponible(null);
      return;
    }
    let cancelado = false;
    const temporizador = setTimeout(() => {
      const supabase = crearClienteNavegador();
      supabase.rpc("slug_disponible", { p_slug: slug }).then(({ data }) => {
        if (!cancelado) setSlugDisponible(data ?? null);
      });
    }, 400);
    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [slug, negocio.slug_publico]);

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    setGuardado(false);

    if (slugDisponible === false) {
      setError("Elegí otra dirección de página, esa ya está en uso.");
      return;
    }

    setGuardando(true);
    const supabase = crearClienteNavegador();
    const { error: errorGuardar } = await supabase
      .from("usuarios_negocios")
      .update({
        nombre_negocio: nombreNegocio,
        telefono: telefono || null,
        biografia: biografia || null,
        color_marca: colorTocado ? colorMarca : null,
        slug_publico: slug || null,
        politica_cancelacion: politicaCancelacion || null,
      })
      .eq("id", negocio.id);

    setGuardando(false);
    if (errorGuardar) {
      setError(
        errorGuardar.message.includes("duplicate key")
          ? "Esa dirección de página ya está en uso."
          : errorGuardar.message,
      );
    } else {
      setGuardado(true);
    }
  }

  async function subirLogo(archivo: File) {
    setSubiendoLogo(true);
    setError(null);
    const supabase = crearClienteNavegador();
    const ruta = `${negocio.id}/logo-${crypto.randomUUID()}-${archivo.name}`;

    const { error: errorSubir } = await supabase.storage.from("fotos-galeria").upload(ruta, archivo);
    if (errorSubir) {
      setError(errorSubir.message);
      setSubiendoLogo(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("fotos-galeria").getPublicUrl(ruta);

    const { error: errorGuardar } = await supabase
      .from("usuarios_negocios")
      .update({ url_avatar: publicUrl })
      .eq("id", negocio.id);

    setSubiendoLogo(false);
    if (errorGuardar) setError(errorGuardar.message);
    else setUrlAvatar(publicUrl);
  }

  return (
    <form
      onSubmit={guardar}
      className="mt-6 flex flex-col gap-4 rounded-2xl border border-borde bg-superficie p-6 shadow-sm"
    >
      <p className="flex items-center gap-1.5 text-sm font-semibold text-texto-primario">
        <Palette className="h-4 w-4 text-rosado-texto" /> Mi negocio
      </p>

      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-borde bg-fondo">
          {urlAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={urlAvatar} alt="Logo del negocio" className="h-full w-full object-cover" />
          ) : (
            <span className="font-titulo text-xl text-texto-secundario">
              {nombreNegocio.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <input
            ref={inputArchivo}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => e.target.files?.[0] && subirLogo(e.target.files[0])}
          />
          <button
            type="button"
            onClick={() => inputArchivo.current?.click()}
            disabled={subiendoLogo}
            className="flex items-center gap-1.5 text-sm font-semibold text-rosado-texto transition-colors hover:text-texto-primario disabled:opacity-50"
          >
            {subiendoLogo ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {subiendoLogo ? "Subiendo…" : urlAvatar ? "Cambiar logo" : "Subir logo"}
          </button>
        </div>
      </div>

      <label className="text-sm text-texto-secundario">
        Nombre del negocio
        <input
          required
          value={nombreNegocio}
          onChange={(e) => setNombreNegocio(e.target.value)}
          className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
        />
      </label>

      <label className="text-sm text-texto-secundario">
        Dirección de tu página
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-texto-secundario">
            /
          </span>
          <input
            required
            value={slug}
            onChange={(e) => setSlug(generarSlug(e.target.value))}
            className="w-full rounded-xl border border-borde bg-fondo py-2.5 pl-7 pr-4 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
          />
        </div>
        {slug !== negocio.slug_publico && slugDisponible === true && (
          <span className="animar-aparecer mt-1 flex items-center gap-1 text-xs text-exito">
            <CheckCircle2 className="h-3.5 w-3.5" /> Disponible
          </span>
        )}
        {slugDisponible === false && (
          <span className="animar-aparecer mt-1 flex items-center gap-1 text-xs text-alerta">
            <XCircle className="h-3.5 w-3.5" /> Ya está en uso
          </span>
        )}
        {slug !== negocio.slug_publico && (
          <span className="mt-1 block text-xs text-texto-secundario">
            Si la cambiás, los links viejos con la dirección anterior dejan de funcionar.
          </span>
        )}
      </label>

      <label className="text-sm text-texto-secundario">
        Teléfono (WhatsApp)
        <input
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
        />
      </label>

      <label className="text-sm text-texto-secundario">
        Biografía / descripción corta
        <textarea
          value={biografia}
          onChange={(e) => setBiografia(e.target.value)}
          placeholder="Contale a tus clientas de qué se trata tu negocio"
          className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
        />
      </label>

      <label className="text-sm text-texto-secundario">
        Color de marca
        <div className="mt-1 flex items-center gap-3">
          <input
            type="color"
            value={colorMarca}
            onChange={(e) => {
              setColorMarca(e.target.value);
              setColorTocado(true);
            }}
            className="h-11 w-16 cursor-pointer rounded-xl border border-borde bg-fondo"
          />
          <input
            value={colorMarca}
            onChange={(e) => {
              setColorMarca(e.target.value);
              setColorTocado(true);
            }}
            className="w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
          />
        </div>
        <span className="mt-1 block text-xs text-texto-secundario">
          Se usa como color principal en tu página pública (botones, links).
        </span>
      </label>

      <label className="text-sm text-texto-secundario">
        Política de cancelación (opcional)
        <textarea
          value={politicaCancelacion}
          onChange={(e) => setPoliticaCancelacion(e.target.value)}
          placeholder="Ej: la seña no es reembolsable si cancelás con menos de 24hs de anticipación."
          className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
        />
        <span className="mt-1 block text-xs text-texto-secundario">
          Se muestra a la clienta antes de confirmar una reserva.
        </span>
      </label>

      {error && <p className="animar-aparecer text-sm text-alerta">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={guardando}
          className="flex items-center gap-1.5 rounded-full bg-rosado px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        {guardado && (
          <span className="animar-aparecer flex items-center gap-1 text-xs text-exito">
            <CheckCircle2 className="h-3.5 w-3.5" /> Guardado
          </span>
        )}
      </div>
    </form>
  );
}
