import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TalleriaColors } from '@/constants/theme';
import type { UseSpeechToTextResult } from '@/hooks/useSpeechToText';
import { BUILD_UNAVAILABLE_MESSAGE } from '@/utils/speech/speechErrors';

type SpeechDictationControlProps = Omit<UseSpeechToTextResult, 'cancelListening'> & {
  disabled?: boolean;
  onToggle: () => void;
};

export function SpeechDictationControl({
  state,
  isListening,
  interimTranscript,
  errorMessage,
  isAvailable,
  showSettingsAction,
  canRetry,
  retry,
  disabled = false,
  onToggle,
}: SpeechDictationControlProps) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isListening) {
      pulse.stopAnimation();
      pulse.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [isListening, pulse]);

  const isRequestingPermission = state === 'requesting-permission';
  const isProcessing = state === 'processing';
  const isModuleUnavailable = isAvailable === false;
  const isControlDisabled =
    disabled || isModuleUnavailable || isRequestingPermission || isProcessing;

  const title = isListening
    ? 'Escuchando…'
    : isRequestingPermission
      ? 'Solicitando permiso…'
      : isProcessing
        ? 'Procesando voz…'
        : 'Dictar';

  const subtitle = isListening
    ? 'Tocá nuevamente para terminar'
    : isModuleUnavailable
      ? BUILD_UNAVAILABLE_MESSAGE
      : 'Dictá síntomas, ruidos y observaciones del vehículo';

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onToggle}
        disabled={isControlDisabled}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={isListening ? 'Detener dictado por voz' : 'Iniciar dictado por voz'}
        accessibilityState={{
          disabled: isRequestingPermission || isProcessing || disabled || isModuleUnavailable,
        }}
        style={({ pressed }) => [
          styles.button,
          isListening && styles.buttonListening,
          isModuleUnavailable && styles.buttonUnavailable,
          isControlDisabled && styles.buttonDisabled,
          pressed && !isControlDisabled && styles.buttonPressed,
        ]}>
        <Animated.View style={[styles.emojiWrap, isListening && { transform: [{ scale: pulse }] }]}>
          {isRequestingPermission || isProcessing ? (
            <ActivityIndicator color={TalleriaColors.accent} />
          ) : (
            <Text style={styles.emoji}>🎤</Text>
          )}
        </Animated.View>
        <Text style={[styles.title, isListening && styles.titleListening]}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Pressable>

      {isListening && interimTranscript ? (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Transcripción parcial</Text>
          <Text style={styles.previewText}>{interimTranscript}</Text>
        </View>
      ) : null}

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <View style={styles.errorActions}>
            {canRetry ? (
              <Pressable
                onPress={retry}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Reintentar dictado">
                <Text style={styles.errorAction}>Reintentar</Text>
              </Pressable>
            ) : null}
            {showSettingsAction ? (
              <Pressable
                onPress={() => void Linking.openSettings()}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Abrir configuración">
                <Text style={styles.errorAction}>Abrir configuración</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  button: {
    backgroundColor: `${TalleriaColors.accent}18`,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TalleriaColors.accent,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  buttonListening: {
    backgroundColor: `${TalleriaColors.accent}28`,
    borderColor: TalleriaColors.accent,
  },
  buttonUnavailable: {
    opacity: 0.65,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  emojiWrap: {
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: TalleriaColors.text,
  },
  titleListening: {
    color: TalleriaColors.accent,
  },
  subtitle: {
    fontSize: 13,
    color: TalleriaColors.textMuted,
    textAlign: 'center',
  },
  preview: {
    backgroundColor: TalleriaColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
    padding: 12,
    gap: 4,
  },
  previewLabel: {
    fontSize: 11,
    color: TalleriaColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  previewText: {
    fontSize: 15,
    color: TalleriaColors.text,
    lineHeight: 22,
  },
  errorBox: {
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: TalleriaColors.danger,
    lineHeight: 20,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 16,
  },
  errorAction: {
    fontSize: 14,
    fontWeight: '600',
    color: TalleriaColors.accent,
  },
});
