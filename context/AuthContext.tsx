import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { env } from '@/config/env';
import * as authService from '@/services/api/authService';
import { ApiError } from '@/services/api/client';
import type { MobileLoginPayload, MobileMeResponse, MobileSocio, MobileUser } from '@/types/api';

export type ConnectionMode = 'loading' | 'connected' | 'demo';

type AuthContextValue = {
  connectionMode: ConnectionMode;
  isApiConfigured: boolean;
  isAuthenticated: boolean;
  isRestoring: boolean;
  user: MobileUser | null;
  socio: MobileSocio | null;
  authError: string | null;
  login: (payload: MobileLoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  clearAuthError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('loading');
  const [isRestoring, setIsRestoring] = useState(true);
  const [user, setUser] = useState<MobileUser | null>(null);
  const [socio, setSocio] = useState<MobileSocio | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const applySession = useCallback((session: MobileMeResponse | null) => {
    if (session?.user) {
      setUser(session.user);
      setSocio(session.socio ?? null);
      setConnectionMode('connected');
    } else {
      setUser(null);
      setSocio(null);
      setConnectionMode('demo');
    }
  }, []);

  const refreshMe = useCallback(async () => {
    if (!env.isApiConfigured) {
      applySession(null);
      return;
    }

    const session = await authService.restoreSession();
    applySession(session);
  }, [applySession]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!env.isApiConfigured) {
          if (mounted) {
            applySession(null);
          }
          return;
        }

        const session = await authService.restoreSession();
        if (mounted) {
          applySession(session);
        }
      } finally {
        if (mounted) {
          setIsRestoring(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [applySession]);

  const login = useCallback(
    async (payload: MobileLoginPayload) => {
      setAuthError(null);

      if (!env.isApiConfigured) {
        setAuthError('Configurá EXPO_PUBLIC_API_URL en el archivo .env');
        return;
      }

      try {
        const response = await authService.login(payload);
        setUser(response.user);
        setSocio(response.socio ?? null);
        setConnectionMode('connected');

        try {
          const me = await authService.fetchMe();
          setUser(me.user);
          setSocio(me.socio ?? null);
        } catch {
          // Login OK pero /me falló — mantenemos datos del login.
        }
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'No se pudo iniciar sesión';
        setAuthError(message);
        throw error;
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    setAuthError(null);
    await authService.logout();
    applySession(null);
  }, [applySession]);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      connectionMode,
      isApiConfigured: env.isApiConfigured,
      isAuthenticated: connectionMode === 'connected',
      isRestoring,
      user,
      socio,
      authError,
      login,
      logout,
      refreshMe,
      clearAuthError,
    }),
    [
      authError,
      clearAuthError,
      connectionMode,
      isRestoring,
      login,
      logout,
      refreshMe,
      socio,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext debe usarse dentro de AuthProvider');
  }
  return context;
}
