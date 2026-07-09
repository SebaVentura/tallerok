import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/talleria/Card';
import { ConnectionBadge } from '@/components/talleria/ConnectionBadge';
import { OrdenEstadoBadge } from '@/components/talleria/OrdenEstadoBadge';
import { TalleriaColors } from '@/constants/theme';
import {
  getClienteByVehiculo,
  getVehiculo,
  historial,
  ordenes as mockOrdenes,
} from '@/data/mock';
import { useConnectionMode } from '@/hooks/useConnectionMode';
import { useTallerOkAuth } from '@/hooks/useTallerOkAuth';
import { TallerOkApiError } from '@/services/tallerok/tallerokClient';
import { listTallerOkOrdenes } from '@/services/tallerok/tallerokOrdenesApi';
import type { TallerOkOrden, TallerOkOrdenEstado } from '@/types/tallerokApi';
import type { EstadoOrden } from '@/types/talleria';

type EstadoFiltro = 'todas' | TallerOkOrdenEstado;

const ESTADO_FILTROS: { id: EstadoFiltro; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'pendiente', label: 'Pendiente' },
  { id: 'en_proceso', label: 'En proceso' },
  { id: 'esperando_repuesto', label: 'Esperando repuesto' },
  { id: 'listo', label: 'Listo' },
  { id: 'entregado', label: 'Entregado' },
  { id: 'cancelado', label: 'Cancelado' },
];

function mapDemoEstadoToApi(estado: EstadoOrden): TallerOkOrdenEstado {
  if (estado === 'en_taller') return 'en_proceso';
  if (estado === 'presupuestado') return 'esperando_repuesto';
  if (estado === 'pendiente') return 'pendiente';
  if (estado === 'listo') return 'listo';
  if (estado === 'entregado') return 'entregado';
  return 'pendiente';
}

function buildDemoOrdenes(): TallerOkOrden[] {
  return mockOrdenes.map((orden) => {
    const vehiculo = getVehiculo(orden.vehiculoId);
    const cliente = vehiculo ? getClienteByVehiculo(vehiculo.id) : undefined;
    const historialItem = historial.find((h) => h.ordenId === orden.id);
    return {
      id: orden.id,
      numero: orden.numero,
      vehiculoId: orden.vehiculoId,
      clienteId: vehiculo?.clienteId ?? null,
      estado: mapDemoEstadoToApi(orden.estado),
      motivoIngreso: historialItem?.motivo ?? 'Orden de trabajo demo',
      kilometrajeIngreso: vehiculo?.km ?? null,
      diagnosticoNotas: null,
      tareas: orden.tareas.map((descripcion, index) => ({
        id: `demo-tarea-${index}`,
        descripcion,
        realizada: false,
      })),
      fechaIngreso: historialItem?.fecha ?? null,
      vehiculo: vehiculo
        ? {
            id: vehiculo.id,
            clienteId: vehiculo.clienteId,
            patente: vehiculo.patente,
            marca: vehiculo.marca,
            modelo: vehiculo.modelo,
            anio: vehiculo.anio,
            km: vehiculo.km,
          }
        : undefined,
      cliente: cliente
        ? {
            id: cliente.id,
            nombre: cliente.nombre,
            telefono: cliente.telefono,
            email: cliente.email,
          }
        : undefined,
    };
  });
}

