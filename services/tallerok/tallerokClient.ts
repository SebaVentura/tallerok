import { env } from '@/config/env';
import {
  assertTallerOkApiConfigured,
  TALLEROK_API_URL,
} from '@/config/tallerokEnv';
import { logTallerOkApiRequest } from '@/services/tallerok/tallerokApiLogger';
import { clearTallerOkToken, getTallerOkToken } from '@/services/tallerok/tallerokTokenStorage';
import type { TallerOkApiErrorBody } from '@/types/tallerokApi';

const DEFAULT_TIMEOUT_MS = 20_000;

let hasLoggedBaseUrl = false;

function logBaseUrlOnce(): void {
  if (hasLoggedBaseUrl || !env.isDevelopment) {
    return;
  }

  hasLoggedBaseUrl = true;
  console.log('[TallerOK API] baseUrl:', TALLEROK_API_URL);
}

export class TallerOkApiError extends Error {
  readonly status: number;
  readonly body: TallerOkApiErrorBody | null;
  readonly isUnauthorized: boolean;

  constructor(status: number, message: string, body: TallerOkApiErrorBody | null = null) {
    super(message);
    this.name = 'TallerOkApiError';
    this.status = status;
    this.body = body;
    this.isUnauthorized = status === 401;
  }
}

type RequestOptions = {
  auth?: boolean;
  timeoutMs?: number;
  headers?: Record<string, string>;
};

type OnUnauthorized = () => void | Promise<void>;

let onUnauthorizedHandler: OnUnauthorized | null = null;

export function setTallerOkUnauthorizedHandler(handler: OnUnauthorized | null): void {
  onUnauthorizedHandler = handler;
}

async function parseErrorBody(response: Response): Promise<TallerOkApiErrorBody | null> {
  try {
    return (await response.json()) as TallerOkApiErrorBody;
  } catch {
    return null;
  }
}

function formatErrorMessage(status: number, body: TallerOkApiErrorBody | null): string {
  if (body?.message) {
    return Array.isArray(body.message) ? body.message.join('. ') : body.message;
  }

  if (status === 401) return 'Sesión TallerOK inválida o expirada';
  if (status === 403) return 'No tenés permiso para esta acción';
  if (status === 404) return 'Recurso no encontrado';
  if (status === 408) return 'La solicitud tardó demasiado. Verificá tu conexión.';
  return `Error HTTP ${status}`;
}

function buildUrl(path: string): string {
  assertTallerOkApiConfigured();
  logBaseUrlOnce();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${TALLEROK_API_URL}${normalizedPath}`;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = false, timeoutMs = DEFAULT_TIMEOUT_MS, headers = {} } = options;
  const startedAt = Date.now();
  let usedToken = false;

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = await getTallerOkToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
      usedToken = true;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const logRequest = (status: number, error?: string) => {
    logTallerOkApiRequest({
      method,
      endpoint: path,
      status,
      durationMs: Date.now() - startedAt,
      usedToken,
      error,
    });
  };

  try {
    const response = await fetch(buildUrl(path), {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await parseErrorBody(response);
      const message = formatErrorMessage(response.status, errorBody);
      logRequest(response.status, message);

      if (response.status === 401) {
        await clearTallerOkToken();
        await onUnauthorizedHandler?.();
      }

      throw new TallerOkApiError(response.status, message, errorBody);
    }

    logRequest(response.status);

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof TallerOkApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      const message = 'La solicitud tardó demasiado. Verificá tu conexión.';
      logRequest(408, message);
      throw new TallerOkApiError(408, message);
    }

    const message =
      error instanceof Error ? error.message : 'No se pudo conectar con la API TallerOK';
    logRequest(0, message);
    throw new TallerOkApiError(0, message);
  } finally {
    clearTimeout(timeoutId);
  }
}

export const tallerokClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),
};
