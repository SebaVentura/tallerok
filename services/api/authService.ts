import { api } from '@/services/api/client';
import { clearToken, getToken, saveToken } from '@/services/storage/tokenStorage';
import type { MobileLoginPayload, MobileLoginResponse, MobileMeResponse } from '@/types/api';

const MOBILE_AUTH = {
  login: '/mobile/auth/login',
  me: '/mobile/me',
  logout: '/mobile/auth/logout',
} as const;

/**
 * Login móvil contra namespace /api/mobile/auth/*.
 * No usar endpoints /admin/* ni /login web del panel administrativo.
 */
export async function login(payload: MobileLoginPayload): Promise<MobileLoginResponse> {
  const response = await api.post<MobileLoginResponse>(MOBILE_AUTH.login, payload);
  await saveToken(response.token);
  return response;
}

export async function fetchMe(): Promise<MobileMeResponse> {
  return api.get<MobileMeResponse>(MOBILE_AUTH.me, { auth: true });
}

export async function logout(): Promise<void> {
  try {
    const token = await getToken();
    if (token) {
      await api.post(MOBILE_AUTH.logout, undefined, { auth: true });
    }
  } catch {
    // Si el servidor no responde, igual limpiamos la sesión local.
  } finally {
    await clearToken();
  }
}

export async function restoreSession(): Promise<MobileMeResponse | null> {
  const token = await getToken();
  if (!token) {
    return null;
  }

  try {
    return await fetchMe();
  } catch {
    await clearToken();
    return null;
  }
}
