// Número de WhatsApp del dueño de la plataforma, para soporte (reset de
// contraseña asistido, dudas, etc.) — no confundir con el teléfono de cada
// manicurista, que es de su propio negocio.
export const WHATSAPP_SOPORTE = "+51912382709";

export function urlWhatsappSoporte(mensaje: string) {
  const soloDigitos = WHATSAPP_SOPORTE.replace(/\D/g, "");
  return `https://wa.me/${soloDigitos}?text=${encodeURIComponent(mensaje)}`;
}
