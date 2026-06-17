import { Pressable, StyleSheet, Text } from 'react-native';

import { TalleriaColors } from '@/constants/theme';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export function PrimaryButton({ title, onPress, disabled }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: TalleriaColors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  pressed: {
    backgroundColor: TalleriaColors.accentMuted,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
