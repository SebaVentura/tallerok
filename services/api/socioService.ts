import { api } from '@/services/api/client';
import type { MobileSocio } from '@/types/api';

/**
 * Perfil del socio autenticado.
 * Requiere endpoints mobile seguros — no consumir listados admin del padrón.
 */
export async function getMySocioProfile(): Promise<MobileSocio | null> {
  const me = await api.get<{ socio: MobileSocio | null }>('/mobile/me', { auth: true });
  return me.socio;
}
