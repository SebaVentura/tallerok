export const PRIMARY_SPEECH_LANG = 'es-AR';
export const FALLBACK_SPEECH_LANG = 'es-ES';

export function pickRecognitionLanguage(supportedLocales: string[]): string {
  if (supportedLocales.length === 0) {
    return PRIMARY_SPEECH_LANG;
  }

  if (supportedLocales.includes(PRIMARY_SPEECH_LANG)) {
    return PRIMARY_SPEECH_LANG;
  }

  if (supportedLocales.includes(FALLBACK_SPEECH_LANG)) {
    return FALLBACK_SPEECH_LANG;
  }

  return PRIMARY_SPEECH_LANG;
}

export function getFallbackLanguage(currentLang: string): string | null {
  if (currentLang === PRIMARY_SPEECH_LANG) {
    return FALLBACK_SPEECH_LANG;
  }

  return null;
}
