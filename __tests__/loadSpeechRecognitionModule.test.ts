import { loadSpeechRecognitionModule } from '@/utils/speech/loadSpeechRecognitionModule';

describe('loadSpeechRecognitionModule', () => {
  it('devuelve estado no disponible si el import falla', async () => {
    const result = await loadSpeechRecognitionModule();

    expect(result.ok).toBe(false);
  });
});
