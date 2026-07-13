import { logSpeech } from '@/services/speechLogger';

import type { LoadedSpeechRecognitionModule } from '@/utils/speech/speechRecognitionTypes';

export type SpeechRecognitionLoadResult =
  | { ok: true; module: LoadedSpeechRecognitionModule }
  | { ok: false; error: unknown };

export async function loadSpeechRecognitionModule(): Promise<SpeechRecognitionLoadResult> {
  try {
    const mod = (await import('expo-speech-recognition')) as LoadedSpeechRecognitionModule;
    return { ok: true, module: mod };
  } catch (error) {
    logSpeech('recognition unavailable');
    return { ok: false, error };
  }
}
