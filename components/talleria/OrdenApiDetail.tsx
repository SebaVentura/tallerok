import { useFocusEffect } from '@react-navigation/native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/talleria/Card';
import { FlowNavBar } from '@/components/talleria/FlowNavBar';
import {
  ORDEN_ESTADOS_OPTIONS,
  OrdenEstadoBadge,
} from '@/components/talleria/OrdenEstadoBadge';
import { PrimaryButton } from '@/components/talleria/PrimaryButton';
import { Screen } from '@/components/talleria/Screen';
import { TalleriaColors } from '@/constants/theme';
import { TallerOkApiError } from '@/services/tallerok/tallerokClient';
import {
  getTallerOkOrden,
  updateTallerOkOrden,
} from '@/services/tallerok/tallerokOrdenesApi';
import {
  buildReporteTecnicoOrden,
  buildResumenClienteOrden,
} from '@/services/tallerok/tallerokReportes';
import type { TallerOkOrden, TallerOkOrdenEstado } from '@/types/tallerokApi';

const ESTADO_LABELS: Record<TallerOkOrdenEstado, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  esperando_repuesto: 'Esperando repuesto',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export function OrdenApiDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [orden, setOrden] = useState<TallerOkOrden | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingEstado, setIsUpdatingEstado] = useState(false);
  const [isSharingResumen, setIsSharingResumen] = useState(false);

  const loadOrden = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await getTallerOkOrden(id);
      setOrden(data);
    } catch (err) {
      const message =
        err instanceof TallerOkApiError
          ? err.message
          : 'No se pudo cargar la orden. Verificá que el endpoint esté disponible.';
      setError(message);
      setOrden(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadOrden();
    }, [loadOrden]),
  );

  const handleChangeEstado = async (estado: TallerOkOrdenEstado) => {
    if (!orden || orden.estado === estado || isUpdatingEstado) return;

    setIsUpdatingEstado(true);
    try {
      const updated = await updateTallerOkOrden(orden.id, { estado });
      setOrden(updated);
    } catch (err) {
      const message =
        err instanceof TallerOkApiError
          ? err.message
          : 'No se pudo actualizar el estado de la orden.';
      Alert.alert('Error', message);
    } finally {
      setIsUpdatingEstado(false);
    }
  };

  const handleCompartirResumen = async () => {
    if (!orden || isSharingResumen) return;

    const resumen = buildResumenClienteOrden(orden);
    if (resumen.vacio || !resumen.texto.trim()) return;

    setIsSharingResumen(true);
    try {
      await Share.share({ message: resumen.texto });
    } catch {
      Alert.alert('Error', 'No se pudo abrir el menú para compartir el resumen.');
    } finally {
      setIsSharingResumen(false);
    }
  };

  if (isLoading) {
    return (
      <Screen title="Cargando orden…">
        <View style={styles.loadingRow}>
          <ActivityIndicator color={TalleriaColors.accent} />
          <Text style={styles.muted}>Obteniendo datos…</Text>
        </View>
      </Screen>
    );
  }

  if (error || !orden) {
    return (
      <Screen title="Error">
        <FlowNavBar links={[{ label: 'Volver', onPress: () => router.back() }]} />
        <Card>
          <Text style={styles.error}>{error ?? 'Orden no encontrada'}</Text>
        </Card>
        <PrimaryButton title="Volver" onPress={() => router.back()} />
      </Screen>
    );
  }

  const titulo = orden.numero ?? `Orden ${orden.id.slice(-6)}`;
  const vehiculo = orden.vehiculo;
  const cliente = orden.cliente;
  const reporteTecnico = buildReporteTecnicoOrden(orden);
  const resumenCliente = buildResumenClienteOrden(orden);

  return (
    <>
      <Stack.Screen options={{ title: titulo }} />
      <Screen subtitle="Orden de trabajo">
        <FlowNavBar
          links={[
            {
              label: 'Volver al vehículo',
              onPress: () => router.push(`/(flow)/vehiculo/${orden.vehiculoId}`),
            },
          ]}
        />

        <View style={styles.apiBanner}>
          <Text style={styles.apiBannerText}>Datos desde API TallerOK</Text>
        </View>

        <Card>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.label}>Número</Text>
              <Text style={styles.value}>{titulo}</Text>
            </View>
            <OrdenEstadoBadge estado={orden.estado} />
          </View>
        </Card>

        {cliente ? (
          <Card>
            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.value}>{cliente.nombre}</Text>
            {cliente.telefono ? <Text style={styles.muted}>{cliente.telefono}</Text> : null}
          </Card>
        ) : null}

        {vehiculo ? (
          <Card>
            <Text style={styles.label}>Vehículo</Text>
            <Text style={styles.value}>{vehiculo.patente}</Text>
            <Text style={styles.muted}>
              {vehiculo.marca} {vehiculo.modelo}
              {vehiculo.anio ? ` · ${vehiculo.anio}` : ''}
            </Text>
          </Card>
        ) : null}

        <Card>
          <Text style={styles.label}>Motivo de ingreso</Text>
          <Text style={styles.body}>{orden.motivoIngreso || '—'}</Text>
        </Card>

        {orden.kilometrajeIngreso != null ? (
          <Card>
            <Text style={styles.label}>Kilometraje de ingreso</Text>
            <Text style={styles.body}>
              {orden.kilometrajeIngreso.toLocaleString('es-AR')} km
            </Text>
          </Card>
        ) : null}

        {orden.diagnosticoNotas ? (
          <Card>
            <Text style={styles.label}>Diagnóstico / notas</Text>
            <Text style={styles.body}>{orden.diagnosticoNotas}</Text>
          </Card>
        ) : null}

        <Card>
          <Text style={styles.label}>Tareas</Text>
          {orden.tareas.length === 0 ? (
            <Text style={styles.muted}>Sin tareas cargadas.</Text>
          ) : (
            orden.tareas.map((tarea, index) => {
              const done = tarea.realizada ?? tarea.completada ?? false;
              return (
                <Text key={tarea.id ?? `tarea-${index}`} style={styles.bullet}>
                  {done ? '✓' : '○'} {tarea.descripcion}
                </Text>
              );
            })
          )}
        </Card>

        {orden.observacionesInternas ? (
          <Card>
            <Text style={styles.label}>Observaciones internas</Text>
            <Text style={styles.body}>{orden.observacionesInternas}</Text>
          </Card>
        ) : null}

        {orden.createdAt || orden.updatedAt ? (
          <Card>
            {orden.createdAt ? (
              <Text style={styles.muted}>Creada: {orden.createdAt}</Text>
            ) : null}
            {orden.updatedAt ? (
              <Text style={styles.muted}>Actualizada: {orden.updatedAt}</Text>
            ) : null}
          </Card>
        ) : null}

        <Text style={styles.section}>Reportes</Text>

        <Card>
          <Text style={styles.label}>Reporte técnico</Text>
          {reporteTecnico.vacio ? (
            <Text style={styles.muted}>
              No hay información suficiente para generar el reporte técnico.
            </Text>
          ) : (
            <Text style={styles.reporteText}>{reporteTecnico.texto}</Text>
          )}
        </Card>

        <Card>
          <Text style={styles.label}>Resumen para cliente</Text>
          {resumenCliente.vacio ? (
            <Text style={styles.muted}>
              No hay información suficiente para generar el resumen para el cliente.
            </Text>
          ) : (
            <Text style={styles.reporteText}>{resumenCliente.texto}</Text>
          )}
          <View style={styles.shareButtonWrap}>
            <PrimaryButton
              title={isSharingResumen ? 'Abriendo…' : 'Compartir resumen'}
              onPress={handleCompartirResumen}
              disabled={resumenCliente.vacio || isSharingResumen}
            />
          </View>
        </Card>

        <Text style={styles.section}>Cambiar estado</Text>
        <View style={styles.estadoGrid}>
          {ORDEN_ESTADOS_OPTIONS.map((estado) => {
            const active = orden.estado === estado;
            return (
              <Pressable
                key={estado}
                onPress={() => handleChangeEstado(estado)}
                disabled={isUpdatingEstado}
                style={[
                  styles.estadoChip,
                  active && styles.estadoChipActive,
                  isUpdatingEstado && styles.estadoChipDisabled,
                ]}>
                <Text style={[styles.estadoChipText, active && styles.estadoChipTextActive]}>
                  {ESTADO_LABELS[estado]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isUpdatingEstado ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={TalleriaColors.accent} size="small" />
            <Text style={styles.muted}>Actualizando estado…</Text>
          </View>
        ) : null}
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
  apiBanner: {
    backgroundColor: `${TalleriaColors.accent}18`,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${TalleriaColors.accent}44`,
    padding: 12,
  },
  apiBannerText: {
    color: TalleriaColors.accent,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    color: TalleriaColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
  body: {
    fontSize: 15,
    color: TalleriaColors.text,
    lineHeight: 22,
  },
  muted: {
    fontSize: 14,
    color: TalleriaColors.textMuted,
    lineHeight: 20,
  },
  error: {
    fontSize: 14,
    color: TalleriaColors.danger,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  bullet: {
    fontSize: 14,
    color: TalleriaColors.text,
    lineHeight: 22,
  },
  reporteText: {
    fontSize: 14,
    color: TalleriaColors.text,
    lineHeight: 22,
  },
  shareButtonWrap: {
    marginTop: 12,
  },
  section: {
    fontSize: 16,
    fontWeight: '600',
    color: TalleriaColors.text,
    marginTop: 8,
  },
  estadoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  estadoChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  estadoChipActive: {
    borderColor: TalleriaColors.accent,
    backgroundColor: `${TalleriaColors.accent}18`,
  },
  estadoChipDisabled: {
    opacity: 0.6,
  },
  estadoChipText: {
    fontSize: 13,
    color: TalleriaColors.textMuted,
    fontWeight: '600',
  },
  estadoChipTextActive: {
    color: TalleriaColors.accent,
  },
});
