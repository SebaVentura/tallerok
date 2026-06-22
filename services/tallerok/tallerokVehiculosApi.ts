import { tallerokClient, TallerOkApiError } from '@/services/tallerok/tallerokClient';
import {
  normalizeTallerOkVehiculo,
  mapTallerOkHistorialToHistorialItem,
} from '@/services/tallerok/tallerokMappers';
import type {
  TallerOkCreateVehiculoPayload,
  TallerOkHistorialItem,
  TallerOkUpdateVehiculoPayload,
  TallerOkVehiculo,
} from '@/types/tallerokApi';
import type { HistorialItem } from '@/types/talleria';

function normalizeVehiculoList(raw: unknown): TallerOkVehiculo[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => normalizeTallerOkVehiculo(item as TallerOkVehiculo));
  }

  const wrapped = raw as { data?: TallerOkVehiculo[]; items?: TallerOkVehiculo[] };
  const list = wrapped.data ?? wrapped.items ?? [];
  return list.map((item) => normalizeTallerOkVehiculo(item));
}

function normalizeHistorialList(raw: unknown): HistorialItem[] {
  if (Array.isArray(raw)) {
    return raw.map((item) =>
      mapTallerOkHistorialToHistorialItem(item as TallerOkHistorialItem),
    );
  }

  const wrapped = raw as { data?: TallerOkHistorialItem[]; items?: TallerOkHistorialItem[] };
  const list = wrapped.data ?? wrapped.items ?? [];
  return list.map((item) => mapTallerOkHistorialToHistorialItem(item));
}

export async function listVehiculosByCliente(clienteId: string): Promise<TallerOkVehiculo[]> {
  try {
    const response = await tallerokClient.get<unknown>(`/clientes/${clienteId}/vehiculos`, {
      auth: true,
    });
    return normalizeVehiculoList(response);
  } catch (error) {
    if (error instanceof TallerOkApiError && (error.status === 404 || error.status === 405)) {
      const fallback = await tallerokClient.get<unknown>(
        `/vehiculos?clienteId=${encodeURIComponent(clienteId)}`,
        { auth: true },
      );
      return normalizeVehiculoList(fallback);
    }
    throw error;
  }
}

export async function createVehiculo(
  clienteId: string,
  payload: TallerOkCreateVehiculoPayload,
): Promise<TallerOkVehiculo> {
  const response = await tallerokClient.post<TallerOkVehiculo>(
    `/clientes/${clienteId}/vehiculos`,
    payload,
    { auth: true },
  );
  return normalizeTallerOkVehiculo(response);
}

export async function getVehiculo(id: string): Promise<TallerOkVehiculo> {
  const response = await tallerokClient.get<TallerOkVehiculo>(`/vehiculos/${id}`, { auth: true });
  return normalizeTallerOkVehiculo(response);
}

export async function updateVehiculo(
  id: string,
  payload: TallerOkUpdateVehiculoPayload,
): Promise<TallerOkVehiculo> {
  const response = await tallerokClient.patch<TallerOkVehiculo>(`/vehiculos/${id}`, payload, {
    auth: true,
  });
  return normalizeTallerOkVehiculo(response);
}

export async function deleteVehiculo(id: string): Promise<void> {
  await tallerokClient.delete(`/vehiculos/${id}`, { auth: true });
}

export async function getHistorialVehiculo(id: string): Promise<HistorialItem[]> {
  const response = await tallerokClient.get<unknown>(`/vehiculos/${id}/historial`, {
    auth: true,
  });
  return normalizeHistorialList(response);
}
