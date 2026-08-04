// Exportación simple a CSV, todo del lado del cliente (sin librería nueva).
// Separador ";" en vez de "," porque Excel en español lo autodetecta mejor
// (la "," ya la usa como separador decimal).
function celda(valor: string | number | null | undefined) {
  const texto = String(valor ?? "");
  return `"${texto.replace(/"/g, '""')}"`;
}

export function descargarCSV(nombreArchivo: string, encabezados: string[], filas: (string | number | null)[][]) {
  const contenido = [encabezados.map(celda).join(";"), ...filas.map((fila) => fila.map(celda).join(";"))].join(
    "\r\n",
  );
  // BOM para que Excel reconozca UTF-8 y no rompa tildes/ñ.
  const blob = new Blob(["﻿" + contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(url);
}
