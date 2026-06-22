import { tallerokClient } from '@/services/tallerok/tallerokClient';
import { normalizeTallerOkCliente } from '@/services/tallerok/tallerokMappers';
import type {
  TallerOkCliente,
  TallerOkCreateClientePayload,
  TallerOkUpdateClientePayload,
} from '@/types/tallerokApi';

function normalizeClienteList(raw: unknown): TallerOkCliente[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => normalizeTallerOkCliente(item as TallerOkCliente));
  }

  const wrapped = raw as { data?: TallerOkCliente[]; items?: TallerOkCliente[] };
  const list = wrapped.data ?? wrapped.items ?? [];
  return list.map((item) => normalizeTallerOkCliente(item));
}

export async function listClientes(): Promise<TallerOkCliente[]> {
  const response = await tallerokClient.get<unknown>('/clientes', { auth: true });
  return normalizeClienteList(response);
}

export async function createCliente(payload: TallerOkCreateClientePayload): Promise<TallerOkCliente> {
  const response = await tallerokClient.post<TallerOkCliente>('/clientes', payload, { auth: true });
  return normalizeTallerOkCliente(response);
}

export async function getCliente(id: string): Promise<TallerOkCliente> {
  const response = await tallerokClient.get<TallerOkCliente>(`/clientes/${id}`, { auth: true });
  return normalizeTallerOkCliente(response);
}

export async function updateCliente(
  id: string,
  payload: TallerOkUpdateClientePayload,
): Promise<TallerOkCliente> {
  const response = await tallerokClient.patch<TallerOkCliente>(`/clientes/${id}`, payload, {
    auth: true,
  });
  return normalizeTallerOkCliente(response);
}

export async function deleteCliente(id: string): Promise<void> {
  await tallerokClient.delete(`/clientes/${id}`, { auth: true });
}
