const MAPA_ACENTOS: Record<string, string> = {
  á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u", ñ: "n",
};

export function generarSlug(texto: string) {
  const sinAcentos = texto
    .toLowerCase()
    .split("")
    .map((caracter) => MAPA_ACENTOS[caracter] ?? caracter)
    .join("");

  return sinAcentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
