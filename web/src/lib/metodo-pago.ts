import { QrCode, Smartphone, Banknote } from "lucide-react";
import type { MetodoPago } from "@/lib/tipos";

export const ETIQUETA_METODO_PAGO: Record<MetodoPago, string> = {
  yape: "Yape",
  plin: "Plin",
  efectivo: "Efectivo",
};

export const ICONO_METODO_PAGO: Record<MetodoPago, React.ComponentType<{ className?: string }>> = {
  yape: QrCode,
  plin: Smartphone,
  efectivo: Banknote,
};

// Clases de Tailwind por método — yape/plin usan tokens propios (violeta/
// turquesa, no hay nada parecido en el resto de la paleta), efectivo reusa
// --color-exito (el verde ya existente encaja con "billete en mano").
export const CLASES_METODO_PAGO: Record<MetodoPago, { texto: string; fondoSuave: string; borde: string }> = {
  yape: { texto: "text-yape", fondoSuave: "bg-yape-suave", borde: "border-yape" },
  plin: { texto: "text-plin", fondoSuave: "bg-plin-suave", borde: "border-plin" },
  efectivo: { texto: "text-exito", fondoSuave: "bg-exito-suave", borde: "border-exito" },
};
