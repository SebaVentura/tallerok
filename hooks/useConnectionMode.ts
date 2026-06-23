import { useAuth } from '@/hooks/useAuth';
import { useTallerOkAuth } from '@/hooks/useTallerOkAuth';

export type AppConnectionMode =
  | 'loading'
  | 'demo'
  | 'tallerok_connected'
  | 'crabb_connected';

export function useConnectionMode(): AppConnectionMode {
  const { connectionMode: crabbMode, isRestoring: crabbRestoring } = useAuth();
  const { isAuthenticated: tallerokAuth, isLoading: tallerokLoading, isDemoMode } = useTallerOkAuth();

  if (tallerokLoading || crabbRestoring || crabbMode === 'loading') {
    return 'loading';
  }

  if (tallerokAuth) {
    return 'tallerok_connected';
  }

  if (crabbMode === 'crabb_connected') {
    return 'crabb_connected';
  }

  if (isDemoMode) {
    return 'demo';
  }

  return 'loading';
}
