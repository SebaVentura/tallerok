import { tallerokClient } from '@/services/tallerok/tallerokClient';

type HealthResponse = {
  status?: string;
  ok?: boolean;
  message?: string;
};

export async function checkHealth(): Promise<{ ok: boolean; status: number }> {
  try {
    const response = await tallerokClient.get<HealthResponse>('/health');
    const ok = response?.status === 'ok' || response?.ok === true;
    return { ok, status: 200 };
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error) {
      return { ok: false, status: (error as { status: number }).status };
    }
    return { ok: false, status: 0 };
  }
}
