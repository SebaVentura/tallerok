import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/talleria/Card';
import { TalleriaColors } from '@/constants/theme';

type KpiCardProps = {
  label: string;
  value: string;
  compact?: boolean;
  accent?: boolean;
};

export function KpiCard({ label, value, compact, accent }: KpiCardProps) {
  return (
    <Card>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, compact && styles.valueCompact, accent && styles.valueAccent]}>
        {value}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    color: TalleriaColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: TalleriaColors.text,
  },
  valueCompact: {
    fontSize: 18,
    lineHeight: 24,
  },
  valueAccent: {
    color: TalleriaColors.accent,
  },
});
