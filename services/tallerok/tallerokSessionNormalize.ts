import { env } from '@/config/env';
import {
  normalizeTallerOkTaller,
  normalizeTallerOkUser,
} from '@/services/tallerok/tallerokMappers';
import type { TallerOkMeResponse, TallerOkTaller, TallerOkUser } from '@/types/tallerokApi';

export const INCOMPLETE_SESSION_MESSAGE =
  'La API no devolvió una sesión completa. Falta user o taller.';

export class TallerOkSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TallerOkSessionError';
  }
}

type RecordLike = Record<string, unknown>;

function isRecord(value: unknown): value is RecordLike {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function maskToken(token: string): string {
  if (token.length <= 10) return '(token corto)';
  return `${token.slice(0, 10)}…`;
}

function resolveIdFromRecord(entity: RecordLike): string {
  const id = entity.id ?? entity._id;
  return typeof id === 'string' ? id : id != null ? String(id) : '';
}

function hasEntityId(entity: unknown): boolean {
  return isRecord(entity) && resolveIdFromRecord(entity).length > 0;
}

/** Desenvuelve `{ data: ... }` (legacy) o devuelve el objeto raíz. */
export function unwrapAuthPayload(raw: unknown): RecordLike {
  if (!isRecord(raw)) {
    return {};
  }
  if (isRecord(raw.data)) {
    return { ...raw, ...raw.data };
  }
  return raw;
}

export function extractAccessToken(raw: unknown): string {
  const payload = unwrapAuthPayload(raw);
  const token =
    (typeof payload.accessToken === 'string' && payload.accessToken) ||
    (typeof payload.access_token === 'string' && payload.access_token) ||
    (typeof payload.token === 'string' && payload.token) ||
    null;

  if (!token?.trim()) {
    throw new TallerOkSessionError(
      'La API no devolvió un token de acceso (accessToken / access_token / token).',
    );
  }

  return token.trim();
}

function extractNestedUser(payload: RecordLike): unknown {
  if (isRecord(payload.user)) return payload.user;
  if (isRecord(payload.usuario)) return payload.usuario;
  return undefined;
}

function extractNestedTaller(payload: RecordLike): unknown {
  if (isRecord(payload.taller)) return payload.taller;
  if (isRecord(payload.tallerData)) return payload.tallerData;
  if (isRecord(payload.workshop)) return payload.workshop;
  return undefined;
}

export type NormalizedAuthSession = TallerOkMeResponse;

/**
 * Normaliza login, registro o GET /me al formato interno estable.
 * Contrato principal: { accessToken?, user: { id, email, name, role }, taller: { id, nombre, ... } }
 */
export function normalizeSessionPayload(raw: unknown): NormalizedAuthSession {
  const payload = unwrapAuthPayload(raw);
  const userRaw = extractNestedUser(payload);
  const tallerRaw = extractNestedTaller(payload);

  if (!userRaw || !tallerRaw) {
    throw new TallerOkSessionError(INCOMPLETE_SESSION_MESSAGE);
  }

  try {
    return {
      user: normalizeTallerOkUser(userRaw),
      taller: normalizeTallerOkTaller(tallerRaw),
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'datos inválidos';
    throw new TallerOkSessionError(`${INCOMPLETE_SESSION_MESSAGE} (${detail})`);
  }
}

/** @deprecated Usar normalizeSessionPayload */
export function normalizeAuthSession(raw: unknown): NormalizedAuthSession {
  return normalizeSessionPayload(raw);
}

/** @deprecated Usar normalizeSessionPayload */
export function normalizeMeSession(raw: unknown): NormalizedAuthSession {
  return normalizeSessionPayload(raw);
}

export function logAuthResponseDiagnostics(
  label: string,
  raw: unknown,
  status?: number,
): void {
  if (!env.isDevelopment) return;

  const payload = unwrapAuthPayload(raw);
  const keys = Object.keys(payload);

  let token: string | null = null;
  try {
    token = extractAccessToken(raw);
  } catch {
    token = null;
  }

  const userRaw = extractNestedUser(payload);
  const tallerRaw = extractNestedTaller(payload);

  console.log(`[TallerOK Auth] ${label} status=${status ?? '?'}`);
  console.log(`[TallerOK Auth] response keys: ${keys.join(', ') || '(vacío)'}`);
  console.log(
    `[TallerOK Auth] hasToken=${Boolean(token)}${
      token ? ` prefix=${maskToken(token)}` : ''
    }`,
  );
  console.log(`[TallerOK Auth] hasUser=${Boolean(userRaw)} user.idExists=${hasEntityId(userRaw)}`);
  console.log(
    `[TallerOK Auth] hasTaller=${Boolean(tallerRaw)} taller.idExists=${hasEntityId(tallerRaw)}`,
  );
}

export function logNormalizedSession(label: string, session: NormalizedAuthSession): void {
  if (!env.isDevelopment) return;

  console.log(
    `[TallerOK Auth] ${label} normalized user.id=${session.user.id} user.name=${session.user.name} taller.id=${session.taller.id} taller.nombre=${session.taller.nombre}`,
  );
}
