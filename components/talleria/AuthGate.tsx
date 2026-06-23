import { useRouter } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { TalleriaColors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useTallerOkAuth } from '@/hooks/useTallerOkAuth';

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const { isRestoring, connectionMode: crabbMode } = useAuth();
  const { isLoading, isAuthenticated, isDemoMode } = useTallerOkAuth();

  const isCrabbConnected = crabbMode === 'crabb_connected';
  const isBootstrapping = isLoading || isRestoring;
  const canAccess = isAuthenticated || isDemoMode || isCrabbConnected;

  useEffect(() => {
    if (isBootstrapping) return;
    if (!canAccess) {
      router.replace('/');
    }
  }, [canAccess, isBootstrapping, router]);

  if (isBootstrapping) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={TalleriaColors.accent} size="large" />
        <Text style={styles.text}>Cargando TallerOK…</Text>
      </View>
    );
  }

  if (!canAccess) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={TalleriaColors.accent} size="large" />
        <Text style={styles.text}>Redirigiendo…</Text>
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: TalleriaColors.background,
  },
  text: {
    fontSize: 14,
    color: TalleriaColors.textMuted,
  },
});
