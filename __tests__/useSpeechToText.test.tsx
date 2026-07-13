import React, { useEffect } from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { useSpeechToText, type UseSpeechToTextResult } from '@/hooks/useSpeechToText';

const mockAbort = jest.fn();
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockIsRecognitionAvailable = jest.fn();
const mockGetSupportedLocales = jest.fn();
const mockLoadSpeechRecognitionModule = jest.fn();

const eventHandlers: Record<string, Array<(event?: unknown) => void>> = {};

function createNativeModuleMock() {
  return {
    abort: (...args: unknown[]) => mockAbort(...args),
    start: (...args: unknown[]) => mockStart(...args),
    stop: (...args: unknown[]) => mockStop(...args),
    requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissionsAsync(...args),
    isRecognitionAvailable: (...args: unknown[]) => mockIsRecognitionAvailable(...args),
    getSupportedLocales: (...args: unknown[]) => mockGetSupportedLocales(...args),
    addListener: (event: string, handler: (payload?: unknown) => void) => {
      eventHandlers[event] = eventHandlers[event] ?? [];
      eventHandlers[event].push(handler);
      return { remove: jest.fn() };
    },
  };
}

jest.mock('@/utils/speech/loadSpeechRecognitionModule', () => ({
  loadSpeechRecognitionModule: (...args: unknown[]) => mockLoadSpeechRecognitionModule(...args),
}));

function emit(event: string, payload?: unknown) {
  for (const handler of eventHandlers[event] ?? []) {
    handler(payload);
  }
}

function HookProbe({
  onReady,
  onFinalTranscript,
}: {
  onReady: (speech: UseSpeechToTextResult) => void;
  onFinalTranscript: (text: string) => void;
}) {
  const speech = useSpeechToText({ onFinalTranscript });

  useEffect(() => {
    onReady(speech);
  }, [onReady, speech]);

  return null;
}

describe('useSpeechToText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(eventHandlers).forEach((key) => {
      delete eventHandlers[key];
    });

    mockLoadSpeechRecognitionModule.mockResolvedValue({
      ok: true,
      module: {
        ExpoSpeechRecognitionModule: createNativeModuleMock(),
      },
    });
    mockIsRecognitionAvailable.mockReturnValue(true);
    mockRequestPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    });
    mockGetSupportedLocales.mockResolvedValue({ locales: ['es-AR'], installedLocales: [] });
  });

  it('monta sin cargar el módulo nativo', () => {
    let speechRef: UseSpeechToTextResult | null = null;

    act(() => {
      TestRenderer.create(
        <HookProbe
          onFinalTranscript={jest.fn()}
          onReady={(speech) => {
            speechRef = speech;
          }}
        />,
      );
    });

    expect(mockLoadSpeechRecognitionModule).not.toHaveBeenCalled();
    expect(speechRef!.isAvailable).toBeNull();
  });

  it('maneja permiso rechazado sin iniciar reconocimiento', async () => {
    mockRequestPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: true,
    });

    let speechRef: UseSpeechToTextResult | null = null;

    act(() => {
      TestRenderer.create(
        <HookProbe
          onFinalTranscript={jest.fn()}
          onReady={(speech) => {
            speechRef = speech;
          }}
        />,
      );
    });

    await act(async () => {
      await speechRef!.startListening();
    });

    expect(mockStart).not.toHaveBeenCalled();
    expect(speechRef!.state).toBe('error');
    expect(speechRef!.errorMessage).toContain('permiso');
  });

  it('inicia reconocimiento cuando el permiso fue concedido', async () => {
    let speechRef: UseSpeechToTextResult | null = null;

    act(() => {
      TestRenderer.create(
        <HookProbe
          onFinalTranscript={jest.fn()}
          onReady={(speech) => {
            speechRef = speech;
          }}
        />,
      );
    });

    await act(async () => {
      await speechRef!.startListening();
    });

    expect(mockLoadSpeechRecognitionModule).toHaveBeenCalled();
    expect(mockStart).toHaveBeenCalledWith({
      lang: 'es-AR',
      interimResults: true,
      continuous: true,
    });
  });

  it('entrega transcripciones finales y evita duplicados', async () => {
    const onFinalTranscript = jest.fn();
    let speechRef: UseSpeechToTextResult | null = null;

    act(() => {
      TestRenderer.create(
        <HookProbe
          onFinalTranscript={onFinalTranscript}
          onReady={(speech) => {
            speechRef = speech;
          }}
        />,
      );
    });

    await act(async () => {
      await speechRef!.startListening();
    });

    act(() => {
      emit('result', {
        isFinal: true,
        results: [{ transcript: 'ruido al frenar' }],
      });
      emit('result', {
        isFinal: true,
        results: [{ transcript: 'ruido al frenar' }],
      });
    });

    expect(onFinalTranscript).toHaveBeenCalledTimes(1);
    expect(onFinalTranscript).toHaveBeenCalledWith('ruido al frenar');
  });

  it('marca reconocimiento no disponible cuando falla la carga del módulo', async () => {
    mockLoadSpeechRecognitionModule.mockResolvedValue({
      ok: false,
      error: new Error("Cannot find native module 'ExpoSpeechRecognition'"),
    });

    let speechRef: UseSpeechToTextResult | null = null;

    act(() => {
      TestRenderer.create(
        <HookProbe
          onFinalTranscript={jest.fn()}
          onReady={(speech) => {
            speechRef = speech;
          }}
        />,
      );
    });

    await act(async () => {
      await speechRef!.startListening();
    });

    expect(speechRef!.isAvailable).toBe(false);
    expect(speechRef!.errorMessage).toContain('no está disponible en esta build');
  });

  it('aborta al desmontar la pantalla si el módulo fue cargado', async () => {
    let speechRef: UseSpeechToTextResult | null = null;
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    act(() => {
      renderer = TestRenderer.create(
        <HookProbe
          onFinalTranscript={jest.fn()}
          onReady={(speech) => {
            speechRef = speech;
          }}
        />,
      );
    });

    await act(async () => {
      await speechRef!.startListening();
    });

    act(() => {
      renderer!.unmount();
    });

    expect(mockAbort).toHaveBeenCalled();
  });
});
