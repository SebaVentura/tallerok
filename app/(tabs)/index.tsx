import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/talleria/Badge';
import { Card } from '@/components/talleria/Card';
import { ConnectionBadge } from '@/components/talleria/ConnectionBadge';
import { KpiCard } from '@/components/talleria/KpiCard';
import { PrimaryButton } from '@/components/talleria/PrimaryButton';
import { Screen } from '@/components/talleria/Screen';
import { TalleriaColors } from '@/constants/theme';
import {
  formatMonto,
  getDashboardKpis,
  getTopTrabajosMes,
  getVehiculo,
  historial,
  ordenes,
} from '@/data/mock';
import { useAuth } from '@/hooks/useAuth';
import { useConnectionMode } from '@/hooks/useConnectionMode';
import { useTallerOkAuth } from '@/hooks/useTallerOkAuth';
import { TallerOkApiError } from '@/services/tallerok/tallerokClient';
import { getDashboard } from '@/services/tallerok/tallerokDashboardApi';
import type { TallerOkActividadReciente, TallerOkDashboard } from '@/types/tallerokApi';
import type { EstadoOrden } from '@/types/talleria';

export default function DashboardScreen() {
  const router = useRouter();
  const connectionMode = useConnectionMode();
  const { isAuthenticated: isCrabbAuth, socio, user } = useAuth();
  const {
    isAuthenticated: isTallerOkAuth,
    taller: tallerOk,
    user: tallerOkUser,
    sessionExpired,
    clearSessionExpired,
  } = useTallerOkAuth();

  const [dashboardApi, setDashboardApi] = useState<TallerOkDashboard | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!isTallerOkAuth) {
      setDashboardApi(null);
      setApiError(null);
      return;
    }

    setIsLoadingApi(true);
    setApiError(null);

    try {
      const data = await getDashboard();
      setDashboardApi(data);
    } catch (error) {
      const message =
        error instanceof TallerOkApiError
          ? error.message
          : 'No se pudo cargar el dashboard. Mostrando datos demo.';
      setApiError(message);
      setDashboardApi(null);
    } finally {
      setIsLoadingApi(false);
    }
  }, [isTallerOkAuth]);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  const kpis = getDashboardKpis();
  const topTrabajos = getTopTrabajosMes();
  const recientesDemo = historial
    .slice()
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 4);

  const kpiItemsDemo = [
    { label: 'Facturación del mes', value: formatMonto(kpis.facturacionMes), accent: true },
    { label: 'Ganancia estimada', value: formatMonto(kpis.gananciaEstimada), accent: true },
    { label: 'Vehículos entregados', value: String(kpis.vehiculosEntregados) },
    { label: 'Presupuestos pendientes', value: String(kpis.presupuestosPendientes) },
    { label: 'Adelantos cobrados', value: formatMonto(kpis.adelantosCobrados) },
    { label: 'Ticket promedio', value: formatMonto(kpis.ticketPromedio) },
  ];

  const kpiItemsApi = dashboardApi
    ? [
        { label: 'Clientes', value: String(dashboardApi.clientesTotal) },
        { label: 'Vehículos', value: String(dashboardApi.vehiculosTotal) },
        { label: 'Órdenes activas', value: String(dashboardApi.ordenesActivas), accent: true },
        {
          label: 'Presupuestos pendientes',
          value: String(dashboardApi.presupuestosPendientes),
          accent: true,
        },
      ]
    : [];

  const actividadApi = dashboardApi?.actividadReciente ?? [];

  const handleActividadPress = (item: TallerOkActividadReciente) => {
    if (item.ordenId) {
      router.push(`/(flow)/orden/${item.ordenId}` as const);
      return;
    }
    if (item.vehiculoId) {
      router.push(`/(flow)/vehiculo/${item.vehiculoId}` as const);
    }
  };

  return (
    <Screen title="TallerOK">
      <View style={styles.headerRow}>
        <Text style={styles.subtitleInline}>Panel comercial</Text>
        <ConnectionBadge mode={connectionMode} compact />
      </View>

      {sessionExpired ? (
        <Card>
          <Text style={styles.errorText}>Tu sesión TallerOK expiró. Volvé a iniciar sesión.</Text>
          <PrimaryButton title="Entendido" onPress={clearSessionExpired} />
        </Card>
      ) : null}

      {!isTallerOkAuth && connectionMode === 'demo' ? (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerTitle}>Modo demo activo</Text>
          <Text style={styles.demoBannerText}>
            Estás viendo datos de ejemplo. Conectá tu taller desde la pantalla de inicio o desactivá
            el demo en Estilo.
          </Text>
        </View>
      ) : null}

      {isTallerOkAuth && tallerOk?.nombre ? (
        <Card>
          <Text style={styles.socioSectionLabel}>Conectado a TallerOK</Text>
          <Text style={styles.socioNombre}>Conectado a TallerOK: {tallerOk.nombre}</Text>
          {tallerOkUser?.email ? <Text style={styles.socioDetalle}>{tallerOkUser.email}</Text> : null}
        </Card>
      ) : null}

      {isCrabbAuth && socio ? (
        <Card>
          <Text style={styles.socioSectionLabel}>Socio conectado (CRABB API)</Text>
          <Text style={styles.socioNombre}>
            {socio.denominacion_taller ?? socio.nombre_apellido}
          </Text>
          <Text style={styles.socioDetalle}>
            Nº {socio.nro_socio} · {socio.estado}
            {socio.estado_cuota ? ` · Cuota ${socio.estado_cuota}` : ''}
          </Text>
          {user?.email ? <Text style={styles.socioDetalle}>{user.email}</Text> : null}
        </Card>
      ) : null}

      {isTallerOkAuth ? (
        <>
          {isLoadingApi ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={TalleriaColors.accent} />
              <Text style={styles.loadingText}>Cargando dashboard…</Text>
            </View>
          ) : null}

          {apiError ? (
            <Card>
              <Text style={styles.errorText}>{apiError}</Text>
            </Card>
          ) : null}

          <View style={styles.kpiGrid}>
            {kpiItemsApi.map((item) => (
              <View key={item.label} style={styles.kpiItem}>
                <KpiCard label={item.label} value={item.value} compact accent={item.accent} />
              </View>
            ))}
          </View>

          <Text style={styles.section}>Actividad reciente</Text>
          {actividadApi.length === 0 ? (
            <Card>
              <Text style={styles.muted}>Sin actividad reciente por ahora.</Text>
            </Card>
          ) : (
            actividadApi.map((item) => (
              <Card
                key={item.id}
                onPress={() => handleActividadPress(item)}>
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Text style={styles.cardTitle}>{item.vehiculoPatente ?? '—'}</Text>
                    <Text style={styles.cardSub}>{item.motivo}</Text>
                    <Text style={styles.cardDate}>{item.fecha}</Text>
                  </View>
                  <Badge estado={item.estado as EstadoOrden} />
                </View>
              </Card>
            ))
          )}
        </>
      ) : (
        <>
          <View style={styles.kpiGrid}>
            {kpiItemsDemo.map((item) => (
              <View key={item.label} style={styles.kpiItem}>
                <KpiCard label={item.label} value={item.value} compact accent={item.accent} />
              </View>
            ))}
          </View>

          <View style={styles.opsRow}>
            <View style={styles.opsItem}>
              <KpiCard label="Órdenes activas" value={String(kpis.activas)} compact />
            </View>
            <View style={styles.opsItem}>
              <KpiCard label="En taller" value={String(kpis.enTaller)} compact />
            </View>
          </View>

          <Text style={styles.section}>Top trabajos del mes</Text>
          {topTrabajos.map((trabajo, index) => (
            <Card key={trabajo.id}>
              <View style={styles.topRow}>
                <View style={styles.rank}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.topNombre}>{trabajo.nombre}</Text>
                  <Text style={styles.topGanancia}>Ganancia {formatMonto(trabajo.ganancia)}</Text>
                </View>
              </View>
            </Card>
          ))}

          <Text style={styles.section}>Actividad reciente</Text>
          {recientesDemo.map((item) => {
            const vehiculo = getVehiculo(item.vehiculoId);
            return (
              <Card
                key={item.id}
                onPress={() => {
                  if (item.ordenId) {
                    router.push(`/(flow)/orden/${item.ordenId}` as const);
                  } else {
                    router.push(`/(flow)/vehiculo/${item.vehiculoId}` as const);
                  }
                }}>
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Text style={styles.cardTitle}>{vehiculo?.patente ?? '—'}</Text>
                    <Text style={styles.cardSub}>{item.motivo}</Text>
                    <Text style={styles.cardDate}>{item.fecha}</Text>
                  </View>
                  <Badge estado={item.estado} />
                </View>
              </Card>
            );
          })}
        </>
      )}

      <PrimaryButton title="Ver clientes" onPress={() => router.push('/(tabs)/clientes')} />

      {!isTallerOkAuth && ordenes[0] ? (
        <PrimaryButton
          title={`Orden activa: ${ordenes[0].numero}`}
          onPress={() => router.push(`/(flow)/orden/${ordenes[0].id}` as const)}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: -8,
  },
  subtitleInline: {
    flex: 1,
    fontSize: 15,
    color: TalleriaColors.textMuted,
  },
  socioSectionLabel: {
    fontSize: 12,
    color: TalleriaColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  socioNombre: {
    fontSize: 18,
    fontWeight: '700',
    color: TalleriaColors.text,
  },
  socioDetalle: {
    fontSize: 14,
    color: TalleriaColors.textMuted,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: TalleriaColors.textMuted,
  },
  errorText: {
    fontSize: 14,
    color: TalleriaColors.danger,
    lineHeight: 20,
  },
  demoBanner: {
    backgroundColor: `${TalleriaColors.warning}18`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${TalleriaColors.warning}44`,
    padding: 14,
    gap: 4,
  },
  demoBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TalleriaColors.warning,
  },
  demoBannerText: {
    fontSize: 13,
    color: TalleriaColors.textMuted,
    lineHeight: 18,
  },
  muted: {
    fontSize: 14,
    color: TalleriaColors.textMuted,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiItem: {
    width: '47%',
    flexGrow: 1,
  },
  opsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  opsItem: {
    flex: 1,
  },
  section: {
    fontSize: 18,
    fontWeight: '600',
    color: TalleriaColors.text,
    marginTop: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TalleriaColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  topNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
  topGanancia: {
    fontSize: 14,
    color: TalleriaColors.success,
    fontWeight: '600',
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
  cardSub: {
    fontSize: 14,
    color: TalleriaColors.textMuted,
  },
  cardDate: {
    fontSize: 12,
    color: TalleriaColors.textMuted,
  },
});
