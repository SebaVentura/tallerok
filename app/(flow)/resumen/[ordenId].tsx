import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/talleria/Card';
import { KpiCard } from '@/components/talleria/KpiCard';
import { PrimaryButton } from '@/components/talleria/PrimaryButton';
import { Screen } from '@/components/talleria/Screen';
import { TalleriaColors } from '@/constants/theme';
import { formatMonto, getOrden, getResumenByOrden } from '@/data/mock';

function BarChartRow({
  label,
  blocks,
  color,
}: {
  label: string;
  blocks: number;
  color: string;
}) {
  return (
    <View style={styles.chartRow}>
      <Text style={styles.chartLabel}>{label}</Text>
      <View style={styles.chartBars}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.chartBlock,
              i < blocks ? { backgroundColor: color } : styles.chartBlockEmpty,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export default function ResumenScreen() {
  const { ordenId } = useLocalSearchParams<{ ordenId: string }>();
  const router = useRouter();
  const orden = getOrden(ordenId ?? '');
  const resumen = getResumenByOrden(ordenId ?? '');

  if (!orden || !resumen) {
    return (
      <Screen title="Resumen no disponible">
        <PrimaryButton title="Volver" onPress={() => router.back()} />
      </Screen>
    );
  }

  const maxValor = Math.max(resumen.total, resumen.gananciaEstimada, resumen.totalRepuestos, 1);
  const facturacionBlocks = 10;
  const gananciaBlocks = Math.max(1, Math.round((resumen.gananciaEstimada / maxValor) * 10));
  const repuestosBlocks = Math.max(1, Math.round((resumen.totalRepuestos / maxValor) * 10));

  return (
    <>
      <Stack.Screen options={{ title: 'Resumen económico' }} />
      <Screen subtitle={`Paso 4 · ${orden.numero}`}>
        <View style={styles.kpiRow}>
          <View style={styles.kpiItem}>
            <KpiCard label="Total" value={formatMonto(resumen.total)} compact />
          </View>
          <View style={styles.kpiItem}>
            <KpiCard label="Saldo" value={formatMonto(resumen.saldo)} compact />
          </View>
        </View>

        <Card>
          <Text style={styles.label}>Desglose económico</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total cobrado</Text>
            <Text style={styles.metricValue}>{formatMonto(resumen.totalCobrado)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total repuestos</Text>
            <Text style={styles.metricValue}>{formatMonto(resumen.totalRepuestos)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total mano de obra</Text>
            <Text style={styles.metricValue}>{formatMonto(resumen.totalManoObra)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricRow}>
            <Text style={styles.metricLabelHighlight}>Ganancia estimada</Text>
            <Text style={styles.metricValueAccent}>{formatMonto(resumen.gananciaEstimada)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Margen promedio</Text>
            <Text style={styles.metricValue}>{resumen.margenPromedio}%</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.label}>Distribución visual</Text>
          <BarChartRow label="Facturación" blocks={facturacionBlocks} color={TalleriaColors.accent} />
          <BarChartRow label="Ganancia" blocks={gananciaBlocks} color={TalleriaColors.success} />
          <BarChartRow label="Repuestos" blocks={repuestosBlocks} color={TalleriaColors.warning} />
        </Card>

        <Card>
          <Text style={styles.label}>Adelanto cobrado</Text>
          <Text style={styles.adelanto}>{formatMonto(resumen.adelanto)}</Text>
        </Card>

        <Text style={styles.section}>Timeline de pagos</Text>
        {resumen.pagos.length === 0 ? (
          <Card>
            <Text style={styles.muted}>Sin pagos registrados aún.</Text>
          </Card>
        ) : (
          resumen.pagos.map((pago) => (
            <Card key={`${pago.fecha}-${pago.concepto}`}>
              <View style={styles.pagoRow}>
                <View style={styles.flex}>
                  <Text style={styles.pagoConcepto}>{pago.concepto}</Text>
                  <Text style={styles.muted}>{pago.fecha}</Text>
                </View>
                <Text style={styles.pagoMonto}>{formatMonto(pago.monto)}</Text>
              </View>
            </Card>
          ))
        )}

        <PrimaryButton title="Volver al Dashboard" onPress={() => router.replace('/(tabs)')} />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  kpiItem: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: TalleriaColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  metricLabel: {
    fontSize: 14,
    color: TalleriaColors.textMuted,
  },
  metricLabelHighlight: {
    fontSize: 14,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
  metricValueAccent: {
    fontSize: 16,
    fontWeight: '700',
    color: TalleriaColors.success,
  },
  divider: {
    height: 1,
    backgroundColor: TalleriaColors.border,
    marginVertical: 6,
  },
  chartRow: {
    gap: 6,
    marginBottom: 12,
  },
  chartLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
  chartBars: {
    flexDirection: 'row',
    gap: 4,
  },
  chartBlock: {
    flex: 1,
    height: 14,
    borderRadius: 3,
  },
  chartBlockEmpty: {
    backgroundColor: TalleriaColors.border,
  },
  adelanto: {
    fontSize: 22,
    fontWeight: '700',
    color: TalleriaColors.success,
    marginTop: 4,
  },
  section: {
    fontSize: 18,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
  muted: {
    fontSize: 14,
    color: TalleriaColors.textMuted,
  },
  pagoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  pagoConcepto: {
    fontSize: 15,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
  pagoMonto: {
    fontSize: 16,
    fontWeight: '700',
    color: TalleriaColors.text,
  },
});
