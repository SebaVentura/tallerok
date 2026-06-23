import { isTallerOkApiConfigured, TALLEROK_API_URL } from '@/config/tallerokEnv';

export { assertTallerOkApiConfigured } from '@/config/tallerokEnv';

type AppEnvironment = 'development' | 'staging' | 'production';

function normalizeBaseUrl(url: string | undefined): string {
  return (url ?? '').trim().replace(/\/+$/, '');
}

const apiUrl = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL);
const transcribeApiUrl = normalizeBaseUrl(process.env.EXPO_PUBLIC_TRANSCRIBE_API_URL);

const rawAppEnv = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';
const appEnv: AppEnvironment =
  rawAppEnv === 'staging' || rawAppEnv === 'production' ? rawAppEnv : 'development';

export const env = {
  apiUrl,
  tallerokApiUrl: TALLEROK_API_URL,
  transcribeApiUrl,
  appEnv,
  isApiConfigured: apiUrl.length > 0,
  isTallerOkApiConfigured,
  isDevelopment: appEnv === 'development',
} as const;

export function assertApiConfigured(): void {
  if (!env.isApiConfigured) {
    throw new Error(
      'EXPO_PUBLIC_API_URL no está configurada. Copiá .env.example a .env y definí la URL de la API CRABB.',
    );
  }
}

