import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TalleriaColors } from '@/constants/theme';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
};

export function Card({ children, onPress }: CardProps) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }

  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: TalleriaColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
    padding: 16,
    gap: 8,
  },
  pressed: {
    opacity: 0.85,
  },
});
