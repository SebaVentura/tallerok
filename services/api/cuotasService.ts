import { api } from '@/services/api/client';

export type CuotaResumen = {
  total_socios?: number;
  al_dia?: number;
  deudores?: number;
  [key: string]: unknown;
};

export type MiEstadoCuota = {
  estado_cuota: string;
  periodo_actual?: string;
  monto?: number;
  vencimiento?: string;
  [key: string]: unknown;
};

/**
 * Estado de cuota del socio autenticado.
 *
 * Endpoint mobile seguro (a implementar en Laravel):
 *   GET /api/mobile/me/cuotas
 *
 * NO usar desde la app:
 *   GET /api/admin/cuotas/resumen
 *   GET /api/admin/cuotas/deudores
 * (exponen datos globales del padrón)
 */
export async function getMyCuotaStatus(): Promise<MiEstadoCuota> {
  return api.get<MiEstadoCuota>('/mobile/me/cuotas', { auth: true });
}

/** Preparado para Fase 2 — requiere wrapper mobile en backend. */
export async function getMyCuotasHistorial(): Promise<unknown[]> {
  return api.get<unknown[]>('/mobile/me/cuotas/historial', { auth: true });
}
