import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

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

export default function DashboardScreen() {
  const router = useRouter();
  const { connectionMode, isAuthenticated, socio, user } = useAuth();
  const kpis = getDashboardKpis();
  const topTrabajos = getTopTrabajosMes();
  const recientes = historial
    .slice()
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 4);

  const kpiItems = [
    { label: 'Facturación del mes', value: formatMonto(kpis.facturacionMes), accent: true },
    { label: 'Ganancia estimada', value: formatMonto(kpis.gananciaEstimada), accent: true },
    { label: 'Vehículos entregados', value: String(kpis.vehiculosEntregados) },
    { label: 'Presupuestos pendientes', value: String(kpis.presupuestosPendientes) },
    { label: 'Adelantos cobrados', value: formatMonto(kpis.adelantosCobrados) },
    { label: 'Ticket promedio', value: formatMonto(kpis.ticketPromedio) },
  ];

  return (
    <Screen title="TallerOK">
      <View style={styles.headerRow}>
        <Text style={styles.subtitleInline}>Panel comercial</Text>
        <ConnectionBadge mode={connectionMode} compact />
      </View>

      {isAuthenticated && socio ? (
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

      <View style={styles.kpiGrid}>
        {kpiItems.map((item) => (
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
      {recientes.map((item) => {
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

      <PrimaryButton title="Ver clientes" onPress={() => router.push('/(tabs)/clientes')} />

      {ordenes[0] ? (
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
