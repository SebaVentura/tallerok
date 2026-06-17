import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TalleriaColors } from '@/constants/theme';

type ScreenProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
};

export function Screen({ title, subtitle, children, scroll = true }: ScreenProps) {
  const content = (
    <View style={styles.content}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: TalleriaColors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: TalleriaColors.text,
  },
  subtitle: {
    fontSize: 15,
    color: TalleriaColors.textMuted,
    marginTop: -8,
  },
});
