import { tallerokClient } from '@/services/tallerok/tallerokClient';
import type { TallerOkDashboard } from '@/types/tallerokApi';

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
    actividadReciente: data.actividadReciente ?? [],
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
