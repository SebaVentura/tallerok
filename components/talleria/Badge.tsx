import { StyleSheet, Text, View } from 'react-native';

import { TalleriaColors } from '@/constants/theme';
import type { EstadoOrden } from '@/types/talleria';

const labels: Record<EstadoOrden, string> = {
  pendiente: 'Pendiente',
  en_taller: 'En taller',
  presupuestado: 'Presupuestado',
  listo: 'Listo',
  entregado: 'Entregado',
};

const colors: Record<EstadoOrden, string> = {
  pendiente: TalleriaColors.warning,
  en_taller: TalleriaColors.accent,
  presupuestado: '#a78bfa',
  listo: TalleriaColors.success,
  entregado: TalleriaColors.textMuted,
};

type BadgeProps = {
  estado: EstadoOrden;
};

export function Badge({ estado }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: `${colors[estado]}22` }]}>
      <Text style={[styles.text, { color: colors[estado] }]}>{labels[estado]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
