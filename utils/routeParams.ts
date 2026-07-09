/** Normaliza query params de Expo Router (string | string[] | undefined). */
export function parseRouteParam(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) {
    const first = value[0]?.trim();
    return first || undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}
