import { StyleSheet, Text, View } from 'react-native';

import { TalleriaColors } from '@/constants/theme';
import type { TallerOkOrdenEstado } from '@/types/tallerokApi';

const labels: Record<TallerOkOrdenEstado, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  esperando_repuesto: 'Esperando repuesto',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

const colors: Record<TallerOkOrdenEstado, string> = {
  pendiente: TalleriaColors.warning,
  en_proceso: TalleriaColors.accent,
  esperando_repuesto: '#a78bfa',
  listo: TalleriaColors.success,
  entregado: TalleriaColors.textMuted,
  cancelado: TalleriaColors.danger,
};

type OrdenEstadoBadgeProps = {
  estado: TallerOkOrdenEstado | string;
};

export function OrdenEstadoBadge({ estado }: OrdenEstadoBadgeProps) {
  const key = (estado in labels ? estado : 'pendiente') as TallerOkOrdenEstado;
  const label = labels[key] ?? String(estado);
  const color = colors[key] ?? TalleriaColors.textMuted;

  return (
    <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

export const ORDEN_ESTADOS_OPTIONS: TallerOkOrdenEstado[] = [
  'pendiente',
  'en_proceso',
  'esperando_repuesto',
  'listo',
  'entregado',
  'cancelado',
];

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
