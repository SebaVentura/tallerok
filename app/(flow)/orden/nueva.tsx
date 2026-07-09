/**
 * Diagnóstico inicial en modo real.
 * Crea una orden vía POST /ordenes (no existe endpoint /diagnosticos).
 * La pantalla diagnostico/[vehiculoId] queda reservada para demo/mock.
 */
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Card } from '@/components/talleria/Card';
import { DictadoTextArea } from '@/components/talleria/DictadoTextArea';
import { FlowNavBar } from '@/components/talleria/FlowNavBar';
import { PrimaryButton } from '@/components/talleria/PrimaryButton';
import { Screen } from '@/components/talleria/Screen';
import { TalleriaColors } from '@/constants/theme';
import { useTallerOkAuth } from '@/hooks/useTallerOkAuth';
import { TallerOkApiError } from '@/services/tallerok/tallerokClient';
import { getCliente } from '@/services/tallerok/tallerokClientesApi';
import { createTallerOkOrden } from '@/services/tallerok/tallerokOrdenesApi';
import { getVehiculo } from '@/services/tallerok/tallerokVehiculosApi';
import type { TallerOkOrdenTarea } from '@/types/tallerokApi';
import { parseRouteParam } from '@/utils/routeParams';

type TareaDraft = {
  key: string;
  descripcion: string;
};

function ActionButton({
  emoji,
  title,
  subtitle,
  accent,
  disabled,
  onPress,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  accent?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        accent && styles.actionBtnAccent,
        (disabled || !onPress) && styles.actionBtnDisabled,
        pressed && !disabled && onPress && styles.actionBtnPressed,
      ]}>
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <Text style={[styles.actionTitle, accent && styles.actionTitleAccent]}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

function toPayloadTareas(tareas: TareaDraft[]): TallerOkOrdenTarea[] {
  return tareas
    .map((t) => t.descripcion.trim())
    .filter(Boolean)
    .map((descripcion) => ({
      descripcion,
      realizada: false,
    }));
}

