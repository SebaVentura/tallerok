import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { logSpeech } from '@/services/speechLogger';
import { shouldAcceptFinalTranscript } from '@/utils/speech/finalTranscriptDedup';
import { previewText } from '@/utils/speech/previewText';
import { loadSpeechRecognitionModule } from '@/utils/speech/loadSpeechRecognitionModule';
import {
  getFallbackLanguage,
  pickRecognitionLanguage,
  PRIMARY_SPEECH_LANG,
} from '@/utils/speech/resolveRecognitionLanguage';
import type {
  LoadedSpeechRecognitionModule,
  SpeechRecognitionErrorEvent,
  SpeechRecognitionNativeModule,
  SpeechRecognitionResultEvent,
} from '@/utils/speech/speechRecognitionTypes';
import {
  GENERIC_ERROR_MESSAGE,
  mapSpeechErrorToPresentation,
  PERMISSION_DENIED_MESSAGE,
  START_UNAVAILABLE_MESSAGE,
} from '@/utils/speech/speechErrors';

export type SpeechToTextState =
  | 'idle'
  | 'requesting-permission'
  | 'listening'
  | 'processing'
  | 'error';

export interface UseSpeechToTextOptions {
  onFinalTranscript: (text: string) => void;
  enabled?: boolean;
}

export interface UseSpeechToTextResult {
  state: SpeechToTextState;
  isListening: boolean;
  interimTranscript: string;
  errorMessage: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  cancelListening: () => void;
  /** null = aún no comprobado; false = no disponible; true = módulo cargado */
  isAvailable: boolean | null;
  showSettingsAction: boolean;
  canRetry: boolean;
  retry: () => void;
}

type ListenerSubscription = { remove: () => void };

