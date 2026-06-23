/**
 * Calcula el hash SHA-256 de un objeto File utilizando la API de Web Crypto nativa del navegador.
 */
export async function calculateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Calcula un hash combinado para múltiples archivos basándose en sus metadatos (nombre, tamaño, fecha de modificación).
 * Esto evita cargar múltiples imágenes grandes en memoria solo para el hash.
 */
export async function calculateMultipleFilesHash(files: File[]): Promise<string> {
  const metadataString = files
    .map(f => `${f.name}-${f.size}-${f.lastModified}`)
    .join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(metadataString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
