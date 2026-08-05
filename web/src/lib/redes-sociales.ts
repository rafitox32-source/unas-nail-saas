const BASES: Record<"instagram" | "tiktok" | "facebook", string> = {
  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/@",
  facebook: "https://facebook.com/",
};

// Acepta lo que la dueña del negocio escriba (URL completa, "@usuario" o
// "usuario" a secas) y devuelve un link armado y clicable. Si ya pegó una
// URL completa, se respeta tal cual.
export function urlRedSocial(red: keyof typeof BASES, valor: string | null | undefined) {
  if (!valor) return null;
  const limpio = valor.trim();
  if (limpio.length === 0) return null;
  if (/^https?:\/\//i.test(limpio)) return limpio;
  const usuario = limpio.replace(/^@/, "");
  return `${BASES[red]}${usuario}`;
}
