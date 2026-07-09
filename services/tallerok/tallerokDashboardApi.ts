import { tallerokClient } from '@/services/tallerok/tallerokClient';
import type { TallerOkActividadReciente, TallerOkDashboard } from '@/types/tallerokApi';

const EMPTY_DASHBOARD: TallerOkDashboard = {
  clientesTotal: 0,
  vehiculosTotal: 0,
  ordenesActivas: 0,
  presupuestosPendientes: 0,
  actividadReciente: [],
};

function normalizeDashboard(raw: TallerOkDashboard | { data?: TallerOkDashboard }): TallerOkDashboard {
  const data = 'data' in raw && raw.data ? raw.data : (raw as TallerOkDashboard);

  return {
    clientesTotal: data.clientesTotal ?? 0,
    vehiculosTotal: data.vehiculosTotal ?? 0,
    ordenesActivas: data.ordenesActivas ?? 0,
    presupuestosPendientes: data.presupuestosPendientes ?? 0,
    actividadReciente: (data.actividadReciente ?? []).map((item, index) => {
      const rawItem = item as TallerOkActividadReciente & { _id?: string };
      return {
        id: rawItem.id ?? rawItem._id ?? `actividad-${index}`,
        fecha: rawItem.fecha ?? '',
        motivo: rawItem.motivo ?? '',
        estado: rawItem.estado ?? '',
        vehiculoId: rawItem.vehiculoId ?? null,
        vehiculoPatente: rawItem.vehiculoPatente ?? null,
        ordenId: rawItem.ordenId ?? null,
      };
    }),
  };
}

export async function getDashboard(): Promise<TallerOkDashboard> {
  const response = await tallerokClient.get<TallerOkDashboard | { data: TallerOkDashboard }>(
    '/dashboard',
    { auth: true },
  );
  return normalizeDashboard(response);
}

export { EMPTY_DASHBOARD };
