import { useFocusEffect } from '@react-navigation/native';
import { Stack, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/talleria/Badge';
import { Card } from '@/components/talleria/Card';
import { FlowNavBar } from '@/components/talleria/FlowNavBar';
import { OrdenEstadoBadge } from '@/components/talleria/OrdenEstadoBadge';
import { PrimaryButton } from '@/components/talleria/PrimaryButton';
import { Screen } from '@/components/talleria/Screen';
import { TalleriaColors } from '@/constants/theme';
import {
  getClienteByVehiculo,
  getHistorialVehiculo,
  getOrdenByVehiculo,
  getVehiculo as getMockVehiculo,
} from '@/data/mock';
import { useTallerOkAuth } from '@/hooks/useTallerOkAuth';
import { TallerOkApiError } from '@/services/tallerok/tallerokClient';
import { getCliente } from '@/services/tallerok/tallerokClientesApi';
import {
  mapTallerOkClienteToCliente,
  mapTallerOkVehiculoToVehiculo,
} from '@/services/tallerok/tallerokMappers';
import { getHistorialVehiculo as getApiHistorial, getVehiculo } from '@/services/tallerok/tallerokVehiculosApi';
import type { Cliente, HistorialItem, Vehiculo } from '@/types/talleria';

export default function VehiculoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated: isTallerOkAuth } = useTallerOkAuth();

  const [vehiculoApi, setVehiculoApi] = useState<Vehiculo | null>(null);
  const [clienteApi, setClienteApi] = useState<Cliente | null>(null);
  const [historialApi, setHistorialApi] = useState<HistorialItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVehiculo = useCallback(async () => {
    if (!isTallerOkAuth || !id) {
      setVehiculoApi(null);
      setClienteApi(null);
      setHistorialApi([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const vehiculoRaw = await getVehiculo(id);
      const vehiculo = mapTallerOkVehiculoToVehiculo(vehiculoRaw);
      const [clienteRaw, historial] = await Promise.all([
        getCliente(vehiculoRaw.clienteId),
        getApiHistorial(id),
      ]);

      setVehiculoApi(vehiculo);
      setClienteApi(mapTallerOkClienteToCliente(clienteRaw));
      setHistorialApi(historial);
    } catch (err) {
      const message =
        err instanceof TallerOkApiError
          ? err.message
          : 'No se pudo cargar el vehículo. Volvé a intentar.';
      setError(message);
      setVehiculoApi(null);
      setClienteApi(null);
      setHistorialApi([]);
    } finally {
      setIsLoading(false);
    }
  }, [id, isTallerOkAuth]);

  useFocusEffect(
    useCallback(() => {
      void loadVehiculo();
    }, [loadVehiculo]),
  );

  const vehiculoMock = getMockVehiculo(id ?? '');
  const clienteMock = vehiculoMock ? getClienteByVehiculo(vehiculoMock.id) : undefined;
  const historialMock = vehiculoMock ? getHistorialVehiculo(vehiculoMock.id) : [];
  const ordenMock = vehiculoMock ? getOrdenByVehiculo(vehiculoMock.id) : undefined;

  const vehiculo = isTallerOkAuth ? vehiculoApi : vehiculoMock;
  const cliente = isTallerOkAuth ? clienteApi : clienteMock;
  const historialItems = isTallerOkAuth ? historialApi : historialMock;
  const orden = isTallerOkAuth ? undefined : ordenMock;
  const resolveClienteId = (): string | undefined => {
    if (clienteApi?.id) return clienteApi.id;
    if (vehiculoApi?.clienteId) return vehiculoApi.clienteId;
    return undefined;
  };

  // En modo real el diagnóstico inicial se carga como parte de una orden.
  // La pantalla diagnostico/[vehiculoId] queda reservada para demo/mock.
  const handleNuevoDiagnostico = () => {
    if (!id) return;
    const clienteId = resolveClienteId();
    if (!clienteId) {
      Alert.alert(
        'No se puede iniciar',
        'No encontramos el cliente asociado a este vehículo. Volvé a intentar o contactá soporte.',
      );
      return;
    }
    const params = new URLSearchParams({ vehiculoId: id, clienteId });
    router.push(`/(flow)/orden/nueva?${params.toString()}` as Href);
  };

  const handleHistorialPress = (item: HistorialItem) => {
    if (isTallerOkAuth && item.ordenId) {
      router.push(`/(flow)/orden/${item.ordenId}` as const);
    }
  };

  if (isTallerOkAuth && isLoading) {
    return (
      <Screen title="Cargando vehículo…">
        <View style={styles.loadingRow}>
          <ActivityIndicator color={TalleriaColors.accent} />
          <Text style={styles.muted}>Obteniendo datos del taller…</Text>
        </View>
      </Screen>
    );
  }

  if (isTallerOkAuth && error) {
    return (
      <Screen title="Error al cargar">
        <FlowNavBar
          links={[{ label: 'Volver a Clientes', onPress: () => router.push('/(tabs)/clientes') }]}
        />
        <Card>
          <Text style={styles.error}>{error}</Text>
        </Card>
        <PrimaryButton title="Volver" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (!vehiculo) {
    return (
      <Screen title="Vehículo no encontrado">
        <FlowNavBar
          links={[{ label: 'Volver a Clientes', onPress: () => router.push('/(tabs)/clientes') }]}
        />
        <PrimaryButton title="Volver" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: vehiculo.patente }} />
      <Screen subtitle={`${vehiculo.marca} ${vehiculo.modelo} · ${vehiculo.anio}`}>
        <FlowNavBar
          links={[
            { label: 'Volver a Clientes', onPress: () => router.push('/(tabs)/clientes') },
            ...(!isTallerOkAuth
              ? [
                  {
                    // Mock/demo: diagnostico/[vehiculoId] no es flujo real todavía.
                    label: 'Nuevo diagnóstico (demo)',
                    onPress: () => router.push(`/(flow)/diagnostico/${vehiculo.id}`),
                  },
                ]
              : [
                  {
                    label: 'Nuevo diagnóstico',
                    onPress: handleNuevoDiagnostico,
                  },
                ]),
          ]}
        />

        {isTallerOkAuth ? (
          <View style={styles.apiBanner}>
            <Text style={styles.apiBannerText}>Datos desde API TallerOK</Text>
          </View>
        ) : null}

        <Card>
          <Text style={styles.label}>Cliente</Text>
          <Text style={styles.value}>{cliente?.nombre ?? '—'}</Text>
          <Text style={styles.muted}>{cliente?.telefono ?? '—'}</Text>
        </Card>

        <Card>
          <Text style={styles.label}>Kilometraje</Text>
          <Text style={styles.value}>{vehiculo.km.toLocaleString('es-AR')} km</Text>
        </Card>

        <Text style={styles.section}>Historial</Text>
        {historialItems.length === 0 ? (
          <Card>
            <Text style={styles.muted}>
              {isTallerOkAuth
                ? 'Todavía no hay órdenes registradas para este vehículo.'
                : 'Sin historial registrado todavía.'}
            </Text>
          </Card>
        ) : (
          historialItems.map((item) => (
            <Card
              key={item.id}
              onPress={
                isTallerOkAuth && item.ordenId
                  ? () => handleHistorialPress(item)
                  : undefined
              }>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Text style={styles.value}>{item.motivo}</Text>
                  <Text style={styles.muted}>{item.fecha}</Text>
                </View>
                {isTallerOkAuth ? (
                  <OrdenEstadoBadge estado={item.estado} />
                ) : (
                  <Badge estado={item.estado} />
                )}
              </View>
            </Card>
          ))
        )}

        {isTallerOkAuth ? (
          <PrimaryButton title="Nuevo diagnóstico" onPress={handleNuevoDiagnostico} />
        ) : null}

        {!isTallerOkAuth ? (
          <>
            <PrimaryButton
              title="Diagnóstico IA (demo)"
              onPress={() => router.push(`/(flow)/diagnostico/${vehiculo.id}`)}
            />

            {orden ? (
              <PrimaryButton
                title={`Ver orden ${orden.numero}`}
                onPress={() => router.push(`/(flow)/orden/${orden.id}`)}
              />
            ) : null}
          </>
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
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
  muted: {
    fontSize: 14,
    color: TalleriaColors.textMuted,
  },
  error: {
    fontSize: 14,
    color: TalleriaColors.danger,
    lineHeight: 20,
  },
  section: {
    fontSize: 18,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TalleriaColors.text,
    marginBottom: 4,
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
});
