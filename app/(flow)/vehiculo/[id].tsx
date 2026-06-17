import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/talleria/Badge';
import { Card } from '@/components/talleria/Card';
import { FlowNavBar } from '@/components/talleria/FlowNavBar';
import { PrimaryButton } from '@/components/talleria/PrimaryButton';
import { Screen } from '@/components/talleria/Screen';
import { TalleriaColors } from '@/constants/theme';
import {
  getClienteByVehiculo,
  getHistorialVehiculo,
  getOrdenByVehiculo,
  getVehiculo,
} from '@/data/mock';

export default function VehiculoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const vehiculo = getVehiculo(id ?? '');
  const cliente = vehiculo ? getClienteByVehiculo(vehiculo.id) : undefined;
  const historialItems = vehiculo ? getHistorialVehiculo(vehiculo.id) : [];
  const orden = vehiculo ? getOrdenByVehiculo(vehiculo.id) : undefined;

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
            {
              label: 'Nuevo diagnóstico',
              onPress: () => router.push(`/(flow)/diagnostico/${vehiculo.id}`),
            },
          ]}
        />
        <Card>
          <Text style={styles.label}>Cliente</Text>
          <Text style={styles.value}>{cliente?.nombre}</Text>
          <Text style={styles.muted}>{cliente?.telefono}</Text>
        </Card>

        <Card>
          <Text style={styles.label}>Kilometraje</Text>
          <Text style={styles.value}>{vehiculo.km.toLocaleString('es-AR')} km</Text>
        </Card>

        <Text style={styles.section}>Historial</Text>
        {historialItems.map((item) => (
          <Card key={item.id}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.value}>{item.motivo}</Text>
                <Text style={styles.muted}>{item.fecha}</Text>
              </View>
              <Badge estado={item.estado} />
            </View>
          </Card>
        ))}

        <PrimaryButton
          title="Diagnóstico IA"
          onPress={() => router.push(`/(flow)/diagnostico/${vehiculo.id}`)}
        />

        {orden ? (
          <PrimaryButton
            title={`Ver orden ${orden.numero}`}
            onPress={() => router.push(`/(flow)/orden/${orden.id}`)}
          />
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
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
  section: {
    fontSize: 18,
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
    gap: 2,
  },
});
