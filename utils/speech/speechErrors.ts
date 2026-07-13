import type { SpeechRecognitionErrorCode } from '@/utils/speech/speechRecognitionTypes';

export type SpeechErrorPresentation = {
  message: string;
  showSettings: boolean;
  canRetry: boolean;
  silent: boolean;
};

export function mapSpeechErrorToPresentation(
  code: SpeechRecognitionErrorCode,
): SpeechErrorPresentation {  switch (code) {
    case 'aborted':
    case 'interrupted':
      return { message: '', showSettings: false, canRetry: false, silent: true };
    case 'not-allowed':
      return {
        message:
          'TallerOK necesita permiso para usar el micrófono. Podés habilitarlo desde la configuración del teléfono.',
        showSettings: true,
        canRetry: true,
        silent: false,
      };
    case 'service-not-allowed':
      return {
        message: 'El reconocimiento de voz no está disponible en este dispositivo.',
        showSettings: false,
        canRetry: false,
        silent: false,
      };
    case 'no-speech':
    case 'speech-timeout':
      return {
        message: 'No detectamos voz. Intentá hablar más cerca del micrófono.',
        showSettings: false,
        canRetry: true,
        silent: false,
      };
    case 'network':
      return {
        message: 'Hubo un problema de conexión al procesar la voz.',
        showSettings: false,
        canRetry: true,
        silent: false,
      };
    case 'busy':
      return {
        message: 'El reconocimiento de voz está ocupado. Intentá nuevamente en unos segundos.',
        showSettings: false,
        canRetry: true,
        silent: false,
      };
    case 'language-not-supported':
      return {
        message: 'El idioma seleccionado no está disponible en este dispositivo.',
        showSettings: false,
        canRetry: true,
        silent: false,
      };
    default:
      return {
        message: 'No pudimos iniciar el dictado.',
        showSettings: false,
        canRetry: true,
        silent: false,
      };
  }
}

export const PERMISSION_DENIED_MESSAGE =
  'TallerOK necesita permiso para usar el micrófono. Podés habilitarlo desde la configuración del teléfono.';

export const UNAVAILABLE_MESSAGE =
  'El reconocimiento de voz no está disponible en este dispositivo.';

export const BUILD_UNAVAILABLE_MESSAGE =
  'El dictado por voz no está disponible en esta build. Generá e instalá una APK nueva para probarlo.';

export const START_UNAVAILABLE_MESSAGE =
  'El reconocimiento de voz no está disponible en esta build. Instalá una APK o development build generada después de agregar el módulo nativo.';

export const GENERIC_ERROR_MESSAGE = 'No pudimos iniciar el dictado.';