export function useSpeechToText({
  onFinalTranscript,
  enabled = true,
}: UseSpeechToTextOptions): UseSpeechToTextResult {
  const [state, setState] = useState<SpeechToTextState>('idle');
  // Espejo siempre-actual del estado. Permite que callbacks estables
  // (cancelListening) lean el estado vigente sin depender de `state`, evitando
  // que cambien de identidad en cada transición (causa del `aborted` inmediato).
  const stateRef = useRef<SpeechToTextState>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSettingsAction, setShowSettingsAction] = useState(false);
  const [canRetry, setCanRetry] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const isMountedRef = useRef(true);
  const sessionActiveRef = useRef(false);
  const voluntaryCancelRef = useRef(false);
  const lastFinalTranscriptRef = useRef<string | null>(null);
  const currentLangRef = useRef(PRIMARY_SPEECH_LANG);
  const fallbackAttemptedRef = useRef(false);
  const startInFlightRef = useRef(false);
  // true solo mientras se espera la respuesta del diálogo de permiso (la
  // Activity de Android manda AppState a background; no es una salida real).
  const permissionRequestInFlightRef = useRef(false);
  // Identifica cada intento de inicio. Una cancelación real lo incrementa,
  // invalidando el `start()` pendiente que quedó atrás de un `await`.
  const startAttemptRef = useRef(0);
  const moduleRef = useRef<SpeechRecognitionNativeModule | null>(null);
  const loadPromiseRef = useRef<Promise<LoadedSpeechRecognitionModule | null> | null>(null);
  const listenerSubscriptionsRef = useRef<ListenerSubscription[]>([]);
  // [speech-audit] identificador por instancia — remover tras auditoría
  const instanceIdRef = useRef(
    `speech-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );

  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  // [speech-audit] montaje/desmontaje del hook — remover tras auditoría
  useEffect(() => {
    console.log('[speech-audit] hook mounted', {
      instanceId: instanceIdRef.current,
      timestamp: Date.now(),
    });
    console.log('[speech-audit] hook instance', instanceIdRef.current);

    return () => {
      console.log('[speech-audit] hook unmounted', {
        instanceId: instanceIdRef.current,
        timestamp: Date.now(),
      });
    };
  }, []);

  const safeSetState = useCallback((next: SpeechToTextState) => {
    // Único mecanismo de sincronización de la ref: se actualiza junto con el
    // estado visible, de modo que `stateRef.current` refleje siempre el último
    // estado solicitado antes de que cualquier callback estable lo consulte.
    stateRef.current = next;
    if (isMountedRef.current) {
      setState(next);
    }
  }, []);

  const safeSetInterim = useCallback((next: string) => {
    if (isMountedRef.current) {
      setInterimTranscript(next);
    }
  }, []);

  const safeSetError = useCallback(
    (message: string | null, options?: { showSettings?: boolean; canRetry?: boolean }) => {
      if (!isMountedRef.current) {
        return;
      }

      setErrorMessage(message);
      setShowSettingsAction(options?.showSettings ?? false);
      setCanRetry(options?.canRetry ?? false);
      if (message) {
        safeSetState('error');
      }
    },
    [safeSetState],
  );

  const removeListeners = useCallback(() => {
    for (const subscription of listenerSubscriptionsRef.current) {
      subscription.remove();
    }
    listenerSubscriptionsRef.current = [];
  }, []);

  const getNativeModule = useCallback((): SpeechRecognitionNativeModule | null => {
    return moduleRef.current;
  }, []);

  const beginRecognition = useCallback((nativeModule: SpeechRecognitionNativeModule, lang: string) => {
    currentLangRef.current = lang;
    // `continuous: true` no está soportado en Android 12 y anteriores y puede
    // iniciar el reconocedor sin entregar nunca un `result`. En Android usamos
    // modo por-frase (corre hasta el primer `isFinal`); el usuario vuelve a
    // tocar el micrófono para dictar otra frase y el texto se acumula.
    const continuous = Platform.OS === 'ios';
    const options = { lang, interimResults: true, continuous };
    // [speech-audit]
    console.log('[speech-audit] 04 calling start', {
      instanceId: instanceIdRef.current,
      timestamp: Date.now(),
      lang,
      continuous,
    });
    nativeModule.start(options);
    console.log('[speech-audit] 05 start returned', {
      instanceId: instanceIdRef.current,
      timestamp: Date.now(),
    });
    logSpeech('recognition started', { lang, continuous });
  }, []);

  const attachListeners = useCallback(
    (nativeModule: SpeechRecognitionNativeModule) => {
      removeListeners();

      const subscriptions: ListenerSubscription[] = [
        nativeModule.addListener('speechstart', () => {
          // [speech-audit]
          console.log('[speech-audit] EVENT speechstart', {
            instanceId: instanceIdRef.current,
            timestamp: Date.now(),
          });
        }),
        nativeModule.addListener('audiostart', () => {
          // [speech-audit]
          console.log('[speech-audit] EVENT audiostart', {
            instanceId: instanceIdRef.current,
            timestamp: Date.now(),
          });
        }),
        nativeModule.addListener('audioend', () => {
          // [speech-audit]
          console.log('[speech-audit] EVENT audioend', {
            instanceId: instanceIdRef.current,
            timestamp: Date.now(),
          });
        }),
        nativeModule.addListener('nomatch', () => {
          // [speech-audit]
          console.log('[speech-audit] EVENT nomatch', {
            instanceId: instanceIdRef.current,
            timestamp: Date.now(),
          });
        }),
        nativeModule.addListener('start', () => {
          // [speech-audit]
          console.log('[speech-audit] EVENT start', {
            instanceId: instanceIdRef.current,
            timestamp: Date.now(),
          });
          sessionActiveRef.current = true;
          startInFlightRef.current = false;
          safeSetInterim('');
          safeSetState('listening');
        }),
        nativeModule.addListener('result', (event) => {
          const resultEvent = event as SpeechRecognitionResultEvent;
          const results = resultEvent.results ?? [];
          const firstTranscript = results[0]?.transcript ?? '';
          // [speech-audit]
          console.log('[speech-audit] EVENT result', {
            instanceId: instanceIdRef.current,
            timestamp: Date.now(),
            isFinal: resultEvent.isFinal ?? null,
            transcript: firstTranscript ? previewText(firstTranscript) : null,
          });

          if (!isMountedRef.current) {
            return;
          }

          const transcript = firstTranscript.trim();
          if (!transcript) {
            return;
          }

          if (resultEvent.isFinal) {
            if (shouldAcceptFinalTranscript(lastFinalTranscriptRef.current, transcript)) {
              lastFinalTranscriptRef.current = transcript;
              onFinalTranscriptRef.current(transcript);
            }
            safeSetInterim('');
            return;
          }

          safeSetInterim(transcript);
        }),
        nativeModule.addListener('end', () => {
          // [speech-audit]
          console.log('[speech-audit] EVENT end', {
            instanceId: instanceIdRef.current,
            timestamp: Date.now(),
          });
          sessionActiveRef.current = false;
          startInFlightRef.current = false;
          safeSetInterim('');
          safeSetState('idle');
          logSpeech('recognition ended');
        }),
        nativeModule.addListener('error', (event) => {
          const errorEvent = event as SpeechRecognitionErrorEvent;

          // Cancelación voluntaria: no es un fallo, no debe salir como error rojo.
          if (errorEvent.error === 'aborted' && voluntaryCancelRef.current) {
            console.log('[speech] recognition cancelled voluntarily');
            voluntaryCancelRef.current = false;
            sessionActiveRef.current = false;
            startInFlightRef.current = false;
            safeSetInterim('');
            safeSetState('idle');
            return;
          }

          // Error real (incluye un aborted inesperado con voluntaryCancel=false): visible.
          console.error('[speech] recognition error', {
            error: errorEvent.error,
            message: errorEvent.message,
            code: errorEvent.code,
          });

          if (!isMountedRef.current) {
            return;
          }

          if (errorEvent.error === 'language-not-supported' && !fallbackAttemptedRef.current) {
            const fallbackLang = getFallbackLanguage(currentLangRef.current);
            if (fallbackLang) {
              fallbackAttemptedRef.current = true;
              try {
                beginRecognition(nativeModule, fallbackLang);
                return;
              } catch {
                // continuar con manejo de error
              }
            }
          }

          sessionActiveRef.current = false;
          startInFlightRef.current = false;
          safeSetInterim('');

          const presentation = mapSpeechErrorToPresentation(errorEvent.error);
          if (presentation.silent) {
            safeSetState('idle');
            return;
          }

          logSpeech('recognition error', { code: errorEvent.error });
          safeSetError(presentation.message || GENERIC_ERROR_MESSAGE, {
            showSettings: presentation.showSettings,
            canRetry: presentation.canRetry,
          });
        }),
      ];

      listenerSubscriptionsRef.current = subscriptions;
    },
    [beginRecognition, removeListeners, safeSetError, safeSetInterim, safeSetState],
  );

  const ensureModuleLoaded = useCallback(async (): Promise<SpeechRecognitionNativeModule | null> => {
    if (moduleRef.current) {
      return moduleRef.current;
    }

    if (!loadPromiseRef.current) {
      loadPromiseRef.current = (async () => {
        const loaded = await loadSpeechRecognitionModule();
        if (!loaded.ok) {
          return null;
        }

        const nativeModule = loaded.module.ExpoSpeechRecognitionModule;
        moduleRef.current = nativeModule;
        attachListeners(nativeModule);
        return loaded.module;
      })();
    }

    const result = await loadPromiseRef.current;
    return result?.ExpoSpeechRecognitionModule ?? null;
  }, [attachListeners]);

  const markModuleUnavailable = useCallback(() => {
    setIsAvailable(false);
    safeSetError(START_UNAVAILABLE_MESSAGE, { canRetry: false });
    safeSetState('error');
  }, [safeSetError, safeSetState]);

  const resolveLanguage = useCallback(
    async (nativeModule: SpeechRecognitionNativeModule): Promise<string> => {
      try {
        const { locales } = await nativeModule.getSupportedLocales({
          androidRecognitionServicePackage: 'com.google.android.googlequicksearchbox',
        });
        return pickRecognitionLanguage(locales);
      } catch {
        return PRIMARY_SPEECH_LANG;
      }
    },
    [],
  );

  const startListening = useCallback(async () => {
    // [speech-audit]
    console.log('[speech-audit] 01 button pressed / startListening entered', {
      instanceId: instanceIdRef.current,
      timestamp: Date.now(),
      enabled,
      isAvailable,
      state,
      sessionActive: sessionActiveRef.current,
      startInFlight: startInFlightRef.current,
    });

    if (!enabled) {
      return;
    }

    if (isAvailable === false) {
      return;
    }

    if (sessionActiveRef.current || startInFlightRef.current) {
      console.log('[speech-audit] startListening blocked (session/in-flight)', {
        instanceId: instanceIdRef.current,
        timestamp: Date.now(),
      });
      return;
    }

    if (state === 'requesting-permission' || state === 'processing') {
      return;
    }

    startInFlightRef.current = true;
    const attemptId = ++startAttemptRef.current;
    setErrorMessage(null);
    setShowSettingsAction(false);
    setCanRetry(false);
    safeSetState('requesting-permission');
    logSpeech('permission requested');

    const isStale = (label: string): boolean => {
      if (attemptId !== startAttemptRef.current) {
        console.log('[speech-fix] stale start attempt ignored', { attemptId, label });
        return true;
      }
      return false;
    };

    try {
      const nativeModule = await ensureModuleLoaded();

      if (!isMountedRef.current || isStale('after-module-load')) {
        return;
      }

      if (!nativeModule) {
        markModuleUnavailable();
        return;
      }

      setIsAvailable(true);

      if (!nativeModule.isRecognitionAvailable()) {
        logSpeech('recognition unavailable');
        setIsAvailable(false);
        safeSetError(START_UNAVAILABLE_MESSAGE, { canRetry: false });
        return;
      }

      // Consultar el permiso actual y solo solicitarlo si aún no está concedido.
      let permission: {
        status?: string;
        granted: boolean;
        canAskAgain?: boolean;
      } | null = null;
      if (typeof nativeModule.getMicrophonePermissionsAsync === 'function') {
        permission = await nativeModule.getMicrophonePermissionsAsync();
      } else if (typeof nativeModule.getPermissionsAsync === 'function') {
        permission = await nativeModule.getPermissionsAsync();
      }

      console.log('[speech-fix] permission before', {
        status: permission?.status ?? 'api-unavailable',
        granted: permission?.granted ?? null,
        canAskAgain: permission?.canAskAgain ?? null,
      });

      if (!isMountedRef.current || isStale('after-permission-check')) {
        return;
      }

      if (permission?.granted === true) {
        console.log('[speech-fix] permission already granted — skipping request');
      } else {
        // Solicitar permiso: la Activity manda AppState a background; la ref
        // evita que ese cambio dispare una cancelación.
        permissionRequestInFlightRef.current = true;
        try {
          if (typeof nativeModule.requestMicrophonePermissionsAsync === 'function') {
            permission = await nativeModule.requestMicrophonePermissionsAsync();
          } else {
            permission = await nativeModule.requestPermissionsAsync();
          }
        } finally {
          permissionRequestInFlightRef.current = false;
        }

        console.log('[speech-fix] permission result', {
          status: permission.status ?? (permission.granted ? 'granted' : 'denied'),
          granted: permission.granted,
          canAskAgain: permission.canAskAgain,
        });
      }

      if (!isMountedRef.current || isStale('after-permission-request')) {
        return;
      }

      if (!permission?.granted) {
        logSpeech('recognition error', { reason: 'permission-denied' });
        safeSetError(PERMISSION_DENIED_MESSAGE, {
          showSettings: permission?.canAskAgain === false,
          canRetry: true,
        });
        return;
      }

      fallbackAttemptedRef.current = false;
      const lang = await resolveLanguage(nativeModule);

      if (!isMountedRef.current || isStale('after-resolve-language')) {
        return;
      }

      // No iniciar el micrófono si la app no está en primer plano (p. ej. la
      // solicitud de permiso terminó pero AppState aún no volvió a 'active').
      if (AppState.currentState !== 'active') {
        console.log('[speech-fix] start skipped because app is not active', {
          appState: AppState.currentState,
        });
        startInFlightRef.current = false;
        safeSetState('idle');
        return;
      }

      beginRecognition(nativeModule, lang);
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }

      console.error('[speech-audit] startListening catch', {
        instanceId: instanceIdRef.current,
        timestamp: Date.now(),
        name: err instanceof Error ? err.name : 'unknown',
      });
      logSpeech('recognition error', { reason: 'start-failed' });
      safeSetError(GENERIC_ERROR_MESSAGE, { canRetry: true });
    } finally {
      startInFlightRef.current = false;
    }
  }, [
    beginRecognition,
    enabled,
    ensureModuleLoaded,
    isAvailable,
    markModuleUnavailable,
    resolveLanguage,
    safeSetError,
    safeSetState,
    state,
  ]);

  const stopListening = useCallback(() => {
    if (!sessionActiveRef.current) {
      return;
    }

    // [speech-audit]
    console.log('[speech-audit] STOP CALLED', {
      source: 'useSpeechToText:stopListening',
      instanceId: instanceIdRef.current,
      timestamp: Date.now(),
      state,
    });
    safeSetState('processing');
    getNativeModule()?.stop();
  }, [getNativeModule, safeSetState, state]);

  const cancelListening = useCallback(() => {
    // Lee el estado vigente vía ref (no vía `state` cerrado), para que este
    // callback mantenga identidad estable mientras cambia el reconocimiento.
    const currentState = stateRef.current;

    if (
      !sessionActiveRef.current &&
      currentState !== 'requesting-permission' &&
      currentState !== 'processing'
    ) {
      // [speech-fix] no-op: no hay sesión activa ni estado transitorio → no abortamos
      console.log('[speech-fix] cancelListening no-op', {
        source: 'useSpeechToText:cancelListening',
        currentState,
        sessionActive: sessionActiveRef.current,
      });
      return;
    }

    voluntaryCancelRef.current = true;
    startInFlightRef.current = false;
    // Invalida cualquier `startListening` que haya quedado esperando tras un
    // await: al reanudar verá un attemptId obsoleto y no llamará a start().
    startAttemptRef.current += 1;
    safeSetInterim('');
    safeSetState('idle');
    // [speech-fix] abort called
    console.warn('[speech-fix] abort called', {
      source: 'useSpeechToText:cancelListening',
      currentState,
      sessionActive: sessionActiveRef.current,
      voluntaryCancel: voluntaryCancelRef.current,
    });
    getNativeModule()?.abort();
  }, [getNativeModule, safeSetInterim, safeSetState]);

  const retry = useCallback(() => {
    setErrorMessage(null);
    setShowSettingsAction(false);
    setCanRetry(false);
    safeSetState('idle');
    void startListening();
  }, [safeSetState, startListening]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      voluntaryCancelRef.current = true;
      sessionActiveRef.current = false;
      startInFlightRef.current = false;
      // [speech-audit]
      console.warn('[speech-audit] ABORT CALLED', {
        source: 'useSpeechToText:unmount-cleanup',
        instanceId: instanceIdRef.current,
        timestamp: Date.now(),
        isListening: false,
      });
      getNativeModule()?.abort();
      removeListeners();
    };
  }, [getNativeModule, removeListeners]);

  useEffect(() => {
    if (!enabled) {
      // [speech-audit]
      console.log('[speech-audit] enabled=false → cancelListening', {
        instanceId: instanceIdRef.current,
        timestamp: Date.now(),
      });
      cancelListening();
    }
  }, [cancelListening, enabled]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      console.log('[speech-fix] AppState changed', {
        nextState,
        permissionRequestInFlight: permissionRequestInFlightRef.current,
        state: stateRef.current,
        sessionActive: sessionActiveRef.current,
      });

      if (nextState === 'active') {
        return;
      }

      // La Activity del diálogo de permiso manda la app a background: no es una
      // salida real, no cancelar.
      if (permissionRequestInFlightRef.current) {
        console.log('[speech-fix] AppState ignored during permission request', { nextState });
        return;
      }

      // Cancelar solo si hay una sesión real (escuchando/procesando), no cuando
      // apenas estamos en 'requesting-permission' sin sesión activa.
      const hasRealSpeechSession =
        sessionActiveRef.current ||
        stateRef.current === 'listening' ||
        stateRef.current === 'processing';

      if (hasRealSpeechSession) {
        cancelListening();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [cancelListening]);

  // [speech-fix] verifica identidad estable de cancelListening. Con el fix, pasar
  // de idle→listening NO debe volver a imprimir esto (solo al montar).
  useEffect(() => {
    console.log('[speech-fix] cancelListening identity changed');
  }, [cancelListening]);

  const isListening = state === 'listening';

  return {
    state,
    isListening,
    interimTranscript,
    errorMessage,
    startListening,
    stopListening,
    cancelListening,
    isAvailable: enabled ? isAvailable : false,
    showSettingsAction,
    canRetry,
    retry,
  };
}
