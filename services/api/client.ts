import { assertApiConfigured, env } from '@/config/env';
import { getToken } from '@/services/storage/tokenStorage';
import type { ApiErrorBody } from '@/types/api';

const DEFAULT_TIMEOUT_MS = 20_000;

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, message: string, body: ApiErrorBody | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  auth?: boolean;
  timeoutMs?: number;
  headers?: Record<string, string>;
};

async function parseErrorBody(response: Response): Promise<ApiErrorBody | null> {
  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return null;
  }
}

function buildUrl(path: string): string {
  assertApiConfigured();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${env.apiUrl}${normalizedPath}`;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = false, timeoutMs = DEFAULT_TIMEOUT_MS, headers = {} } = options;

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = await getToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildUrl(path), {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await parseErrorBody(response);
      const message =
        errorBody?.message ??
        (response.status === 401
          ? 'Sesión inválida o expirada'
          : response.status === 403
            ? 'No tenés permiso para esta acción'
            : response.status === 404
              ? 'Recurso no encontrado'
              : `Error HTTP ${response.status}`);

      throw new ApiError(response.status, message, errorBody);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, 'La solicitud tardó demasiado. Verificá tu conexión.');
    }

    throw new ApiError(
      0,
      error instanceof Error ? error.message : 'No se pudo conectar con la API CRABB',
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),
};
