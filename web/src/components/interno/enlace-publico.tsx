"use client";

import { useEffect, useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

export function EnlacePublico({ slug }: { slug: string }) {
  // Arranca igual en servidor y cliente (evita el flash de hidratación) y
  // recién después de montar se completa con el origen real del navegador.
  const [url, setUrl] = useState(`/${slug}`);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/${slug}`);
  }, [slug]);

  async function copiar() {
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="mt-6 flex items-center gap-2 rounded-2xl border border-borde bg-superficie p-3 shadow-sm">
      <a
        href={`/${slug}`}
        target="_blank"
        rel="noreferrer"
        className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-semibold text-rosado-texto hover:underline"
      >
        <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
      </a>
      <button
        type="button"
        onClick={copiar}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-rosado px-3.5 py-2 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5"
      >
        {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copiado ? "¡Copiado!" : "Copiar"}
      </button>
    </div>
  );
}
