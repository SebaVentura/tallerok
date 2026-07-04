import { tallerokClient } from '@/services/tallerok/tallerokClient';
import { normalizeTallerOkTaller } from '@/services/tallerok/tallerokMappers';
import type { TallerOkTaller, TallerOkUpdateTallerPayload } from '@/types/tallerokApi';

export async function getTallerMe(): Promise<TallerOkTaller> {
  const response = await tallerokClient.get<TallerOkTaller>('/taller/me', { auth: true });
  return normalizeTallerOkTaller(response);
}

export async function updateTallerMe(payload: TallerOkUpdateTallerPayload): Promise<TallerOkTaller> {
  const response = await tallerokClient.patch<TallerOkTaller>('/taller/me', payload, {
    auth: true,
  });
  return normalizeTallerOkTaller(response);
}
