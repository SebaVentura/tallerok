import { StyleSheet, Text, View } from 'react-native';

import { TalleriaColors } from '@/constants/theme';
import type { ConnectionMode } from '@/context/AuthContext';

type ConnectionBadgeProps = {
  mode: ConnectionMode;
  compact?: boolean;
};

const LABELS: Record<ConnectionMode, { text: string; color: string; bg: string }> = {
  loading: {
    text: 'Conectando…',
    color: TalleriaColors.textMuted,
    bg: `${TalleriaColors.textMuted}22`,
  },
  connected: {
    text: 'Conectado a CRABB',
    color: TalleriaColors.success,
    bg: `${TalleriaColors.success}22`,
  },
  demo: {
    text: 'Modo demo',
    color: TalleriaColors.warning,
    bg: `${TalleriaColors.warning}22`,
  },
};

export function ConnectionBadge({ mode, compact }: ConnectionBadgeProps) {
  const style = LABELS[mode];

  return (
    <View style={[styles.badge, { backgroundColor: style.bg }, compact && styles.compact]}>
      <View style={[styles.dot, { backgroundColor: style.color }]} />
      <Text style={[styles.text, { color: style.color }, compact && styles.textCompact]}>
        {style.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  compact: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  textCompact: {
    fontSize: 12,
  },
});
