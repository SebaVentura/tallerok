import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '@/components/talleria/Card';
import { FlowNavBar } from '@/components/talleria/FlowNavBar';
import { PrimaryButton } from '@/components/talleria/PrimaryButton';
import { Screen } from '@/components/talleria/Screen';
import { TalleriaColors } from '@/constants/theme';
import { setDiagnosticoSesion } from '@/data/demoSession';
import { transcribeAudio } from '@/services/transcription';
import {
  getDiagnosticoByVehiculo,
  getEvidenciasByDiagnostico,
  getOrdenByVehiculo,
  getVehiculo,
} from '@/data/mock';

const EVIDENCE_COLORS = {
  foto: ['#1e3a5f', '#2d4a6f'],
  video: ['#3d2a5c', '#4a3568'],
};

type RealPhoto = {
  id: string;
  uri: string;
};

function ActionButton({
  emoji,
  title,
  subtitle,
  accent,
  disabled,
  recording,
  onPress,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  accent?: boolean;
  disabled?: boolean;
  recording?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionBtn,
        accent && styles.actionBtnAccent,
        recording && styles.actionBtnRecording,
        disabled && styles.actionBtnDisabled,
        pressed && !disabled && styles.actionBtnPressed,
      ]}>
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <Text style={[styles.actionTitle, accent && styles.actionTitleAccent]}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

function SourceBadge({ label, variant }: { label: string; variant: 'real' | 'mock' | 'audio' }) {
  const colors = {
    real: { bg: `${TalleriaColors.success}33`, text: TalleriaColors.success },
    mock: { bg: `${TalleriaColors.textMuted}33`, text: TalleriaColors.textMuted },
    audio: { bg: `${TalleriaColors.accent}33`, text: TalleriaColors.accent },
  };
  const c = colors[variant];

  return (
    <View style={[styles.sourceBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.sourceBadgeText, { color: c.text }]}>{label}</Text>
    </View>
  );
}

