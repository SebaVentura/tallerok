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
import * as tallerokAuthApi from '@/services/tallerok/tallerokAuthApi';
import { setTallerOkUnauthorizedHandler, TallerOkApiError } from '@/services/tallerok/tallerokClient';
import { getTallerOkToken } from '@/services/tallerok/tallerokTokenStorage';
import type {
  TallerOkLoginPayload,
  TallerOkRegisterTallerPayload,
  TallerOkTaller,
  TallerOkUser,
} from '@/types/tallerokApi';

type TallerOkAuthContextValue = {
  isTallerOkApiConfigured: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: TallerOkUser | null;
  taller: TallerOkTaller | null;
  token: string | null;
  authError: string | null;
  sessionExpired: boolean;
  login: (payload: TallerOkLoginPayload) => Promise<void>;
  registerTaller: (payload: TallerOkRegisterTallerPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  clearAuthError: () => void;
  clearSessionExpired: () => void;
};

const TallerOkAuthContext = createContext<TallerOkAuthContextValue | null>(null);

export function TallerOkAuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<TallerOkUser | null>(null);
  const [taller, setTaller] = useState<TallerOkTaller | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const clearSession = useCallback(() => {
    setUser(null);
    setTaller(null);
    setToken(null);
  }, []);

  const applySession = useCallback(
    (session: { user: TallerOkUser; taller: TallerOkTaller } | null, accessToken?: string | null) => {
      if (session) {
        setUser(session.user);
        setTaller(session.taller);
        if (accessToken) {
          setToken(accessToken);
        }
        setSessionExpired(false);
      } else {
        clearSession();
      }
    },
    [clearSession],
  );

  const handleUnauthorized = useCallback(() => {
    clearSession();
    setSessionExpired(true);
  }, [clearSession]);

  useEffect(() => {
    setTallerOkUnauthorizedHandler(handleUnauthorized);
    return () => setTallerOkUnauthorizedHandler(null);
  }, [handleUnauthorized]);

  const refreshMe = useCallback(async () => {
    if (!env.isTallerOkApiConfigured) {
      applySession(null);
      return;
    }

    const storedToken = await getTallerOkToken();
    if (!storedToken) {
      applySession(null);
      return;
    }

    setToken(storedToken);

    try {
      const session = await tallerokAuthApi.me();
      applySession(session, storedToken);
    } catch {
      await tallerokAuthApi.logoutLocal();
      applySession(null);
    }
  }, [applySession]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!env.isTallerOkApiConfigured) {
          if (mounted) {
            applySession(null);
          }
          return;
        }

        const storedToken = await getTallerOkToken();
        if (!storedToken) {
          if (mounted) {
            applySession(null);
          }
          return;
        }

        if (mounted) {
          setToken(storedToken);
        }

        const session = await tallerokAuthApi.me();
        if (mounted) {
          applySession(session, storedToken);
        }
      } catch {
        await tallerokAuthApi.logoutLocal();
        if (mounted) {
          applySession(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [applySession]);

  const login = useCallback(
    async (payload: TallerOkLoginPayload) => {
      setAuthError(null);
      setSessionExpired(false);

      if (!env.isTallerOkApiConfigured) {
        setAuthError('Configurá EXPO_PUBLIC_TALLEROK_API_URL en el archivo .env');
        return;
      }

      try {
        const response = await tallerokAuthApi.login(payload);
        applySession({ user: response.user, taller: response.taller }, response.accessToken);
      } catch (error) {
        const message =
          error instanceof TallerOkApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'No se pudo iniciar sesión en TallerOK';
        setAuthError(message);
        throw error;
      }
    },
    [applySession],
  );

  const registerTaller = useCallback(
    async (payload: TallerOkRegisterTallerPayload) => {
      setAuthError(null);
      setSessionExpired(false);

      if (!env.isTallerOkApiConfigured) {
        setAuthError('Configurá EXPO_PUBLIC_TALLEROK_API_URL en el archivo .env');
        return;
      }

      try {
        const response = await tallerokAuthApi.registerTaller(payload);
        applySession({ user: response.user, taller: response.taller }, response.accessToken);
      } catch (error) {
        const message =
          error instanceof TallerOkApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'No se pudo registrar el taller';
        setAuthError(message);
        throw error;
      }
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    setAuthError(null);
    setSessionExpired(false);
    await tallerokAuthApi.logoutLocal();
    clearSession();
  }, [clearSession]);

  const clearAuthError = useCallback(() => setAuthError(null), []);
  const clearSessionExpired = useCallback(() => setSessionExpired(false), []);

  const value = useMemo<TallerOkAuthContextValue>(
    () => ({
      isTallerOkApiConfigured: env.isTallerOkApiConfigured,
      isAuthenticated: user != null && token != null,
      isLoading,
      user,
      taller,
      token,
      authError,
      sessionExpired,
      login,
      registerTaller,
      logout,
      refreshMe,
      clearAuthError,
      clearSessionExpired,
    }),
    [
      authError,
      clearAuthError,
      clearSessionExpired,
      isLoading,
      login,
      logout,
      refreshMe,
      registerTaller,
      sessionExpired,
      taller,
      token,
      user,
    ],
  );

  return <TallerOkAuthContext.Provider value={value}>{children}</TallerOkAuthContext.Provider>;
}

export function useTallerOkAuthContext(): TallerOkAuthContextValue {
  const context = useContext(TallerOkAuthContext);
  if (!context) {
    throw new Error('useTallerOkAuthContext debe usarse dentro de TallerOkAuthProvider');
  }
  return context;
}
