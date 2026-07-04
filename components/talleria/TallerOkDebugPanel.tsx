import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/talleria/Card';
import { PrimaryButton } from '@/components/talleria/PrimaryButton';
import { TalleriaColors } from '@/constants/theme';
import { env } from '@/config/env';
import { isTallerOkApiConfigured, TALLEROK_API_URL } from '@/config/tallerokEnv';
import { useTallerOkAuth } from '@/hooks/useTallerOkAuth';
import { checkHealth } from '@/services/tallerok/tallerokHealthApi';
import {
  getTallerOkApiLogSummary,
  subscribeTallerOkApiLog,
  type TallerOkApiLogSummary,
} from '@/services/tallerok/tallerokApiLogger';
import { TallerOkApiError } from '@/services/tallerok/tallerokClient';

type TallerOkDebugPanelProps = {
  connectionMode: 'demo' | 'tallerok_connected' | 'crabb_connected' | 'loading';
};

function getConnectionStatusLabel(
  mode: TallerOkDebugPanelProps['connectionMode'],
  isAuthenticated: boolean,
  lastStatus: number | null,
): string {
  if (mode === 'loading') return 'Verificando…';
  if (isAuthenticated) return 'Conectado';
  if (lastStatus != null && lastStatus >= 200 && lastStatus < 300) return 'API disponible (sin sesión)';
  if (lastStatus === 401) return 'Sin sesión';
  if (lastStatus === 0) return 'Error de red';
  if (lastStatus != null && lastStatus >= 400) return 'Error';
  return 'Sin sesión';
}

export function TallerOkDebugPanel({ connectionMode }: TallerOkDebugPanelProps) {
  const { isAuthenticated, refreshMe, logout } = useTallerOkAuth();
  const [logSummary, setLogSummary] = useState<TallerOkApiLogSummary>(() =>
    getTallerOkApiLogSummary(),
  );
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingMe, setIsTestingMe] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  useEffect(() => subscribeTallerOkApiLog(setLogSummary), []);

  const handleTestConnection = useCallback(async () => {
    setTestMessage(null);
    setIsTestingConnection(true);
    try {
      const result = await checkHealth();
      setTestMessage(
        result.ok
          ? 'Conexión OK — la API respondió correctamente.'
          : 'La API no respondió como se esperaba. Revisá la URL base.',
      );
    } catch (error) {
      const message =
        error instanceof TallerOkApiError
          ? error.message
          : 'No se pudo conectar con la API.';
      setTestMessage(message);
    } finally {
      setIsTestingConnection(false);
    }
  }, []);

  const handleTestMe = useCallback(async () => {
    setTestMessage(null);
    setIsTestingMe(true);
    try {
      await refreshMe();
      setTestMessage('GET /me ejecutado correctamente.');
    } catch (error) {
      const message =
        error instanceof TallerOkApiError
          ? error.message
          : 'No se pudo obtener el perfil.';
      setTestMessage(message);
    } finally {
      setIsTestingMe(false);
    }
  }, [refreshMe]);

  const handleClearSession = useCallback(async () => {
    setTestMessage(null);
    await logout();
    setTestMessage('Sesión TallerOK eliminada.');
  }, [logout]);

  if (!env.isDevelopment) {
    return null;
  }

  const statusLabel = getConnectionStatusLabel(
    connectionMode,
    isAuthenticated,
    logSummary.lastStatus,
  );

  return (
    <Card>
      <Text style={styles.sectionTitle}>Debug API TallerOK</Text>
      <Text style={styles.label}>API URL</Text>
      <Text style={styles.valueMono}>{TALLEROK_API_URL}</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Env configurado</Text>
        <Text style={styles.value}>{isTallerOkApiConfigured ? 'Sí' : 'No'}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Estado</Text>
        <Text style={styles.value}>{statusLabel}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Modo actual</Text>
        <Text style={styles.value}>{connectionMode}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Último status</Text>
        <Text style={styles.value}>
          {logSummary.lastStatus != null ? String(logSummary.lastStatus) : '—'}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Último endpoint</Text>
        <Text style={styles.valueMono}>{logSummary.lastEndpoint ?? '—'}</Text>
      </View>
      {logSummary.lastError ? (
        <Text style={styles.error}>{logSummary.lastError}</Text>
      ) : null}
      {logSummary.lastCheckAt ? (
        <Text style={styles.muted}>Última prueba: {logSummary.lastCheckAt}</Text>
      ) : null}
      {testMessage ? <Text style={styles.success}>{testMessage}</Text> : null}

      <View style={styles.actions}>
        <PrimaryButton
          title={isTestingConnection ? 'Probando…' : 'Probar conexión'}
          onPress={handleTestConnection}
          disabled={isTestingConnection}
        />
        <PrimaryButton
          title={isTestingMe ? 'Probando /me…' : 'Probar /me'}
          onPress={handleTestMe}
          disabled={!isAuthenticated || isTestingMe}
        />
        <PrimaryButton
          title="Limpiar sesión TallerOK"
          onPress={handleClearSession}
          disabled={!isAuthenticated}
        />
      </View>

      {(isTestingConnection || isTestingMe) && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={TalleriaColors.accent} size="small" />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TalleriaColors.text,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: TalleriaColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 14,
    color: TalleriaColors.text,
    fontWeight: '500',
  },
  valueMono: {
    fontSize: 13,
    color: TalleriaColors.text,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  muted: {
    fontSize: 12,
    color: TalleriaColors.textMuted,
    marginTop: 4,
  },
  error: {
    fontSize: 13,
    color: TalleriaColors.danger,
    marginTop: 8,
    lineHeight: 18,
  },
  success: {
    fontSize: 13,
    color: TalleriaColors.success,
    marginTop: 8,
    lineHeight: 18,
  },
  actions: {
    gap: 10,
    marginTop: 12,
  },
  loadingRow: {
    alignItems: 'center',
    marginTop: 4,
  },
});