function MockEvidenceCard({ tipo, descripcion }: { tipo: 'foto' | 'video'; descripcion: string }) {
  const colors = EVIDENCE_COLORS[tipo];

  return (
    <Card>
      <View style={styles.evidenceCard}>
        <View style={[styles.evidenceThumb, { backgroundColor: colors[0] }]}>
          <View style={[styles.evidenceThumbInner, { backgroundColor: colors[1] }]}>
            <Text style={styles.evidenceThumbIcon}>{tipo === 'foto' ? '📷' : '🎬'}</Text>
          </View>
          <View style={styles.evidenceTypeBadge}>
            <Text style={styles.evidenceTypeText}>{tipo === 'foto' ? 'FOTO' : 'VIDEO'}</Text>
          </View>
        </View>
        <View style={styles.evidenceInfo}>
          <View style={styles.evidenceHeader}>
            <Text style={styles.evidenceName}>{descripcion}</Text>
            <SourceBadge label="MOCK" variant="mock" />
          </View>
          <Text style={styles.evidenceTipo}>
            {tipo === 'foto' ? 'Imagen de referencia' : 'Clip de referencia'}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function RealPhotoCard({ uri, index }: { uri: string; index: number }) {
  return (
    <Card>
      <View style={styles.evidenceCard}>
        <View style={styles.evidenceThumb}>
          <Image source={{ uri }} style={styles.realImage} contentFit="cover" />
          <View style={styles.evidenceTypeBadge}>
            <Text style={styles.evidenceTypeText}>FOTO</Text>
          </View>
        </View>
        <View style={styles.evidenceInfo}>
          <View style={styles.evidenceHeader}>
            <Text style={styles.evidenceName}>Foto diagnóstico #{index + 1}</Text>
            <SourceBadge label="REAL" variant="real" />
          </View>
          <Text style={styles.evidenceTipo}>Capturada en este diagnóstico</Text>
        </View>
      </View>
    </Card>
  );
}

function RealAudioCard({ durationSec }: { durationSec: number }) {
  return (
    <Card>
      <View style={styles.audioEvidence}>
        <View style={styles.audioIconWrap}>
          <Text style={styles.audioIcon}>🎤</Text>
        </View>
        <View style={styles.evidenceInfo}>
          <View style={styles.evidenceHeader}>
            <Text style={styles.evidenceName}>Audio del diagnóstico</Text>
            <SourceBadge label="AUDIO REAL" variant="audio" />
          </View>
          <Text style={styles.evidenceTipo}>Duración: {durationSec}s · Grabado localmente</Text>
          <View style={styles.miniWaveform}>
            {Array.from({ length: 16 }).map((_, i) => (
              <View key={i} style={[styles.miniBar, { height: 8 + (i % 4) * 5 }]} />
            ))}
          </View>
        </View>
      </View>
    </Card>
  );
}

export default function DiagnosticoScreen() {
  const { vehiculoId } = useLocalSearchParams<{ vehiculoId: string }>();
  const router = useRouter();
  const vehiculo = getVehiculo(vehiculoId ?? '');
  const diagnostico = vehiculo ? getDiagnosticoByVehiculo(vehiculo.id) : undefined;
  const evidenciasList = diagnostico ? getEvidenciasByDiagnostico(diagnostico.id) : [];
  const orden = vehiculo ? getOrdenByVehiculo(vehiculo.id) : undefined;

  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioDurationSec, setAudioDurationSec] = useState(0);
  const [iaVisible, setIaVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [realPhotos, setRealPhotos] = useState<RealPhoto[]>([]);
  const [textoDiagnostico, setTextoDiagnostico] = useState(diagnostico?.resumenIA ?? '');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasLocalTranscription, setHasLocalTranscription] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearDurationTimer = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  const unloadSound = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      clearDurationTimer();
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, [clearDurationTimer]);

  const startDurationTimer = useCallback(
    (recording: Audio.Recording) => {
      clearDurationTimer();
      durationTimerRef.current = setInterval(async () => {
        const status = await recording.getStatusAsync();
        if (status.isRecording && status.durationMillis != null) {
          setAudioDurationSec(Math.floor(status.durationMillis / 1000));
        }
      }, 500);
    },
    [clearDurationTimer],
  );

  const handleStartRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permiso de micrófono',
          'Necesitamos acceso al micrófono para grabar el diagnóstico. Activá el permiso en Ajustes.',
        );
        return;
      }

      await unloadSound();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setAudioDurationSec(0);
      startDurationTimer(recording);
    } catch {
      Alert.alert('Error de grabación', 'No se pudo iniciar la grabación. Intentá de nuevo.');
    }
  };

  const handleStopRecording = async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    try {
      clearDurationTimer();
      const statusBeforeStop = await recording.getStatusAsync();
      const duration =
        statusBeforeStop.durationMillis != null
          ? Math.max(1, Math.floor(statusBeforeStop.durationMillis / 1000))
          : audioDurationSec;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      recordingRef.current = null;
      setIsRecording(false);

      if (uri) {
        setAudioUri(uri);
        setAudioDurationSec(duration);
        setIaVisible(true);
        setHasLocalTranscription(false);
        setIsTranscribing(true);

        try {
          const result = await transcribeAudio(uri);
          setTextoDiagnostico(result.text);
          setHasLocalTranscription(true);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'No se pudo conectar con el backend local.';
          Alert.alert(
            'Transcripción no disponible',
            `${message}\n\nVerificá que el backend esté corriendo y que la IP en services/transcription.ts sea correcta. Podés editar el diagnóstico manualmente.`,
          );
        } finally {
          setIsTranscribing(false);
        }
      }
    } catch {
      Alert.alert('Error de grabación', 'No se pudo guardar el audio.');
      setIsRecording(false);
      recordingRef.current = null;
    }
  };

  const handlePlayAudio = async () => {
    if (!audioUri) return;

    try {
      if (isPlaying && soundRef.current) {
        await soundRef.current.stopAsync();
        await unloadSound();
        return;
      }

      await unloadSound();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          unloadSound();
        }
      });
      setIsPlaying(true);
      await sound.playAsync();
    } catch {
      Alert.alert('Error de reproducción', 'No se pudo reproducir el audio grabado.');
      await unloadSound();
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permiso de cámara',
          'Necesitamos acceso a la cámara para tomar fotos de evidencia. Activá el permiso en Ajustes.',
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        setRealPhotos((prev) => [
          ...prev,
          { id: `photo-${Date.now()}`, uri: result.assets[0].uri },
        ]);
      }
    } catch {
      Alert.alert('Error de cámara', 'No se pudo abrir la cámara. Intentá de nuevo.');
    }
  };

  const handleCrearOrden = () => {
    if (!orden || !vehiculo || !diagnostico) return;

    const guardarYNavegar = () => {
      setDiagnosticoSesion({
        vehiculoId: vehiculo.id,
        ordenId: orden.id,
        textoDiagnostico,
        hallazgos: diagnostico.hallazgos,
        audioUri,
        audioDuracionSec: audioDurationSec ?? 0,
        fotos: realPhotos,
        tareas: [...orden.tareas],
        repuestos: orden.repuestos.map((r) => ({ ...r })),
        creadoEn: new Date().toISOString(),
      });
      router.push(`/(flow)/orden/${orden.id}` as const);
    };

    const faltantes: string[] = [];
    if (!audioUri) faltantes.push('un audio');
    if (realPhotos.length === 0) faltantes.push('al menos una foto');

    if (faltantes.length > 0) {
      Alert.alert(
        'Evidencias recomendadas',
        `Te recomendamos adjuntar ${faltantes.join(' y ')} para un diagnóstico más completo. Podés continuar igual.`,
        [
          { text: 'Volver', style: 'cancel' },
          { text: 'Continuar', onPress: guardarYNavegar },
        ],
      );
      return;
    }

    guardarYNavegar();
  };

  if (!vehiculo || !diagnostico) {
    return (
      <Screen title="Diagnóstico no disponible">
        <FlowNavBar />
        <PrimaryButton title="Volver" onPress={() => router.back()} />
      </Screen>
    );
  }

  const hasRealEvidence = audioUri != null || realPhotos.length > 0;
  const crearOrdenLabel = orden ? `Crear orden ${orden.numero}` : 'Crear orden';

  return (
    <>
      <Stack.Screen options={{ title: 'Diagnóstico IA' }} />
      <Screen subtitle={`Paso 1 · ${vehiculo.patente}`}>
        <FlowNavBar
          links={[
            {
              label: 'Volver a Vehículo',
              onPress: () => router.push(`/(flow)/vehiculo/${vehiculo.id}`),
            },
            {
              label: crearOrdenLabel,
              onPress: handleCrearOrden,
              disabled: !orden || isTranscribing,
            },
          ]}
        />
        <ActionButton
          emoji="🎤"
          title={isRecording ? 'Grabando...' : 'Grabar diagnóstico'}
          subtitle={
            isRecording
              ? `Duración: ${audioDurationSec}s`
              : audioUri
                ? `Audio guardado · ${audioDurationSec}s`
                : 'Audio para análisis IA'
          }
          accent
          recording={isRecording}
          onPress={isRecording ? undefined : handleStartRecording}
        />

        {isRecording ? (
          <PrimaryButton title="Detener grabación" onPress={handleStopRecording} />
        ) : null}

        {audioUri && !isRecording ? (
          <PrimaryButton
            title={isPlaying ? 'Detener reproducción' : 'Reproducir audio'}
            onPress={handlePlayAudio}
          />
        ) : null}

        <View style={styles.actionRow}>
          <View style={styles.actionHalf}>
            <ActionButton
              emoji="📷"
              title="Tomar foto"
              subtitle={`${realPhotos.length} foto${realPhotos.length !== 1 ? 's' : ''}`}
              onPress={handleTakePhoto}
              disabled={isRecording}
            />
          </View>
          <View style={styles.actionHalf}>
            <ActionButton
              emoji="🎥"
              title="Grabar video"
              subtitle="Próximamente"
              disabled
            />
          </View>
        </View>

        {isTranscribing ? (
          <Card>
            <View style={styles.transcribingRow}>
              <ActivityIndicator color={TalleriaColors.accent} />
              <Text style={styles.transcribingText}>Transcribiendo diagnóstico…</Text>
            </View>
          </Card>
        ) : null}

        {iaVisible ? (
          <View style={styles.premiumCard}>
            <View style={styles.premiumGlow} />
            <View style={styles.premiumHeader}>
              <Text style={styles.premiumBadge}>✨ IA</Text>
              <Text style={styles.premiumTitle}>Diagnóstico generado automáticamente</Text>
              {hasLocalTranscription ? (
                <View style={styles.localBadge}>
                  <Text style={styles.localBadgeText}>Transcripción local real</Text>
                </View>
              ) : null}
            </View>
            <TextInput
              style={styles.diagnosticoInput}
              value={textoDiagnostico}
              onChangeText={setTextoDiagnostico}
              multiline
              placeholder="Texto del diagnóstico..."
              placeholderTextColor={TalleriaColors.textMuted}
            />
            <View style={styles.waveform}>
              {Array.from({ length: 28 }).map((_, i) => (
                <View key={i} style={[styles.bar, { height: 10 + (i % 6) * 6 }]} />
              ))}
            </View>
            <Text style={styles.premiumMeta}>
              {hasLocalTranscription
                ? `Transcripción local · ${audioDurationSec}s · modelo base`
                : `Audio analizado · ${audioDurationSec || diagnostico.audioDuracionSeg}s · texto mock editable`}
            </Text>
          </View>
        ) : (
          <Card>
            <Text style={styles.label}>Diagnóstico (editable)</Text>
            <TextInput
              style={styles.diagnosticoInputPlain}
              value={textoDiagnostico}
              onChangeText={setTextoDiagnostico}
              multiline
              placeholder="Texto del diagnóstico..."
              placeholderTextColor={TalleriaColors.textMuted}
            />
            <Text style={styles.pendingIa}>
              Grabá un audio para transcribir localmente con faster-whisper.
            </Text>
          </Card>
        )}

        <Card>
          <Text style={styles.label}>Hallazgos detectados</Text>
          {iaVisible ? (
            diagnostico.hallazgos.map((h) => (
              <Text key={h} style={styles.bullet}>
                • {h}
              </Text>
            ))
          ) : (
            <Text style={styles.muted}>Disponibles tras grabar el audio.</Text>
          )}
        </Card>

        <Text style={styles.section}>Evidencias</Text>

        {hasRealEvidence ? (
          <>
            <Text style={styles.subsection}>Capturadas en este diagnóstico</Text>
            {audioUri ? <RealAudioCard durationSec={audioDurationSec} /> : null}
            {realPhotos.map((photo, index) => (
              <RealPhotoCard key={photo.id} uri={photo.uri} index={index} />
            ))}
          </>
        ) : null}

        <Text style={styles.subsection}>
          {hasRealEvidence ? 'Referencias de ejemplo' : 'Referencias (mock)'}
        </Text>
        {evidenciasList.map((ev) => (
          <MockEvidenceCard key={ev.id} tipo={ev.tipo} descripcion={ev.descripcion} />
        ))}

        {orden ? (
          <PrimaryButton
            title={`Crear orden ${orden.numero}`}
            onPress={handleCrearOrden}
            disabled={isTranscribing}
          />
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    backgroundColor: TalleriaColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  actionBtnAccent: {
    backgroundColor: `${TalleriaColors.accent}18`,
    borderColor: TalleriaColors.accent,
  },
  actionBtnRecording: {
    borderColor: TalleriaColors.danger,
    backgroundColor: `${TalleriaColors.danger}18`,
  },
  actionBtnDisabled: {
    opacity: 0.45,
  },
  actionBtnPressed: {
    opacity: 0.85,
  },
  actionEmoji: {
    fontSize: 36,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TalleriaColors.text,
  },
  actionTitleAccent: {
    color: TalleriaColors.accent,
  },
  actionSubtitle: {
    fontSize: 13,
    color: TalleriaColors.textMuted,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionHalf: {
    flex: 1,
  },
  premiumCard: {
    backgroundColor: TalleriaColors.surfaceElevated,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: `${TalleriaColors.accent}55`,
    padding: 20,
    gap: 12,
    overflow: 'hidden',
  },
  premiumGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${TalleriaColors.accent}22`,
  },
  premiumHeader: {
    gap: 8,
  },
  localBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${TalleriaColors.success}22`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  localBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: TalleriaColors.success,
  },
  transcribingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transcribingText: {
    fontSize: 15,
    fontWeight: '600',
    color: TalleriaColors.accent,
  },
  premiumBadge: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    color: TalleriaColors.accent,
    backgroundColor: `${TalleriaColors.accent}22`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TalleriaColors.text,
  },
  premiumBody: {
    fontSize: 15,
    color: TalleriaColors.text,
    lineHeight: 23,
  },
  diagnosticoInput: {
    fontSize: 15,
    color: TalleriaColors.text,
    lineHeight: 23,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: `${TalleriaColors.background}88`,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
  },
  diagnosticoInputPlain: {
    fontSize: 15,
    color: TalleriaColors.text,
    lineHeight: 23,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: TalleriaColors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
    marginTop: 8,
    marginBottom: 8,
  },
  premiumMeta: {
    fontSize: 12,
    color: TalleriaColors.textMuted,
  },
  pendingIa: {
    fontSize: 14,
    color: TalleriaColors.textMuted,
    lineHeight: 22,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 40,
  },
  bar: {
    flex: 1,
    backgroundColor: TalleriaColors.accent,
    borderRadius: 2,
    opacity: 0.7,
  },
  label: {
    fontSize: 12,
    color: TalleriaColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bullet: {
    fontSize: 14,
    color: TalleriaColors.text,
    lineHeight: 24,
  },
  muted: {
    fontSize: 14,
    color: TalleriaColors.textMuted,
  },
  section: {
    fontSize: 18,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
  subsection: {
    fontSize: 14,
    fontWeight: '600',
    color: TalleriaColors.textMuted,
    marginTop: 4,
  },
  evidenceCard: {
    gap: 14,
  },
  evidenceThumb: {
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TalleriaColors.surfaceElevated,
  },
  realImage: {
    width: '100%',
    height: '100%',
  },
  evidenceThumbInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evidenceThumbIcon: {
    fontSize: 32,
  },
  evidenceTypeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#00000088',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  evidenceTypeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  evidenceInfo: {
    gap: 4,
    flex: 1,
  },
  evidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  evidenceName: {
    fontSize: 17,
    fontWeight: '600',
    color: TalleriaColors.text,
    flex: 1,
  },
  evidenceTipo: {
    fontSize: 13,
    color: TalleriaColors.textMuted,
  },
  sourceBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  audioEvidence: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  audioIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${TalleriaColors.accent}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioIcon: {
    fontSize: 28,
  },
  miniWaveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 24,
    marginTop: 6,
  },
  miniBar: {
    width: 4,
    backgroundColor: TalleriaColors.accent,
    borderRadius: 2,
    opacity: 0.6,
  },
});
