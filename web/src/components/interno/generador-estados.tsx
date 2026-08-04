"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Sparkles, Download, Share2, Loader2 } from "lucide-react";

const ANCHO = 1080;
const ALTO = 1920;
const ROSADO_POR_DEFECTO = "#935060";

function oscurecer(hex: string, factor: number) {
  const limpio = hex.replace("#", "");
  const r = Math.round(parseInt(limpio.substring(0, 2), 16) * factor);
  const g = Math.round(parseInt(limpio.substring(2, 4), 16) * factor);
  const b = Math.round(parseInt(limpio.substring(4, 6), 16) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function GeneradorEstados({
  nombreNegocio,
  colorMarca,
  urlAvatar,
  slugPublico,
}: {
  nombreNegocio: string;
  colorMarca: string | null;
  urlAvatar: string | null;
  slugPublico: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generando, setGenerando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [puedeCompartir, setPuedeCompartir] = useState(false);

  const urlPublica =
    typeof window !== "undefined" && slugPublico
      ? `${window.location.origin}/${slugPublico}`
      : null;

  useEffect(() => {
    setPuedeCompartir(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  useEffect(() => {
    if (!slugPublico || !urlPublica) {
      setGenerando(false);
      setError("Configurá la dirección de tu página en 'Mi negocio' antes de generar el estado.");
      return;
    }

    let cancelado = false;

    async function dibujar() {
      setGenerando(true);
      setError(null);
      try {
        await document.fonts.ready;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const color = colorMarca || ROSADO_POR_DEFECTO;
        const colorOscuro = oscurecer(color, 0.55);

        // Fondo degradado
        const degrade = ctx.createLinearGradient(0, 0, 0, ALTO);
        degrade.addColorStop(0, color);
        degrade.addColorStop(1, colorOscuro);
        ctx.fillStyle = degrade;
        ctx.fillRect(0, 0, ANCHO, ALTO);

        // Marco decorativo
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 3;
        ctx.strokeRect(56, 56, ANCHO - 112, ALTO - 112);

        // Logo o ícono decorativo
        const centroX = ANCHO / 2;
        let cursorY = 300;

        if (urlAvatar) {
          try {
            const logo = await cargarImagen(urlAvatar);
            const radio = 130;
            ctx.save();
            ctx.beginPath();
            ctx.arc(centroX, cursorY, radio, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.fill();
            ctx.clip();
            ctx.drawImage(logo, centroX - radio, cursorY - radio, radio * 2, radio * 2);
            ctx.restore();
          } catch {
            dibujarChispa(ctx, centroX, cursorY);
          }
        } else {
          dibujarChispa(ctx, centroX, cursorY);
        }

        cursorY += 230;

        // Nombre del negocio
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = "600 76px 'Playfair Display', serif";
        ajustarYDibujarTexto(ctx, nombreNegocio, centroX, cursorY, ANCHO - 220, 84);

        cursorY += 190;

        // Llamado a la acción
        ctx.font = "500 40px 'Poppins', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.fillText("Reservá tu turno escaneando el código", centroX, cursorY);

        // QR
        if (cancelado) return;
        const qrDataUrl = await QRCode.toDataURL(urlPublica!, {
          width: 620,
          margin: 1,
          color: { dark: colorOscuro.startsWith("rgb") ? "#241a1e" : colorOscuro, light: "#ffffff" },
        });
        const qrImg = await cargarImagen(qrDataUrl);
        const qrTamano = 620;
        const qrY = cursorY + 90;
        const qrX = centroX - qrTamano / 2;

        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0,0,0,0.25)";
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 10;
        const relleno = 28;
        redondearRectangulo(ctx, qrX - relleno, qrY - relleno, qrTamano + relleno * 2, qrTamano + relleno * 2, 32);
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.drawImage(qrImg, qrX, qrY, qrTamano, qrTamano);

        // URL en texto plano
        ctx.font = "400 34px 'Poppins', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillText(urlPublica!.replace(/^https?:\/\//, ""), centroX, qrY + qrTamano + 90);

        if (!cancelado) setGenerando(false);
      } catch (err) {
        if (!cancelado) {
          setError(err instanceof Error ? err.message : "No se pudo generar la imagen.");
          setGenerando(false);
        }
      }
    }

    dibujar();
    return () => {
      cancelado = true;
    };
  }, [nombreNegocio, colorMarca, urlAvatar, slugPublico, urlPublica]);

  function dibujarChispa(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const r = 90;
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.bezierCurveTo(x + 20, y - 20, x + r, y, x + 20, y + 20);
    ctx.bezierCurveTo(x + 20, y + 20, x, y + r, x - 20, y + 20);
    ctx.bezierCurveTo(x - 20, y + 20, x - r, y, x - 20, y - 20);
    ctx.bezierCurveTo(x - 20, y - 20, x, y - r, x, y - r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function redondearRectangulo(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    ancho: number,
    alto: number,
    radio: number,
  ) {
    ctx.beginPath();
    ctx.moveTo(x + radio, y);
    ctx.arcTo(x + ancho, y, x + ancho, y + alto, radio);
    ctx.arcTo(x + ancho, y + alto, x, y + alto, radio);
    ctx.arcTo(x, y + alto, x, y, radio);
    ctx.arcTo(x, y, x + ancho, y, radio);
    ctx.closePath();
  }

  function ajustarYDibujarTexto(
    ctx: CanvasRenderingContext2D,
    texto: string,
    x: number,
    y: number,
    anchoMaximo: number,
    tamanoInicial: number,
  ) {
    let tamano = tamanoInicial;
    ctx.font = `600 ${tamano}px 'Playfair Display', serif`;
    while (ctx.measureText(texto).width > anchoMaximo && tamano > 40) {
      tamano -= 4;
      ctx.font = `600 ${tamano}px 'Playfair Display', serif`;
    }
    ctx.fillText(texto, x, y);
  }

  async function obtenerBlob(): Promise<Blob | null> {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
  }

  async function descargar() {
    const blob = await obtenerBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `estado-${nombreNegocio.toLowerCase().replace(/\s+/g, "-")}.png`;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  async function compartir() {
    const blob = await obtenerBlob();
    if (!blob) return;
    const archivo = new File([blob], "estado.png", { type: "image/png" });
    try {
      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: nombreNegocio });
      } else {
        await descargar();
      }
    } catch {
      // el usuario canceló el share nativo — no es un error real
    }
  }

  return (
    <div className="mt-8">
      <h2 className="flex items-center gap-1.5 font-titulo text-lg font-semibold text-texto-primario">
        <Sparkles className="h-4 w-4 text-rosado" /> Generador de estados
      </h2>
      <p className="mt-1 text-sm text-texto-secundario">
        Una imagen lista para tu estado de WhatsApp o Instagram, con tu marca y un código QR que
        lleva directo a tu página — tus clientas solo tienen que escanearlo para reservar.
      </p>

      <div className="mt-4 rounded-2xl border border-borde bg-superficie p-5 shadow-sm">
        {error && <p className="text-sm text-alerta">{error}</p>}

        {!error && (
          <>
            <div className="mx-auto w-full max-w-[220px] overflow-hidden rounded-2xl border border-borde shadow-sm">
              <canvas
                ref={canvasRef}
                width={ANCHO}
                height={ALTO}
                className="block w-full"
                aria-label="Vista previa del estado"
              />
              {generando && (
                <div className="flex items-center justify-center gap-1.5 bg-fondo py-3 text-xs text-texto-secundario">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generando…
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={descargar}
                disabled={generando}
                className="flex items-center gap-1.5 rounded-full bg-rosado px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Download className="h-4 w-4" /> Descargar
              </button>
              {puedeCompartir && (
                <button
                  type="button"
                  onClick={compartir}
                  disabled={generando}
                  className="flex items-center gap-1.5 rounded-full border border-borde px-5 py-2.5 text-sm font-semibold text-texto-primario disabled:opacity-50"
                >
                  <Share2 className="h-4 w-4" /> Compartir
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
