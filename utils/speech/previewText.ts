const DEFAULT_MAX = 80;

/**
 * Recorte seguro para logs de diagnóstico: nunca imprime más de `max`
 * caracteres y colapsa saltos de línea. No expone datos personales completos.
 */
export function previewText(value: string, max: number = DEFAULT_MAX): string {
  const flattened = value.replace(/\s+/g, ' ').trim();
  if (flattened.length <= max) {
    return flattened;
  }
  return `${flattened.slice(0, max)}…`;
}