export default function NuevaOrdenScreen() {
  const rawParams = useLocalSearchParams<{
    vehiculoId?: string | string[];
    clienteId?: string | string[];
  }>();
  const vehiculoId = parseRouteParam(rawParams.vehiculoId);
  const clienteIdParam = parseRouteParam(rawParams.clienteId);

  const router = useRouter();
  const { isAuthenticated: isTallerOkAuth } = useTallerOkAuth();
  const diagnosticoInputRef = useRef<TextInput>(null);

  const [clienteId, setClienteId] = useState<string | undefined>(clienteIdParam);
  const [clienteLabel, setClienteLabel] = useState<string | null>(null);
  const [patente, setPatente] = useState<string | null>(null);
  const [vehiculoLabel, setVehiculoLabel] = useState<string | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);

  const [motivoIngreso, setMotivoIngreso] = useState('');
  const [kilometrajeIngreso, setKilometrajeIngreso] = useState('');
  const [diagnosticoNotas, setDiagnosticoNotas] = useState('');
  const [tareas, setTareas] = useState<TareaDraft[]>([]);
  const [observacionesInternas, setObservacionesInternas] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasRequiredParams = Boolean(vehiculoId);

  useEffect(() => {
    if (!isTallerOkAuth || !vehiculoId) {
      setClienteLabel(null);
      setPatente(null);
      setVehiculoLabel(null);
      setContextError(null);
      return;
    }

    let active = true;
    setIsLoadingContext(true);
    setContextError(null);

    getVehiculo(vehiculoId)
      .then(async (vehiculo) => {
        if (!active) return;

        const resolvedClienteId = clienteIdParam ?? vehiculo.clienteId;
        setClienteId(resolvedClienteId || undefined);
        setPatente(vehiculo.patente?.trim() || null);
        setVehiculoLabel(`${vehiculo.patente} · ${vehiculo.marca} ${vehiculo.modelo}`);

        if (vehiculo.km != null) {
          setKilometrajeIngreso((prev) => prev || String(vehiculo.km));
        }

        if (!resolvedClienteId) {
          setClienteLabel(null);
          return;
        }

        try {
          const cliente = await getCliente(resolvedClienteId);
          if (!active) return;
          setClienteLabel(cliente.nombre);
        } catch {
          if (!active) return;
          setClienteLabel(null);
        }
      })
      .catch(() => {
        if (!active) return;
        setPatente(null);
        setVehiculoLabel(null);
        setClienteLabel(null);
        setContextError('No pudimos identificar el vehículo para iniciar el diagnóstico.');
      })
      .finally(() => {
        if (active) setIsLoadingContext(false);
      });

    return () => {
      active = false;
    };
  }, [clienteIdParam, isTallerOkAuth, vehiculoId]);

  const pasoSubtitle = useMemo(() => {
    if (patente) return `Paso 1 · ${patente}`;
    return 'Paso 1 · Vehículo seleccionado';
  }, [patente]);

  const canSubmit = useMemo(
    () =>
      Boolean(
        vehiculoId &&
          motivoIngreso.trim() &&
          !isSaving &&
          !isLoadingContext &&
          !contextError,
      ),
    [contextError, isLoadingContext, isSaving, motivoIngreso, vehiculoId],
  );

  const focusDiagnostico = () => {
    diagnosticoInputRef.current?.focus();
  };

  const addTarea = () => {
    setTareas((prev) => [
      ...prev,
      { key: `tarea-${Date.now()}-${prev.length}`, descripcion: '' },
    ]);
  };

  const updateTarea = (key: string, descripcion: string) => {
    setTareas((prev) => prev.map((t) => (t.key === key ? { ...t, descripcion } : t)));
  };

  const removeTarea = (key: string) => {
    setTareas((prev) => prev.filter((t) => t.key !== key));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!vehiculoId) {
      setError('No pudimos identificar el vehículo para iniciar el diagnóstico.');
      return;
    }

    if (!motivoIngreso.trim()) {
      setError('El motivo de ingreso es obligatorio.');
      return;
    }

    const kmTrim = kilometrajeIngreso.trim();
    let kmValue: number | undefined;
    if (kmTrim) {
      kmValue = Number(kmTrim);
      if (Number.isNaN(kmValue)) {
        setError('El kilometraje debe ser un número válido.');
        return;
      }
    }

    const payloadTareas = toPayloadTareas(tareas);
    const diagnosticoTrim = diagnosticoNotas.trim();
    const observacionesTrim = observacionesInternas.trim();

    setIsSaving(true);
    try {
      const created = await createTallerOkOrden({
        vehiculoId,
        ...(clienteId ? { clienteId } : {}),
        motivoIngreso: motivoIngreso.trim(),
        ...(kmValue != null ? { kilometrajeIngreso: kmValue } : {}),
        ...(diagnosticoTrim ? { diagnosticoNotas: diagnosticoTrim } : {}),
        ...(payloadTareas.length > 0 ? { tareas: payloadTareas } : {}),
        ...(observacionesTrim ? { observacionesInternas: observacionesTrim } : {}),
      });

      Alert.alert(
        'Diagnóstico guardado',
        'Diagnóstico inicial guardado como orden de trabajo.',
        [
          {
            text: 'Ver orden',
            onPress: () => router.replace(`/(flow)/orden/${created.id}` as const),
          },
        ],
      );
    } catch (err) {
      const message =
        err instanceof TallerOkApiError
          ? err.message
          : 'No pudimos crear el diagnóstico inicial. Intentá nuevamente.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isTallerOkAuth) {
    return (
      <Screen title="Nuevo diagnóstico">
        <Text style={styles.errorText}>Disponible solo con sesión TallerOK.</Text>
        <PrimaryButton title="Volver" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (!hasRequiredParams) {
    return (
      <Screen title="Nuevo diagnóstico">
        <Card>
          <Text style={styles.errorText}>
            No pudimos identificar el vehículo para iniciar el diagnóstico.
          </Text>
        </Card>
        <PrimaryButton title="Volver" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Nuevo diagnóstico' }} />
      <Screen title="Nuevo diagnóstico" subtitle={pasoSubtitle}>
        <FlowNavBar
          onBack={() => router.back()}
          links={[
            {
              label: 'Volver a Vehículo',
              onPress: () => router.push(`/(flow)/vehiculo/${vehiculoId}`),
              disabled: !vehiculoId,
            },
          ]}
        />

        {isLoadingContext ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={TalleriaColors.accent} />
            <Text style={styles.muted}>Cargando vehículo…</Text>
          </View>
        ) : null}

        {contextError ? (
          <Card>
            <Text style={styles.errorText}>{contextError}</Text>
          </Card>
        ) : null}

        {clienteLabel || vehiculoLabel ? (
          <Card>
            {clienteLabel ? (
              <>
                <Text style={styles.label}>Cliente</Text>
                <Text style={styles.value}>{clienteLabel}</Text>
              </>
            ) : null}
            {vehiculoLabel ? (
              <>
                <Text style={[styles.label, clienteLabel ? styles.labelSpaced : null]}>
                  Vehículo
                </Text>
                <Text style={styles.value}>{vehiculoLabel}</Text>
              </>
            ) : null}
          </Card>
        ) : null}

        <ActionButton
          emoji="🎤"
          title="Dictar diagnóstico"
          subtitle="Usá el dictado del teclado para cargar síntomas y observaciones"
          accent
          disabled={isSaving}
          onPress={focusDiagnostico}
        />

        <View style={styles.actionRow}>
          <View style={styles.actionHalf}>
            <ActionButton
              emoji="📷"
              title="Tomar foto"
              subtitle="Próximamente"
              disabled
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

        <Card>
          <Text style={styles.label}>Motivo de ingreso *</Text>
          <TextInput
            style={styles.fieldInput}
            value={motivoIngreso}
            onChangeText={setMotivoIngreso}
            placeholder="Ej: Ruido al frenar, pérdida de potencia, service, revisión general..."
            placeholderTextColor={TalleriaColors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            autoCorrect
            spellCheck
            blurOnSubmit={false}
            editable={!isSaving}
          />
        </Card>

        <Card>
          <Text style={styles.label}>Kilometraje</Text>
          <TextInput
            style={styles.fieldInputSingle}
            value={kilometrajeIngreso}
            onChangeText={setKilometrajeIngreso}
            placeholder="85000"
            placeholderTextColor={TalleriaColors.textMuted}
            keyboardType="number-pad"
            returnKeyType="done"
            editable={!isSaving}
          />
        </Card>

        <View style={styles.diagnosticoCard}>
          <View style={styles.diagnosticoGlow} />
          <Text style={styles.label}>Diagnóstico (editable)</Text>
          <TextInput
            ref={diagnosticoInputRef}
            style={styles.diagnosticoInput}
            value={diagnosticoNotas}
            onChangeText={setDiagnosticoNotas}
            placeholder="Describí síntomas, ruidos, fallas, pruebas realizadas o sospechas iniciales..."
            placeholderTextColor={TalleriaColors.textMuted}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            autoCorrect
            spellCheck
            blurOnSubmit={false}
            editable={!isSaving}
          />
          <Text style={styles.helper}>
            Podés dictar usando el micrófono del teclado del celular.
          </Text>
        </View>

        <Card>
          <Text style={styles.label}>Hallazgos / tareas sugeridas</Text>
          {tareas.length === 0 ? (
            <Text style={styles.muted}>
              Agregá tareas iniciales para revisar durante el diagnóstico.
            </Text>
          ) : (
            tareas.map((tarea, index) => (
              <View key={tarea.key} style={styles.tareaRow}>
                <TextInput
                  style={styles.tareaInput}
                  value={tarea.descripcion}
                  onChangeText={(text) => updateTarea(tarea.key, text)}
                  placeholder={`Tarea ${index + 1}`}
                  placeholderTextColor={TalleriaColors.textMuted}
                  editable={!isSaving}
                />
                <Pressable
                  onPress={() => removeTarea(tarea.key)}
                  disabled={isSaving}
                  style={styles.tareaRemove}
                  accessibilityRole="button"
                  accessibilityLabel="Quitar tarea">
                  <Text style={styles.tareaRemoveText}>Quitar</Text>
                </Pressable>
              </View>
            ))
          )}
          <Pressable
            onPress={addTarea}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.addTareaBtn,
              pressed && !isSaving && styles.addTareaBtnPressed,
              isSaving && styles.actionBtnDisabled,
            ]}>
            <Text style={styles.addTareaText}>+ Agregar tarea</Text>
          </Pressable>
        </Card>

        <DictadoTextArea
          label="Observaciones internas"
          value={observacionesInternas}
          onChangeText={setObservacionesInternas}
          placeholder="Notas internas para el taller, repuestos a revisar, dudas para consultar al cliente..."
          numberOfLines={4}
          editable={!isSaving}
        />

        <Text style={styles.section}>Evidencias</Text>
        <Card>
          <Text style={styles.value}>Evidencias</Text>
          <Text style={styles.muted}>
            Fotos y videos estarán disponibles en una próxima versión.
          </Text>
          <View style={styles.actionRow}>
            <View style={styles.actionHalf}>
              <ActionButton emoji="📷" title="Tomar foto" subtitle="Próximamente" disabled />
            </View>
            <View style={styles.actionHalf}>
              <ActionButton emoji="🎥" title="Grabar video" subtitle="Próximamente" disabled />
            </View>
          </View>
        </Card>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton
          title={isSaving ? 'Guardando…' : 'Crear diagnóstico inicial'}
          onPress={handleSubmit}
          disabled={!canSubmit}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  muted: {
    fontSize: 14,
    color: TalleriaColors.textMuted,
    lineHeight: 20,
  },
  label: {
    fontSize: 12,
    color: TalleriaColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelSpaced: {
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
  helper: {
    fontSize: 12,
    color: TalleriaColors.textMuted,
    lineHeight: 17,
  },
  errorText: {
    fontSize: 14,
    color: TalleriaColors.danger,
    lineHeight: 20,
  },
  section: {
    fontSize: 18,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
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
  fieldInput: {
    fontSize: 15,
    color: TalleriaColors.text,
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: TalleriaColors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
    marginTop: 8,
  },
  fieldInputSingle: {
    fontSize: 15,
    color: TalleriaColors.text,
    backgroundColor: TalleriaColors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
    marginTop: 8,
  },
  diagnosticoCard: {
    backgroundColor: TalleriaColors.surfaceElevated,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: `${TalleriaColors.accent}55`,
    padding: 20,
    gap: 12,
    overflow: 'hidden',
  },
  diagnosticoGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${TalleriaColors.accent}22`,
  },
  diagnosticoInput: {
    fontSize: 15,
    color: TalleriaColors.text,
    lineHeight: 23,
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: `${TalleriaColors.background}88`,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
  },
  tareaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  tareaInput: {
    flex: 1,
    fontSize: 15,
    color: TalleriaColors.text,
    backgroundColor: TalleriaColors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
  },
  tareaRemove: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tareaRemoveText: {
    fontSize: 13,
    fontWeight: '600',
    color: TalleriaColors.danger,
  },
  addTareaBtn: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${TalleriaColors.accent}66`,
    backgroundColor: `${TalleriaColors.accent}14`,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addTareaBtnPressed: {
    backgroundColor: `${TalleriaColors.accent}28`,
  },
  addTareaText: {
    fontSize: 14,
    fontWeight: '700',
    color: TalleriaColors.accent,
  },
});
