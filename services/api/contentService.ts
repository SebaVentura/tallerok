import { api } from '@/services/api/client';

export type InstitutionalContent = {
  id: number;
  title: string;
  body?: string;
  excerpt?: string;
  image_url?: string | null;
  published_at?: string;
  [key: string]: unknown;
};

export type InstitutionalHome = {
  hero_title?: string;
  hero_subtitle?: string;
  sections?: InstitutionalContent[];
  [key: string]: unknown;
};

/**
 * Home institucional para la app móvil.
 *
 * Endpoint mobile seguro (a implementar):
 *   GET /api/mobile/institutional/home
 *
 * NO consumir directamente endpoints admin de CMS/landing si listan
 * borradores o contenido no publicado.
 */
export async function getInstitutionalHome(): Promise<InstitutionalHome> {
  return api.get<InstitutionalHome>('/mobile/institutional/home', { auth: false });
}

export async function getNews(): Promise<InstitutionalContent[]> {
  return api.get<InstitutionalContent[]>('/mobile/news', { auth: false });
}

export async function getEvents(): Promise<InstitutionalContent[]> {
  return api.get<InstitutionalContent[]>('/mobile/events', { auth: false });
}
