import { env } from '@/config/env';

function getTranscribeApiUrl(): string {
  if (!env.transcribeApiUrl) {
    throw new Error(
      'EXPO_PUBLIC_TRANSCRIBE_API_URL no está configurada. Ver backend/README.md y .env.example.',
    );
  }
  return `${env.transcribeApiUrl}/transcribe`;
}

export type TranscriptionResult = {
  text: string;
  language: string;
  model: string;
};

function getAudioFileMeta(uri: string) {
  const ext = uri.split('.').pop()?.toLowerCase();

  if (ext === 'mp4' || ext === 'm4a') {
    return { type: 'audio/mp4', name: 'recording.m4a' };
  }
  if (ext === 'caf') {
    return { type: 'audio/x-caf', name: 'recording.caf' };
  }
  if (ext === '3gp') {
    return { type: 'audio/3gpp', name: 'recording.3gp' };
  }
  if (ext === 'wav') {
    return { type: 'audio/wav', name: 'recording.wav' };
  }

  return { type: 'audio/m4a', name: 'recording.m4a' };
}

export async function transcribeAudio(audioUri: string): Promise<TranscriptionResult> {
  const { type, name } = getAudioFileMeta(audioUri);

  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    type,
    name,
  } as unknown as Blob);

  const response = await fetch(getTranscribeApiUrl(), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const errorBody = (await response.json()) as { detail?: string };
      if (errorBody.detail) {
        detail = errorBody.detail;
      }
    } catch {
      // usar mensaje HTTP por defecto
    }
    throw new Error(detail);
  }

  const result = (await response.json()) as TranscriptionResult;

  if (!result.text?.trim()) {
    throw new Error('La transcripción llegó vacía');
  }

  return result;
}
