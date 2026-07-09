import { env } from '@/config/env';
import { tallerokClient } from '@/services/tallerok/tallerokClient';
import {
  extractAccessToken,
  INCOMPLETE_SESSION_MESSAGE,
  logAuthResponseDiagnostics,
  logNormalizedSession,
  normalizeSessionPayload,
  TallerOkSessionError,
  type NormalizedAuthSession,
} from '@/services/tallerok/tallerokSessionNormalize';
import { clearTallerOkToken, saveTallerOkToken } from '@/services/tallerok/tallerokTokenStorage';
import type {
  TallerOkAuthResponse,
  TallerOkLoginPayload,
  TallerOkMeResponse,
  TallerOkRegisterTallerPayload,
} from '@/types/tallerokApi';

async function fetchMeSession(): Promise<TallerOkMeResponse> {
  const response = await tallerokClient.get<unknown>('/me', { auth: true });
  logAuthResponseDiagnostics('GET /me', response, 200);
  const session = normalizeSessionPayload(response);
  logNormalizedSession('GET /me', session);
  return session;
}

async function resolveSessionFromAuthResponse(
  raw: unknown,
  accessToken: string,
  label: string,
  status: number,
): Promise<NormalizedAuthSession> {
  logAuthResponseDiagnostics(label, raw, status);

  try {
    const session = normalizeSessionPayload(raw);
    logNormalizedSession(label, session);
    return session;
  } catch (primaryError) {
    if (env.isDevelopment) {
      const reason = primaryError instanceof Error ? primaryError.message : String(primaryError);
      console.log(`[TallerOK Auth] ${label} fallback → GET /me (${reason})`);
    }

    await saveTallerOkToken(accessToken);
    try {
      const meSession = await fetchMeSession();
      logNormalizedSession(`${label}-fallback-me`, meSession);
      return meSession;
    } catch {
      await clearTallerOkToken();
      throw new TallerOkSessionError(
        `${INCOMPLETE_SESSION_MESSAGE} Tampoco se pudo recuperar con GET /me.`,
      );
    }
  }
}

async function persistAuthFromResponse(
  raw: unknown,
  label: string,
  status: number,
): Promise<TallerOkAuthResponse> {
  const accessToken = extractAccessToken(raw);

  try {
    const session = await resolveSessionFromAuthResponse(raw, accessToken, label, status);
    await saveTallerOkToken(accessToken);
    return { accessToken, ...session };
  } catch (error) {
    await clearTallerOkToken();
    throw error;
  }
}

export async function registerTaller(
  payload: TallerOkRegisterTallerPayload,
): Promise<TallerOkAuthResponse> {
  const response = await tallerokClient.post<unknown>('/auth/register-taller', payload);
  return persistAuthFromResponse(response, 'POST /auth/register-taller', 201);
}

export async function login(payload: TallerOkLoginPayload): Promise<TallerOkAuthResponse> {
  const response = await tallerokClient.post<unknown>('/auth/login', payload);
  return persistAuthFromResponse(response, 'POST /auth/login', 200);
}

export async function me(): Promise<TallerOkMeResponse> {
  return fetchMeSession();
}

export async function logoutLocal(): Promise<void> {
  await clearTallerOkToken();
}
