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
import { useAuthContext } from '@/context/AuthContext';
import * as tallerokAuthApi from '@/services/tallerok/tallerokAuthApi';
import {
  clearDemoModeChosen,
  getDemoModeChosen,
  saveDemoModeChosen,
} from '@/services/tallerok/tallerokDemoStorage';
import {
  getTallerOkApiLogSummary,
  subscribeTallerOkApiLog,
  type TallerOkApiLogSummary,
} from '@/services/tallerok/tallerokApiLogger';
import { setTallerOkUnauthorizedHandler, TallerOkApiError } from '@/services/tallerok/tallerokClient';
import { getTallerOkToken } from '@/services/tallerok/tallerokTokenStorage';
import type {
  TallerOkLoginPayload,
  TallerOkRegisterTallerPayload,
  TallerOkTaller,
  TallerOkUser,
} from '@/types/tallerokApi';

export type TallerOkConnectionMode = 'demo' | 'tallerok_connected' | 'crabb_connected';

type TallerOkAuthContextValue = {
  isTallerOkApiConfigured: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  user: TallerOkUser | null;
  taller: TallerOkTaller | null;
  token: string | null;
  connectionMode: TallerOkConnectionMode;
  authError: string | null;
  lastApiError: string | null;
  lastApiStatus: number | null;
  lastApiCheckAt: string | null;
  sessionExpired: boolean;
  login: (payload: TallerOkLoginPayload) => Promise<void>;
  registerTaller: (payload: TallerOkRegisterTallerPayload) => Promise<void>;
  logout: () => Promise<void>;
  continueAsDemo: () => Promise<void>;
  refreshMe: () => Promise<void>;
  clearAuthError: () => void;
  clearSessionExpired: () => void;
};

const TallerOkAuthContext = createContext<TallerOkAuthContextValue | null>(null);

function resolveConnectionMode(
  isTallerOkAuth: boolean,
  crabbMode: 'loading' | 'crabb_connected' | 'demo',
  isDemoMode: boolean,
): TallerOkConnectionMode {
  if (isTallerOkAuth) return 'tallerok_connected';
  if (crabbMode === 'crabb_connected') return 'crabb_connected';
  if (isDemoMode) return 'demo';
  return 'demo';
}

export function TallerOkAuthProvider({ children }: { children: ReactNode }) {
  const { connectionMode: crabbMode } = useAuthContext();

  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [user, setUser] = useState<TallerOkUser | null>(null);
  const [taller, setTaller] = useState<TallerOkTaller | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [apiLogSummary, setApiLogSummary] = useState<TallerOkApiLogSummary>(() =>
    getTallerOkApiLogSummary(),
  );

  useEffect(() => subscribeTallerOkApiLog(setApiLogSummary), []);

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

  const exitDemoMode = useCallback(async () => {
    await clearDemoModeChosen();
    setIsDemoMode(false);
  }, []);

  const handleUnauthorized = useCallback(() => {
    clearSession();
    setSessionExpired(true);
    setAuthError('Tu sesión TallerOK expiró. Volvé a iniciar sesión.');
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
        const demoChosen = await getDemoModeChosen();
        if (mounted) {
          setIsDemoMode(demoChosen);
        }

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
          if (session) {
            setIsDemoMode(false);
            await clearDemoModeChosen();
          }
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
        await exitDemoMode();
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
    [applySession, exitDemoMode],
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
        await exitDemoMode();
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
    [applySession, exitDemoMode],
  );

  const continueAsDemo = useCallback(async () => {
    setAuthError(null);
    setSessionExpired(false);
    await saveDemoModeChosen(true);
    setIsDemoMode(true);
  }, []);

  const logout = useCallback(async () => {
    setAuthError(null);
    setSessionExpired(false);
    await tallerokAuthApi.logoutLocal();
    await exitDemoMode();
    clearSession();
  }, [clearSession, exitDemoMode]);

  const clearAuthError = useCallback(() => setAuthError(null), []);
  const clearSessionExpired = useCallback(() => setSessionExpired(false), []);

  const isAuthenticated = user != null && token != null;

  const value = useMemo<TallerOkAuthContextValue>(
    () => ({
      isTallerOkApiConfigured: env.isTallerOkApiConfigured,
      isAuthenticated,
      isLoading,
      isDemoMode,
      user,
      taller,
      token,
      connectionMode: resolveConnectionMode(isAuthenticated, crabbMode, isDemoMode),
      authError,
      lastApiError: apiLogSummary.lastError,
      lastApiStatus: apiLogSummary.lastStatus,
      lastApiCheckAt: apiLogSummary.lastCheckAt,
      sessionExpired,
      login,
      registerTaller,
      logout,
      continueAsDemo,
      refreshMe,
      clearAuthError,
      clearSessionExpired,
    }),
    [
      apiLogSummary.lastCheckAt,
      apiLogSummary.lastError,
      apiLogSummary.lastStatus,
      authError,
      clearAuthError,
      clearSessionExpired,
      continueAsDemo,
      crabbMode,
      isAuthenticated,
      isDemoMode,
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
