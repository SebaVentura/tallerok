import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/talleria/Card';
import { Screen } from '@/components/talleria/Screen';
import { TalleriaColors } from '@/constants/theme';
import { clientes, getVehiculosByCliente } from '@/data/mock';

export default function ClientesScreen() {
  const router = useRouter();

  return (
    <Screen title="Clientes" subtitle="Seleccioná un cliente para ver sus vehículos">
      {clientes.map((cliente) => {
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
  nombre: {
    fontSize: 17,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
  detalle: {
    fontSize: 14,
    color: TalleriaColors.textMuted,
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
