import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/talleria/Card';
import { Screen } from '@/components/talleria/Screen';
import { TalleriaColors } from '@/constants/theme';
import { clientes as mockClientes, getVehiculosByCliente } from '@/data/mock';
import { useTallerOkAuth } from '@/hooks/useTallerOkAuth';
import { mapTallerOkClienteToCliente } from '@/services/tallerok/tallerokMappers';
import { TallerOkApiError } from '@/services/tallerok/tallerokClient';
import { listClientes } from '@/services/tallerok/tallerokClientesApi';
import { listVehiculosByCliente } from '@/services/tallerok/tallerokVehiculosApi';
import type { Cliente } from '@/types/talleria';
import type { TallerOkVehiculo } from '@/types/tallerokApi';

type ClienteConVehiculos = {
  cliente: Cliente;
  vehiculos: TallerOkVehiculo[];
};

export default function ClientesScreen() {
  const router = useRouter();
  const { isAuthenticated: isTallerOkAuth } = useTallerOkAuth();

  const [clientesApi, setClientesApi] = useState<ClienteConVehiculos[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClientes = useCallback(async () => {
    if (!isTallerOkAuth) {
      setClientesApi([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiClientes = await listClientes();
      const conVehiculos = await Promise.all(
        apiClientes.map(async (cliente) => {
          const vehiculos = await listVehiculosByCliente(cliente.id);
          return {
            cliente: mapTallerOkClienteToCliente(cliente),
            vehiculos,
          };
        }),
      );
      setClientesApi(conVehiculos);
    } catch (err) {
      const message =
        err instanceof TallerOkApiError
          ? err.message
          : 'No se pudieron cargar los clientes. Volvé a intentar.';
      setError(message);
      setClientesApi([]);
    } finally {
      setIsLoading(false);
    }
  }, [isTallerOkAuth]);

  useFocusEffect(
    useCallback(() => {
      void loadClientes();
    }, [loadClientes]),
  );

  const handleClientePress = (vehiculos: { id: string }[], clienteNombre: string) => {
    const primerVehiculo = vehiculos[0];
    if (primerVehiculo) {
      router.push(`/(flow)/vehiculo/${primerVehiculo.id}`);
      return;
    }

    Alert.alert('Sin vehículos', `${clienteNombre} no tiene vehículos cargados todavía.`);
  };

  if (isTallerOkAuth) {
    return (
      <Screen title="Clientes" subtitle="Datos desde la API TallerOK">
        {isLoading ? (
          <View style={styles.centerRow}>
            <ActivityIndicator color={TalleriaColors.accent} />
            <Text style={styles.muted}>Cargando clientes…</Text>
          </View>
        ) : null}

        {error ? (
          <Card>
            <Text style={styles.error}>{error}</Text>
          </Card>
        ) : null}

        {!isLoading && !error && clientesApi.length === 0 ? (
          <Card>
            <Text style={styles.emptyTitle}>Sin clientes</Text>
            <Text style={styles.muted}>Todavía no hay clientes cargados en tu taller.</Text>
          </Card>
        ) : null}

        {clientesApi.map(({ cliente, vehiculos }) => (
          <Card key={cliente.id} onPress={() => handleClientePress(vehiculos, cliente.nombre)}>
            <Text style={styles.nombre}>{cliente.nombre}</Text>
            <Text style={styles.detalle}>{cliente.telefono || '—'}</Text>
            <Text style={styles.detalle}>
              {vehiculos.length} vehículo{vehiculos.length !== 1 ? 's' : ''}
            </Text>
            {vehiculos.length > 0 ? (
              <View style={styles.tags}>
                {vehiculos.map((v) => (
                  <Text key={v.id} style={styles.tag}>
                    {v.patente}
                  </Text>
                ))}
              </View>
            ) : null}
          </Card>
        ))}
      </Screen>
    );
  }

  return (
    <Screen title="Clientes" subtitle="Seleccioná un cliente para ver sus vehículos">
      {mockClientes.map((cliente) => {
        const vehiculosCliente = getVehiculosByCliente(cliente.id);
        const primerVehiculo = vehiculosCliente[0];

        return (
          <Card
            key={cliente.id}
            onPress={() => {
              if (primerVehiculo) {
                router.push(`/(flow)/vehiculo/${primerVehiculo.id}`);
              }
            }}>
            <Text style={styles.nombre}>{cliente.nombre}</Text>
            <Text style={styles.detalle}>{cliente.telefono}</Text>
            <Text style={styles.detalle}>
              {vehiculosCliente.length} vehículo{vehiculosCliente.length !== 1 ? 's' : ''}
            </Text>
            {vehiculosCliente.length > 0 ? (
              <View style={styles.tags}>
                {vehiculosCliente.map((v) => (
                  <Text key={v.id} style={styles.tag}>
                    {v.patente}
                  </Text>
                ))}
              </View>
            ) : null}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  nombre: {
    fontSize: 17,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
  detalle: {
    fontSize: 14,
    color: TalleriaColors.textMuted,
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
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TalleriaColors.text,
    marginBottom: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    fontSize: 12,
    color: TalleriaColors.accent,
    backgroundColor: `${TalleriaColors.accent}22`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
