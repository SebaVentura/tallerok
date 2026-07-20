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
  const moduleRef = useRef<SpeechRecognitionNativeModule | null>(null);
  const loadPromiseRef = useRef<Promise<LoadedSpeechRecognitionModule | null> | null>(null);
  const listenerSubscriptionsRef = useRef<ListenerSubscription[]>([]);

  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  const safeSetState = useCallback((next: SpeechToTextState) => {
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
    console.log('[speech] native start called', options); // temporal
    nativeModule.start(options);
    logSpeech('recognition started', { lang, continuous });
  }, []);

  const attachListeners = useCallback(
    (nativeModule: SpeechRecognitionNativeModule) => {
      removeListeners();

      const subscriptions: ListenerSubscription[] = [
        // [speech][TEMP-AUDIT] listener de diagnóstico — remover tras auditoría
        nativeModule.addListener('speechstart', () => {
          console.log('[speech] native event: speechstart');
        }),
        // [speech][TEMP-AUDIT] listener de diagnóstico — remover tras auditoría
        nativeModule.addListener('audiostart', () => {
          console.log('[speech] native event: audiostart');
        }),
        // [speech][TEMP-AUDIT] listener de diagnóstico — remover tras auditoría
        nativeModule.addListener('nomatch', () => {
          console.log('[speech] native event: nomatch (sin coincidencia reconocida)');
        }),
        nativeModule.addListener('start', () => {
          console.log('[speech] recognition started'); // [TEMP-AUDIT]
          sessionActiveRef.current = true;
          startInFlightRef.current = false;
          safeSetInterim('');
          safeSetState('listening');
        }),
        nativeModule.addListener('result', (event) => {
          const resultEvent = event as SpeechRecognitionResultEvent;
          const results = resultEvent.results ?? [];
          const firstTranscript = results[0]?.transcript ?? '';
          // [speech] result-shape — evidencia acotada de la forma real del evento nativo
          console.log('[speech] result-shape', {
            results: results.length,
            alternatives: results.length,
            first: previewText(firstTranscript),
            isFinal: resultEvent.isFinal ?? null,
            keys: Object.keys(resultEvent).join(','),
            lang: currentLangRef.current,
            at: Date.now(),
          });

          if (!isMountedRef.current) {
            return;
          }

          const transcript = firstTranscript.trim();
          if (!transcript) {
            return;
          }

          if (resultEvent.isFinal) {
            console.log('[speech] final-extracted', {
              length: transcript.length,
              preview: previewText(transcript),
            });
            if (shouldAcceptFinalTranscript(lastFinalTranscriptRef.current, transcript)) {
              lastFinalTranscriptRef.current = transcript;
              onFinalTranscriptRef.current(transcript);
            }
            safeSetInterim('');
            return;
          }

          console.log('[speech] partial-extracted', {
            length: transcript.length,
            preview: previewText(transcript),
          });
          safeSetInterim(transcript);
        }),
        nativeModule.addListener('end', () => {
          console.log('[speech] recognition ended'); // [TEMP-AUDIT]
          sessionActiveRef.current = false;
          startInFlightRef.current = false;
          safeSetInterim('');
          safeSetState('idle');
          logSpeech('recognition ended');
        }),
        nativeModule.addListener('error', (event) => {
          const errorEvent = event as SpeechRecognitionErrorEvent;
          // [TEMP-AUDIT] evidencia de errores nativos (no incluye datos sensibles)
          console.error('[speech] recognition error', {
            error: errorEvent.error,
            message: errorEvent.message,
          });

          if (!isMountedRef.current) {
            return;
          }

          if (errorEvent.error === 'aborted' && voluntaryCancelRef.current) {
            voluntaryCancelRef.current = false;
            sessionActiveRef.current = false;
            startInFlightRef.current = false;
            safeSetInterim('');
            safeSetState('idle');
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
    if (!enabled) {
      return;
    }

    if (isAvailable === false) {
      return;
    }

    if (sessionActiveRef.current || startInFlightRef.current) {
      return;
    }

    if (state === 'requesting-permission' || state === 'processing') {
      return;
    }

    startInFlightRef.current = true;
    setErrorMessage(null);
    setShowSettingsAction(false);
    setCanRetry(false);
    safeSetState('requesting-permission');
    logSpeech('permission requested');

    try {
      const nativeModule = await ensureModuleLoaded();

      if (!isMountedRef.current) {
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

      const permission = await nativeModule.requestPermissionsAsync();
      // [TEMP-AUDIT] resultado de permiso (sin datos sensibles)
      console.log('[speech] permission result', {
        granted: permission.granted,
        canAskAgain: permission.canAskAgain,
      });

      if (!isMountedRef.current) {
        return;
      }

      if (!permission.granted) {
        logSpeech('recognition error', { reason: 'permission-denied' });
        safeSetError(PERMISSION_DENIED_MESSAGE, {
          showSettings: permission.canAskAgain === false,
          canRetry: true,
        });
        return;
      }

      fallbackAttemptedRef.current = false;
      const lang = await resolveLanguage(nativeModule);
      console.log('[speech] starting recognition', {
        lang,
        interimResults: true,
        continuous: Platform.OS === 'ios',
      }); // temporal
      beginRecognition(nativeModule, lang);
    } catch {
      if (!isMountedRef.current) {
        return;
      }

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

    safeSetState('processing');
    getNativeModule()?.stop();
  }, [getNativeModule, safeSetState]);

  const cancelListening = useCallback(() => {
    if (
      !sessionActiveRef.current &&
      state !== 'requesting-permission' &&
      state !== 'processing'
    ) {
      return;
    }

    voluntaryCancelRef.current = true;
    startInFlightRef.current = false;
    safeSetInterim('');
    safeSetState('idle');
    getNativeModule()?.abort();
  }, [getNativeModule, safeSetInterim, safeSetState, state]);

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
      getNativeModule()?.abort();
      removeListeners();
    };
  }, [getNativeModule, removeListeners]);

  useEffect(() => {
    if (!enabled) {
      cancelListening();
    }
  }, [cancelListening, enabled]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState !== 'active') {
        cancelListening();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
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
