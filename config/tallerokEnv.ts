const FALLBACK_TALLEROK_API_URL = 'https://tallerok-api.crabbahia.com.ar/api';

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export const TALLEROK_API_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_TALLEROK_API_URL ?? FALLBACK_TALLEROK_API_URL,
);

export const isTallerOkApiConfigured = Boolean(process.env.EXPO_PUBLIC_TALLEROK_API_URL?.trim());

export function assertTallerOkApiConfigured(): void {
  if (!TALLEROK_API_URL) {
    throw new Error(
      'EXPO_PUBLIC_TALLEROK_API_URL no está configurada. Copiá .env.example a .env y definí la URL de la API TallerOK.',
    );
  }
}
