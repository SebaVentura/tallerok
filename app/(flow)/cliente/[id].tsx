import { useFocusEffect } from '@react-navigation/native';
import { Stack, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Card } from '@/components/talleria/Card';
import { ClienteFormModal } from '@/components/talleria/ClienteFormModal';
import { FlowNavBar } from '@/components/talleria/FlowNavBar';
import { PrimaryButton } from '@/components/talleria/PrimaryButton';
import { Screen } from '@/components/talleria/Screen';
import { VehiculoFormModal } from '@/components/talleria/VehiculoFormModal';
import { TalleriaColors } from '@/constants/theme';
import { useTallerOkAuth } from '@/hooks/useTallerOkAuth';
import { TallerOkApiError } from '@/services/tallerok/tallerokClient';
import {
  deleteCliente,
  getCliente,
  updateCliente,
} from '@/services/tallerok/tallerokClientesApi';
import {
  createVehiculo,
  listVehiculosByCliente,
} from '@/services/tallerok/tallerokVehiculosApi';
import type { TallerOkCreateClientePayload, TallerOkCliente, TallerOkVehiculo } from '@/types/tallerokApi';

export default function ClienteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated: isTallerOkAuth } = useTallerOkAuth();

  const [cliente, setCliente] = useState<TallerOkCliente | null>(null);
  const [vehiculos, setVehiculos] = useState<TallerOkVehiculo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSavingCliente, setIsSavingCliente] = useState(false);
  const [isSavingVehiculo, setIsSavingVehiculo] = useState(false);
  const [showEditCliente, setShowEditCliente] = useState(false);
  const [showNewVehiculo, setShowNewVehiculo] = useState(false);

  const loadData = useCallback(async () => {
    if (!isTallerOkAuth || !id) return;

    setIsLoading(true);
    setError(null);
    try {
      const [clienteData, vehiculosData] = await Promise.all([
        getCliente(id),
        listVehiculosByCliente(id),
      ]);
      setCliente(clienteData);
      setVehiculos(vehiculosData);
    } catch (err) {
      const message =
        err instanceof TallerOkApiError
          ? err.message
          : 'No se pudo cargar el cliente.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [id, isTallerOkAuth]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const handleDeleteCliente = () => {
    if (!cliente) return;
    Alert.alert(
      'Eliminar cliente',
      `¿Eliminar a ${cliente.nombre}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCliente(cliente.id);
              router.back();
            } catch (err) {
              const message =
                err instanceof TallerOkApiError
                  ? err.message
                  : 'No se pudo eliminar el cliente.';
              Alert.alert('Error', message);
            }
          },
        },
      ],
    );
  };

  const handleUpdateCliente = async (values: TallerOkCreateClientePayload) => {
    if (!cliente) return;
    setIsSavingCliente(true);
    try {
      const updated = await updateCliente(cliente.id, values);
      setCliente(updated);
      setShowEditCliente(false);
    } catch (err) {
      const message =
        err instanceof TallerOkApiError ? err.message : 'No se pudo guardar el cliente.';
      Alert.alert('Error', message);
      throw err;
    } finally {
      setIsSavingCliente(false);
    }
  };

  const handleCreateVehiculo = async (
    values: Parameters<typeof createVehiculo>[1],
  ) => {
    if (!cliente) return;
    setIsSavingVehiculo(true);
    try {
      const created = await createVehiculo(cliente.id, values);
      setVehiculos((prev) => [...prev, created]);
      setShowNewVehiculo(false);
      router.push(`/(flow)/vehiculo/${created.id}`);
    } catch (err) {
      const message =
        err instanceof TallerOkApiError ? err.message : 'No se pudo crear el vehículo.';
      Alert.alert('Error', message);
      throw err;
    } finally {
      setIsSavingVehiculo(false);
    }
  };

  // En modo real el diagnóstico inicial se carga como parte de una orden.
  // La pantalla diagnostico/[vehiculoId] queda reservada para demo/mock.
  const handleNuevoDiagnostico = (vehiculoId: string) => {
    if (!cliente) return;
    const params = new URLSearchParams({
      clienteId: cliente.id,
      vehiculoId,
    });
    router.push(`/(flow)/orden/nueva?${params.toString()}` as Href);
  };

  if (!isTallerOkAuth) {
    return (
      <Screen title="Cliente">
        <Text style={styles.muted}>Disponible solo con sesión TallerOK.</Text>
      </Screen>
    );
  }

  if (isLoading) {
    return (
      <Screen title="Cargando cliente…">
        <ActivityIndicator color={TalleriaColors.accent} />
      </Screen>
    );
  }

  if (error || !cliente) {
    return (
      <Screen title="Error">
        <Card>
          <Text style={styles.error}>{error ?? 'Cliente no encontrado'}</Text>
        </Card>
        <PrimaryButton title="Volver" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: cliente.nombre }} />
      <Screen subtitle="Ficha del cliente">
        <FlowNavBar
          links={[{ label: 'Volver a Clientes', onPress: () => router.push('/(tabs)/clientes') }]}
        />

        <Card>
          <Text style={styles.nombre}>{cliente.nombre}</Text>
          {cliente.telefono ? <Text style={styles.detalle}>{cliente.telefono}</Text> : null}
          {cliente.email ? <Text style={styles.detalle}>{cliente.email}</Text> : null}
          {cliente.documento ? (
            <Text style={styles.detalle}>Doc: {cliente.documento}</Text>
          ) : null}
          {cliente.direccion ? <Text style={styles.detalle}>{cliente.direccion}</Text> : null}
          {cliente.notas ? <Text style={styles.muted}>{cliente.notas}</Text> : null}
        </Card>

        <View style={styles.actionsRow}>
          <PrimaryButton title="Editar cliente" onPress={() => setShowEditCliente(true)} />
          <Pressable onPress={handleDeleteCliente} style={styles.dangerButton}>
            <Text style={styles.dangerText}>Eliminar</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Vehículos</Text>
        {vehiculos.length === 0 ? (
          <Card>
            <Text style={styles.muted}>
              Primero cargá un vehículo para iniciar un diagnóstico.
            </Text>
          </Card>
        ) : (
          vehiculos.map((v) => (
            <Card key={v.id}>
              <Pressable onPress={() => router.push(`/(flow)/vehiculo/${v.id}`)}>
                <Text style={styles.nombre}>{v.patente}</Text>
                <Text style={styles.detalle}>
                  {v.marca} {v.modelo}
                  {v.anio ? ` · ${v.anio}` : ''}
                </Text>
              </Pressable>
              {vehiculos.length > 1 ? (
                <Pressable
                  onPress={() => handleNuevoDiagnostico(v.id)}
                  style={styles.diagnosticoLink}>
                  <Text style={styles.diagnosticoLinkText}>Iniciar diagnóstico</Text>
                </Pressable>
              ) : null}
            </Card>
          ))
        )}

        {vehiculos.length === 1 ? (
          <PrimaryButton
            title="Nuevo diagnóstico"
            onPress={() => handleNuevoDiagnostico(vehiculos[0].id)}
          />
        ) : vehiculos.length > 1 ? (
          <Card>
            <Text style={styles.muted}>
              Elegí un vehículo y tocá «Iniciar diagnóstico» para comenzar la orden.
            </Text>
          </Card>
        ) : null}

        <PrimaryButton title="Agregar vehículo" onPress={() => setShowNewVehiculo(true)} />

        <ClienteFormModal
          visible={showEditCliente}
          title="Editar cliente"
          initial={cliente}
          isSubmitting={isSavingCliente}
          onClose={() => setShowEditCliente(false)}
          onSubmit={handleUpdateCliente}
        />

        <VehiculoFormModal
          visible={showNewVehiculo}
          title="Nuevo vehículo"
          isSubmitting={isSavingVehiculo}
          onClose={() => setShowNewVehiculo(false)}
          onSubmit={handleCreateVehiculo}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
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
  },
  section: {
    fontSize: 18,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
  actionsRow: {
    gap: 10,
  },
  dangerButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dangerText: {
    color: TalleriaColors.danger,
    fontWeight: '600',
    fontSize: 15,
  },
  diagnosticoLink: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  diagnosticoLinkText: {
    color: TalleriaColors.accent,
    fontWeight: '600',
    fontSize: 14,
  },
});
