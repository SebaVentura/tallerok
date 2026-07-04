import { Redirect } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TallerOkAuthSection } from '@/components/talleria/TallerOkAuthSection';
import { TalleriaColors } from '@/constants/theme';
import { useTallerOkAuth } from '@/hooks/useTallerOkAuth';

export default function WelcomeScreen() {
  const { isLoading, isAuthenticated, isDemoMode } = useTallerOkAuth();

  const shouldEnterApp = isAuthenticated || isDemoMode;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color={TalleriaColors.accent} size="large" />
          <Text style={styles.loadingText}>Cargando TallerOK…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (shouldEnterApp) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.title}>TallerOK</Text>
          <Text style={styles.subtitle}>Gestión inteligente para talleres</Text>
        </View>

        <TallerOkAuthSection variant="welcome" />
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 24,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: TalleriaColors.accent,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: TalleriaColors.textMuted,
    textAlign: 'center',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: TalleriaColors.textMuted,
  },
});
