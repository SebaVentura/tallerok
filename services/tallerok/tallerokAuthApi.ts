import { tallerokClient } from '@/services/tallerok/tallerokClient';
import type { TallerOkTaller } from '@/types/tallerokApi';
import {
  normalizeTallerOkTaller,
  normalizeTallerOkUser,
} from '@/services/tallerok/tallerokMappers';
import { clearTallerOkToken, saveTallerOkToken } from '@/services/tallerok/tallerokTokenStorage';
import type {
  TallerOkAuthResponse,
  TallerOkLoginPayload,
  TallerOkMeResponse,
  TallerOkRegisterTallerPayload,
} from '@/types/tallerokApi';

type RawAuthResponse = TallerOkAuthResponse & {
  access_token?: string;
  token?: string;
};

function extractAccessToken(response: RawAuthResponse): string {
  const token = response.accessToken ?? response.access_token ?? response.token;
  if (!token) {
    throw new Error('La API no devolvió un token de acceso');
  }
  return token;
}

function normalizeAuthResponse(raw: RawAuthResponse): TallerOkAuthResponse {
  return {
    accessToken: extractAccessToken(raw),
    user: normalizeTallerOkUser(raw.user),
    taller: normalizeTallerOkTaller(raw.taller),
  };
}

function normalizeMeResponse(raw: TallerOkMeResponse): TallerOkMeResponse {
  return {
    user: normalizeTallerOkUser(raw.user),
    taller: normalizeTallerOkTaller(raw.taller),
  };
}

export async function registerTaller(
  payload: TallerOkRegisterTallerPayload,
): Promise<TallerOkAuthResponse> {
  const response = await tallerokClient.post<RawAuthResponse>('/auth/register-taller', payload);
  const normalized = normalizeAuthResponse(response);
  await saveTallerOkToken(normalized.accessToken);
  return normalized;
}

export async function login(payload: TallerOkLoginPayload): Promise<TallerOkAuthResponse> {
  const response = await tallerokClient.post<RawAuthResponse>('/auth/login', payload);
  const normalized = normalizeAuthResponse(response);
  await saveTallerOkToken(normalized.accessToken);
  return normalized;
}

export async function me(): Promise<TallerOkMeResponse> {
  const response = await tallerokClient.get<TallerOkMeResponse>('/me', { auth: true });
  return normalizeMeResponse(response);
}

export async function logoutLocal(): Promise<void> {
  await clearTallerOkToken();
}