function filterOrdenesLocal(list: TallerOkOrden[], q: string, estado: EstadoFiltro): TallerOkOrden[] {
  let result = list;

  if (estado !== 'todas') {
    result = result.filter((o) => o.estado === estado);
  }

  const term = q.trim().toLowerCase();
  if (!term) return result;

  return result.filter((orden) => {
    const haystack = [
      orden.numero,
      orden.motivoIngreso,
      orden.cliente?.nombre,
      orden.vehiculo?.patente,
      orden.vehiculo?.marca,
      orden.vehiculo?.modelo,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(term);
  });
}

function formatFecha(fecha?: string | null): string | null {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function OrdenCard({ orden, onPress }: { orden: TallerOkOrden; onPress: () => void }) {
  const titulo = orden.numero ?? `Orden ${orden.id.slice(-6)}`;
  const patente = orden.vehiculo?.patente;
  const vehiculoDesc = orden.vehiculo
    ? `${orden.vehiculo.marca} ${orden.vehiculo.modelo}`.trim()
    : null;
  const fecha = formatFecha(orden.fechaIngreso ?? orden.createdAt);

  return (
    <Card onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{titulo}</Text>
        <OrdenEstadoBadge estado={orden.estado} />
      </View>
      <Text style={styles.motivo}>{orden.motivoIngreso || '—'}</Text>
      {orden.cliente?.nombre ? (
        <Text style={styles.detalle}>Cliente: {orden.cliente.nombre}</Text>
      ) : null}
      {patente ? (
        <Text style={styles.detalle}>
          {patente}
          {vehiculoDesc ? ` · ${vehiculoDesc}` : ''}
        </Text>
      ) : null}
      <View style={styles.metaRow}>
        {fecha ? <Text style={styles.meta}>{fecha}</Text> : null}
        {orden.kilometrajeIngreso != null ? (
          <Text style={styles.meta}>
            {orden.kilometrajeIngreso.toLocaleString('es-AR')} km
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

export default function OrdenesScreen() {
  const router = useRouter();
  const connectionMode = useConnectionMode();
  const { isAuthenticated: isTallerOkAuth } = useTallerOkAuth();

  const [ordenesApi, setOrdenesApi] = useState<TallerOkOrden[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('todas');

  const loadOrdenes = useCallback(
    async (refresh = false) => {
      if (!isTallerOkAuth) {
        setOrdenesApi([]);
        setError(null);
        return;
      }

      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const params = estadoFiltro !== 'todas' ? { estado: estadoFiltro } : undefined;
        const data = await listTallerOkOrdenes(params);
        setOrdenesApi(data);
      } catch (err) {
        const message =
          err instanceof TallerOkApiError
            ? err.message
            : 'No se pudieron cargar las órdenes. Verificá que el endpoint esté disponible.';
        setError(message);
        setOrdenesApi([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isTallerOkAuth, estadoFiltro],
  );

  useFocusEffect(
    useCallback(() => {
      void loadOrdenes();
    }, [loadOrdenes]),
  );

  useEffect(() => {
    if (isTallerOkAuth) {
      void loadOrdenes();
    }
  }, [estadoFiltro, isTallerOkAuth]);

  const demoOrdenes = useMemo(() => buildDemoOrdenes(), []);

  const ordenesBase = isTallerOkAuth ? ordenesApi : demoOrdenes;
  const ordenesFiltradas = useMemo(
    () => filterOrdenesLocal(ordenesBase, searchQ, estadoFiltro),
    [ordenesBase, searchQ, estadoFiltro],
  );

  const subtitle = isTallerOkAuth
    ? 'Órdenes del taller conectado'
    : 'Modo demo — datos de ejemplo';

  const handleRefresh = () => {
    if (isTallerOkAuth) {
      void loadOrdenes(true);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          isTallerOkAuth ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={TalleriaColors.accent}
              colors={[TalleriaColors.accent]}
            />
          ) : undefined
        }>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Órdenes</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <ConnectionBadge mode={connectionMode} compact />
          </View>

          {!isTallerOkAuth ? (
            <View style={styles.demoBanner}>
              <Text style={styles.demoBannerText}>
                Estás en modo demo. Conectá tu taller para ver órdenes reales.
              </Text>
            </View>
          ) : null}

          <TextInput
            style={styles.searchInput}
            value={searchQ}
            onChangeText={setSearchQ}
            placeholder="Buscar por número, motivo, cliente o patente"
            placeholderTextColor={TalleriaColors.textMuted}
            autoCapitalize="none"
            returnKeyType="search"
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}>
            {ESTADO_FILTROS.map((filtro) => {
              const active = estadoFiltro === filtro.id;
              return (
                <Pressable
                  key={filtro.id}
                  onPress={() => setEstadoFiltro(filtro.id)}
                  style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {filtro.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {isLoading ? (
            <View style={styles.centerRow}>
              <ActivityIndicator color={TalleriaColors.accent} />
              <Text style={styles.muted}>Cargando órdenes…</Text>
            </View>
          ) : null}

          {error ? (
            <Card>
              <Text style={styles.error}>{error}</Text>
            </Card>
          ) : null}

          {!isLoading && !error && ordenesBase.length === 0 ? (
            <Card>
              <Text style={styles.emptyTitle}>Sin órdenes</Text>
              <Text style={styles.muted}>
                {isTallerOkAuth
                  ? 'Todavía no hay órdenes registradas. Creá una desde la ficha de un vehículo.'
                  : 'No hay órdenes demo para mostrar.'}
              </Text>
            </Card>
          ) : null}

          {!isLoading && !error && ordenesBase.length > 0 && ordenesFiltradas.length === 0 ? (
            <Card>
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.muted}>
                No encontramos órdenes con esos criterios. Probá otro término o filtro.
              </Text>
            </Card>
          ) : null}

          {ordenesFiltradas.map((orden) => (
            <OrdenCard
              key={orden.id}
              orden={orden}
              onPress={() => router.push(`/(flow)/orden/${orden.id}` as const)}
            />
          ))}
        </View>
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
    paddingBottom: 24,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: TalleriaColors.text,
  },
  subtitle: {
    fontSize: 15,
    color: TalleriaColors.textMuted,
  },
  demoBanner: {
    backgroundColor: `${TalleriaColors.warning}18`,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${TalleriaColors.warning}44`,
    padding: 12,
  },
  demoBannerText: {
    fontSize: 13,
    color: TalleriaColors.textMuted,
    lineHeight: 18,
  },
  searchInput: {
    fontSize: 15,
    color: TalleriaColors.text,
    backgroundColor: TalleriaColors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    borderColor: TalleriaColors.accent,
    backgroundColor: `${TalleriaColors.accent}18`,
  },
  chipText: {
    fontSize: 13,
    color: TalleriaColors.textMuted,
    fontWeight: '600',
  },
  chipTextActive: {
    color: TalleriaColors.accent,
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
  motivo: {
    fontSize: 15,
    color: TalleriaColors.text,
    lineHeight: 21,
  },
  detalle: {
    fontSize: 14,
    color: TalleriaColors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 2,
  },
  meta: {
    fontSize: 12,
    color: TalleriaColors.textMuted,
  },
  muted: {
    fontSize: 14,
    color: TalleriaColors.textMuted,
    lineHeight: 20,
  },
  error: {
    fontSize: 14,
    color: TalleriaColors.danger,
    lineHeight: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TalleriaColors.text,
    marginBottom: 4,
  },
});
