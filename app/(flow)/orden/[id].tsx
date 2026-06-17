import { Image } from 'expo-image';
import { Audio } from 'expo-av';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Badge } from '@/components/talleria/Badge';
import { Card } from '@/components/talleria/Card';
import { FlowNavBar } from '@/components/talleria/FlowNavBar';
import { PrimaryButton } from '@/components/talleria/PrimaryButton';
import { Screen } from '@/components/talleria/Screen';
import { TalleriaColors } from '@/constants/theme';
import { parseMontoInput } from '@/data/calcPresupuesto';
import {
  getDiagnosticoSesionByOrdenId,
  updateDiagnosticoSesion,
} from '@/data/demoSession';
import {
  buildPresupuestoSesion,
  getPresupuestoSesionByOrdenId,
  setPresupuestoSesion,
} from '@/data/presupuestoSession';
import {
  seedManoObra,
  seedRepuestos,
  seedRepuestosFromOrden,
} from '@/data/seedPresupuesto';
import type { ManoObra, Repuesto } from '@/types/presupuesto';
import {
  getClienteByVehiculo,
  getDiagnosticoByVehiculo,
  getOrden,
  getVehiculo,
} from '@/data/mock';

export default function OrdenScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const orden = getOrden(id ?? '');
  const vehiculo = orden ? getVehiculo(orden.vehiculoId) : undefined;
  const cliente = vehiculo ? getClienteByVehiculo(vehiculo.id) : undefined;
  const sesion = orden ? getDiagnosticoSesionByOrdenId(orden.id) : null;
  const desdeDiagnostico = sesion != null;

  const repuestosIniciales = useMemo(() => {
    if (!orden) return [];
    if (sesion) return seedRepuestos(sesion.repuestos, orden.id);
    return seedRepuestosFromOrden(orden);
  }, [orden, sesion]);

  const manoObraInicial = useMemo(() => {
    if (!orden) return [];
    const tareas = sesion?.tareas ?? orden.tareas;
    return seedManoObra(tareas, orden.id);
  }, [orden, sesion]);

  const [textoDiagnostico, setTextoDiagnostico] = useState(
    sesion?.textoDiagnostico ?? getDiagnosticoByVehiculo(orden?.vehiculoId ?? '')?.resumenIA ?? '',
  );
  const [tareasText, setTareasText] = useState(
    sesion ? sesion.tareas.join('\n') : orden?.tareas.join('\n') ?? '',
  );
  const [repuestos, setRepuestos] = useState<Repuesto[]>(repuestosIniciales);
  const [manoObra, setManoObra] = useState<ManoObra[]>(manoObraInicial);
  const [isPlaying, setIsPlaying] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);

  const unloadSound = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const handleTextoChange = (text: string) => {
    setTextoDiagnostico(text);
    if (desdeDiagnostico) {
      updateDiagnosticoSesion({ textoDiagnostico: text });
    }
  };

  const handleTareasChange = (text: string) => {
    setTareasText(text);
    if (desdeDiagnostico) {
      updateDiagnosticoSesion({
        tareas: text.split('\n').map((t) => t.trim()).filter(Boolean),
      });
    }
  };

  const updateRepuesto = (repuestoId: string, field: keyof Repuesto, value: string) => {
    setRepuestos((prev) =>
      prev.map((item) => {
        if (item.id !== repuestoId) return item;
        if (field === 'nombre') return { ...item, nombre: value };
        if (field === 'cantidad') return { ...item, cantidad: Math.max(1, parseMontoInput(value) || 1) };
        if (field === 'precioUnitario') return { ...item, precioUnitario: parseMontoInput(value) };
        return item;
      }),
    );
  };

  const updateManoObra = (itemId: string, field: keyof ManoObra, value: string) => {
    setManoObra((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        if (field === 'descripcion') return { ...item, descripcion: value };
        if (field === 'monto') return { ...item, monto: parseMontoInput(value) };
        return item;
      }),
    );
  };

  const agregarRepuesto = () => {
    setRepuestos((prev) => [
      ...prev,
      {
        id: `rep-new-${Date.now()}`,
        nombre: '',
        cantidad: 1,
        precioUnitario: 0,
      },
    ]);
  };

  const agregarManoObra = () => {
    setManoObra((prev) => [
      ...prev,
      {
        id: `mo-new-${Date.now()}`,
        descripcion: '',
        monto: 0,
      },
    ]);
  };

  const handleGenerarPresupuesto = () => {
    if (!orden || !vehiculo || !cliente) return;

    const presupuesto = buildPresupuestoSesion({
      ordenId: orden.id,
      numeroOrden: orden.numero,
      clienteNombre: cliente.nombre,
      clienteTelefono: cliente.telefono,
      vehiculoPatente: vehiculo.patente,
      vehiculoDescripcion: `${vehiculo.marca} ${vehiculo.modelo} · ${vehiculo.anio}`,
      diagnosticoTexto: textoDiagnostico.trim() || 'Sin diagnóstico cargado.',
      fotoPrincipalUri: sesion?.fotos[0]?.uri ?? null,
      repuestos,
      manoObra: manoObra.filter((item) => item.descripcion.trim() || item.monto > 0),
    });

    setPresupuestoSesion(presupuesto);
    router.push(`/(flow)/presupuesto/${orden.id}` as const);
  };

  const handlePlayAudio = async () => {
    if (!sesion?.audioUri) return;

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

      const { sound } = await Audio.Sound.createAsync({ uri: sesion.audioUri });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          unloadSound();
        }
      });
      setIsPlaying(true);
      await sound.playAsync();
    } catch {
      await unloadSound();
    }
  };

  if (!orden) {
    return (
      <Screen title="Orden no encontrada">
        <FlowNavBar />
        <PrimaryButton title="Volver" onPress={() => router.back()} />
      </Screen>
    );
  }

  const tienePresupuesto = getPresupuestoSesionByOrdenId(orden.id) != null;
  const ordenNavLinks = [
    {
      label: 'Volver a Diagnóstico',
      onPress: () => router.push(`/(flow)/diagnostico/${orden.vehiculoId}` as const),
    },
    ...(tienePresupuesto
      ? [
          {
            label: 'Ir a Presupuesto',
            onPress: () => router.push(`/(flow)/presupuesto/${orden.id}` as const),
          },
        ]
      : []),
  ];

  const tareas = desdeDiagnostico
    ? tareasText.split('\n').map((t) => t.trim()).filter(Boolean)
    : orden.tareas;
  const hallazgos = desdeDiagnostico ? sesion!.hallazgos : [];

  return (
    <>
      <Stack.Screen options={{ title: orden.numero }} />
      <Screen subtitle={`Paso 2 · ${vehiculo?.patente ?? ''}`}>
        <FlowNavBar links={ordenNavLinks} />
        {desdeDiagnostico ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>Orden generada desde diagnóstico</Text>
          </View>
        ) : null}

        <Card>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.label}>Estado</Text>
              <Text style={styles.value}>Técnico: {orden.tecnico}</Text>
            </View>
            <Badge estado={orden.estado} />
          </View>
        </Card>

        {desdeDiagnostico ? (
          <>
            <Card>
              <Text style={styles.label}>Diagnóstico recibido</Text>
              <TextInput
                style={styles.textArea}
                value={textoDiagnostico}
                onChangeText={handleTextoChange}
                multiline
                placeholder="Texto del diagnóstico..."
                placeholderTextColor={TalleriaColors.textMuted}
              />
            </Card>

            {sesion!.audioUri ? (
              <Card>
                <Text style={styles.label}>Audio adjunto</Text>
                <View style={styles.audioRow}>
                  <View style={styles.audioBadge}>
                    <Text style={styles.audioBadgeText}>🎤 {sesion!.audioDuracionSec}s</Text>
                  </View>
                  <PrimaryButton
                    title={isPlaying ? 'Detener' : 'Reproducir audio'}
                    onPress={handlePlayAudio}
                  />
                </View>
              </Card>
            ) : (
              <Card>
                <Text style={styles.muted}>Sin audio adjunto en este diagnóstico.</Text>
              </Card>
            )}

            {sesion!.fotos.length > 0 ? (
              <Card>
                <Text style={styles.label}>Fotos del diagnóstico</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.photoRow}>
                    {sesion!.fotos.map((foto, index) => (
                      <View key={foto.id} style={styles.photoWrap}>
                        <Image source={{ uri: foto.uri }} style={styles.photoThumb} contentFit="cover" />
                        <Text style={styles.photoLabel}>Foto {index + 1}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </Card>
            ) : (
              <Card>
                <Text style={styles.muted}>Sin fotos adjuntas en este diagnóstico.</Text>
              </Card>
            )}

            {hallazgos.length > 0 ? (
              <Card>
                <Text style={styles.label}>Hallazgos sugeridos</Text>
                {hallazgos.map((h) => (
                  <Text key={h} style={styles.bullet}>
                    • {h}
                  </Text>
                ))}
              </Card>
            ) : null}
          </>
        ) : null}

        <Card>
          <Text style={styles.label}>Tareas {desdeDiagnostico ? '(editable)' : ''}</Text>
          {desdeDiagnostico ? (
            <TextInput
              style={styles.textArea}
              value={tareasText}
              onChangeText={handleTareasChange}
              multiline
              placeholder="Una tarea por línea..."
              placeholderTextColor={TalleriaColors.textMuted}
            />
          ) : (
            tareas.map((t) => (
              <Text key={t} style={styles.bullet}>
                ☐ {t}
              </Text>
            ))
          )}
        </Card>

        <Card>
          <Text style={styles.label}>Repuestos estimados (con precio)</Text>
          {repuestos.map((repuesto) => (
            <View key={repuesto.id} style={styles.editBlock}>
              <TextInput
                style={styles.input}
                value={repuesto.nombre}
                onChangeText={(value) => updateRepuesto(repuesto.id, 'nombre', value)}
                placeholder="Nombre del repuesto"
                placeholderTextColor={TalleriaColors.textMuted}
              />
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Cant.</Text>
                  <TextInput
                    style={styles.input}
                    value={String(repuesto.cantidad)}
                    onChangeText={(value) => updateRepuesto(repuesto.id, 'cantidad', value)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Precio unit.</Text>
                  <TextInput
                    style={styles.input}
                    value={repuesto.precioUnitario > 0 ? String(repuesto.precioUnitario) : ''}
                    onChangeText={(value) => updateRepuesto(repuesto.id, 'precioUnitario', value)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={TalleriaColors.textMuted}
                  />
                </View>
              </View>
            </View>
          ))}
          <Pressable onPress={agregarRepuesto} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Agregar repuesto</Text>
          </Pressable>
        </Card>

        <Card>
          <Text style={styles.label}>Mano de obra (con precio)</Text>
          {manoObra.map((item) => (
            <View key={item.id} style={styles.editBlock}>
              <TextInput
                style={styles.input}
                value={item.descripcion}
                onChangeText={(value) => updateManoObra(item.id, 'descripcion', value)}
                placeholder="Descripción"
                placeholderTextColor={TalleriaColors.textMuted}
              />
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Monto</Text>
                <TextInput
                  style={styles.input}
                  value={item.monto > 0 ? String(item.monto) : ''}
                  onChangeText={(value) => updateManoObra(item.id, 'monto', value)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={TalleriaColors.textMuted}
                />
              </View>
            </View>
          ))}
          <Pressable onPress={agregarManoObra} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Agregar mano de obra</Text>
          </Pressable>
        </Card>

        <PrimaryButton title="Generar presupuesto" onPress={handleGenerarPresupuesto} />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: `${TalleriaColors.success}22`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${TalleriaColors.success}55`,
    padding: 14,
  },
  bannerText: {
    color: TalleriaColors.success,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    color: TalleriaColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flex: {
    flex: 1,
    gap: 4,
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
  textArea: {
    fontSize: 15,
    color: TalleriaColors.text,
    lineHeight: 22,
    minHeight: 88,
    textAlignVertical: 'top',
    backgroundColor: TalleriaColors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
  },
  audioRow: {
    gap: 12,
  },
  audioBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${TalleriaColors.accent}22`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  audioBadgeText: {
    color: TalleriaColors.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  photoWrap: {
    gap: 6,
  },
  photoThumb: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: TalleriaColors.surfaceElevated,
  },
  photoLabel: {
    fontSize: 12,
    color: TalleriaColors.textMuted,
    textAlign: 'center',
  },
  editBlock: {
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: TalleriaColors.border,
  },
  input: {
    fontSize: 15,
    color: TalleriaColors.text,
    backgroundColor: TalleriaColors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    color: TalleriaColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addBtn: {
    paddingVertical: 8,
  },
  addBtnText: {
    color: TalleriaColors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});
