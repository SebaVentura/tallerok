import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TalleriaColors } from '@/constants/theme';

export type FlowNavLink = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

type FlowNavBarProps = {
  onBack?: () => void;
  links?: FlowNavLink[];
};

export function FlowNavBar({ onBack, links = [] }: FlowNavBarProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable
          onPress={onBack ?? (() => router.back())}
          style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}>
          <Text style={styles.navBtnText}>← Volver</Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}>
          <Text style={styles.navBtnText}>Dashboard</Text>
        </Pressable>
      </View>

      {links.length > 0 ? (
        <View style={styles.linksRow}>
          {links.map((link) => (
            <Pressable
              key={link.label}
              onPress={link.onPress}
              disabled={link.disabled}
              style={({ pressed }) => [
                styles.linkBtn,
                link.disabled && styles.linkBtnDisabled,
                pressed && !link.disabled && styles.linkBtnPressed,
              ]}>
              <Text style={[styles.linkBtnText, link.disabled && styles.linkBtnTextDisabled]}>
                {link.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  navBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
    backgroundColor: TalleriaColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  navBtnPressed: {
    backgroundColor: TalleriaColors.surfaceElevated,
  },
  navBtnText: {
    color: TalleriaColors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  linksRow: {
    gap: 8,
  },
  linkBtn: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${TalleriaColors.accent}66`,
    backgroundColor: `${TalleriaColors.accent}18`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  linkBtnPressed: {
    backgroundColor: `${TalleriaColors.accent}33`,
  },
  linkBtnDisabled: {
    opacity: 0.45,
  },
  linkBtnText: {
    color: TalleriaColors.accent,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  linkBtnTextDisabled: {
    color: TalleriaColors.textMuted,
  },
});
