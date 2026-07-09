import { tallerokClient } from '@/services/tallerok/tallerokClient';
import { normalizeTallerOkOrden } from '@/services/tallerok/tallerokMappers';
import type {
  TallerOkCreateOrdenPayload,
  TallerOkListOrdenesParams,
  TallerOkOrden,
  TallerOkUpdateOrdenPayload,
} from '@/types/tallerokApi';

function normalizeOrdenList(raw: unknown): TallerOkOrden[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => normalizeTallerOkOrden(item));
  }

  const wrapped = raw as { data?: unknown[]; items?: unknown[] };
  const list = wrapped.data ?? wrapped.items ?? [];
  return list.map((item) => normalizeTallerOkOrden(item));
}

function buildOrdenesQuery(params?: TallerOkListOrdenesParams): string {
  if (!params) return '';
  const search = new URLSearchParams();
  if (params.estado?.trim()) search.set('estado', params.estado.trim());
  if (params.vehiculoId?.trim()) search.set('vehiculoId', params.vehiculoId.trim());
  if (params.clienteId?.trim()) search.set('clienteId', params.clienteId.trim());
  if (params.q?.trim()) search.set('q', params.q.trim());
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function listTallerOkOrdenes(
  params?: TallerOkListOrdenesParams,
): Promise<TallerOkOrden[]> {
  const response = await tallerokClient.get<unknown>(`/ordenes${buildOrdenesQuery(params)}`, {
    auth: true,
  });
  return normalizeOrdenList(response);
}

export async function getTallerOkOrden(id: string): Promise<TallerOkOrden> {
  const response = await tallerokClient.get<unknown>(`/ordenes/${id}`, { auth: true });
  return normalizeTallerOkOrden(response);
}

export async function createTallerOkOrden(
  payload: TallerOkCreateOrdenPayload,
): Promise<TallerOkOrden> {
  const response = await tallerokClient.post<unknown>('/ordenes', payload, { auth: true });
  return normalizeTallerOkOrden(response);
}

export async function updateTallerOkOrden(
  id: string,
  payload: TallerOkUpdateOrdenPayload,
): Promise<TallerOkOrden> {
  const response = await tallerokClient.patch<unknown>(`/ordenes/${id}`, payload, { auth: true });
  return normalizeTallerOkOrden(response);
}
