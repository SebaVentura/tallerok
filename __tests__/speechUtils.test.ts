import { appendTranscript } from '@/utils/speech/appendTranscript';
import { shouldAcceptFinalTranscript } from '@/utils/speech/finalTranscriptDedup';
import { previewText } from '@/utils/speech/previewText';
import {
  getFallbackLanguage,
  pickRecognitionLanguage,
} from '@/utils/speech/resolveRecognitionLanguage';
import { mapSpeechErrorToPresentation } from '@/utils/speech/speechErrors';

describe('appendTranscript', () => {
  it('concatena texto existente y transcripción', () => {
    expect(appendTranscript('Ruido al frenar', 'pérdida de potencia')).toBe(
      'Ruido al frenar pérdida de potencia',
    );
  });

  it('devuelve el texto actual cuando la transcripción está vacía', () => {
    expect(appendTranscript('Texto previo', '   ')).toBe('Texto previo');
  });

  it('elimina espacios duplicados en los extremos', () => {
    expect(appendTranscript('  Texto previo  ', '  nueva frase  ')).toBe(
      'Texto previo nueva frase',
    );
  });

  it('reemplaza el campo vacío con la transcripción', () => {
    expect(appendTranscript('', 'diagnóstico inicial')).toBe('diagnóstico inicial');
  });

  it('acumula un nuevo final sobre el diagnóstico previo (Caso A/B)', () => {
    expect(
      appendTranscript('ruido en el tren delantero', 'al doblar hacia la izquierda'),
    ).toBe('ruido en el tren delantero al doblar hacia la izquierda');
  });

  it('conserva una edición manual y agrega el dictado posterior', () => {
    const editadoManual = 'ruido en el tren delantero principalmente del lado izquierdo';
    expect(appendTranscript(editadoManual, 'cuando circula por calles irregulares')).toBe(
      'ruido en el tren delantero principalmente del lado izquierdo cuando circula por calles irregulares',
    );
  });
});

describe('shouldAcceptFinalTranscript', () => {
  it('evita resultados finales duplicados', () => {
    expect(shouldAcceptFinalTranscript('mismo texto', 'mismo texto')).toBe(false);
  });

  it('acepta una transcripción final nueva', () => {
    expect(shouldAcceptFinalTranscript('texto previo', 'texto nuevo')).toBe(true);
  });

  it('no duplica cuando el final repite el último aceptado (Caso repetido)', () => {
    const base = 'ruido en el tren delantero';
    expect(shouldAcceptFinalTranscript(base, base)).toBe(false);
  });

  it('acepta el primer final cuando no hay uno previo', () => {
    expect(shouldAcceptFinalTranscript(null, 'ruido en el motor')).toBe(true);
  });
});

describe('previewText', () => {
  it('devuelve el texto colapsando espacios cuando es corto', () => {
    expect(previewText('  ruido   en el   motor ')).toBe('ruido en el motor');
  });

  it('trunca a 80 caracteres con elipsis', () => {
    const largo = 'a'.repeat(200);
    const result = previewText(largo);
    expect(result.length).toBe(81);
    expect(result.endsWith('…')).toBe(true);
  });

  it('respeta un máximo personalizado', () => {
    expect(previewText('ruido en el motor', 5)).toBe('ruido…');
  });
});

describe('resolveRecognitionLanguage', () => {
  it('prioriza es-AR cuando está disponible', () => {
    expect(pickRecognitionLanguage(['es-ES', 'es-AR', 'en-US'])).toBe('es-AR');
  });

  it('usa es-ES como fallback cuando es-AR no está disponible', () => {
    expect(pickRecognitionLanguage(['es-ES', 'en-US'])).toBe('es-ES');
  });

  it('expone el idioma de fallback para es-AR', () => {
    expect(getFallbackLanguage('es-AR')).toBe('es-ES');
  });
});

describe('mapSpeechErrorToPresentation', () => {
  it('marca permiso rechazado con acción de configuración', () => {
    const result = mapSpeechErrorToPresentation('not-allowed');
    expect(result.message).toContain('permiso');
    expect(result.showSettings).toBe(true);
    expect(result.silent).toBe(false);
  });

  it('marca reconocimiento no disponible', () => {
    const result = mapSpeechErrorToPresentation('service-not-allowed');
    expect(result.message).toContain('no está disponible');
    expect(result.canRetry).toBe(false);
  });

  it('ignora cancelaciones voluntarias', () => {
    const result = mapSpeechErrorToPresentation('aborted');
    expect(result.silent).toBe(true);
  });
});
