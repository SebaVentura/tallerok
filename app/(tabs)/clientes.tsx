import { useFocusEffect } from '@react-navigation/native';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ConnectionBadge } from '@/components/talleria/ConnectionBadge';
import { Card } from '@/components/talleria/Card';
import { ClienteFormModal } from '@/components/talleria/ClienteFormModal';
import { PrimaryButton } from '@/components/talleria/PrimaryButton';
import { Screen } from '@/components/talleria/Screen';
import { TalleriaColors } from '@/constants/theme';
import { clientes as mockClientes, getVehiculosByCliente } from '@/data/mock';
import { useConnectionMode } from '@/hooks/useConnectionMode';
import { useTallerOkAuth } from '@/hooks/useTallerOkAuth';
import {
  filterClientes,
  type ClientesSearchFilters,
} from '@/services/tallerok/tallerokClientesFilter';
import { mapTallerOkClienteToCliente } from '@/services/tallerok/tallerokMappers';
import { TallerOkApiError } from '@/services/tallerok/tallerokClient';
import { listClientes, createCliente } from '@/services/tallerok/tallerokClientesApi';
import { listVehiculosByCliente } from '@/services/tallerok/tallerokVehiculosApi';
import type { Cliente } from '@/types/talleria';
import type { TallerOkCliente, TallerOkVehiculo } from '@/types/tallerokApi';

type ClienteConVehiculos = {
  cliente: Cliente;
  vehiculos: TallerOkVehiculo[];
  rawCliente?: TallerOkCliente;
};

const EMPTY_FILTERS: ClientesSearchFilters = {
  q: '',
  nombre: '',
  telefono: '',
  email: '',
  documento: '',
};

function hasActiveFilters(filters: ClientesSearchFilters): boolean {
  return Object.values(filters).some((value) => Boolean(value?.trim()));
}

function ClientesSearchBar({
  filters,
  onChange,
  onClear,
  showAdvanced,
  onToggleAdvanced,
}: {
  filters: ClientesSearchFilters;
  onChange: (next: ClientesSearchFilters) => void;
  onClear: () => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}) {
  const active = hasActiveFilters(filters);

  return (
    <View style={styles.searchBlock}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={filters.q}
          onChangeText={(q) => onChange({ ...filters, q })}
          placeholder="Buscar por nombre, teléfono, email o documento"
          placeholderTextColor={TalleriaColors.textMuted}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {active ? (
          <Pressable onPress={onClear} style={styles.clearButton} accessibilityRole="button">
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable onPress={onToggleAdvanced} style={styles.advancedToggle}>
        <Text style={styles.advancedToggleText}>
          {showAdvanced ? 'Ocultar filtros' : 'Filtros avanzados'}
        </Text>
      </Pressable>

      {showAdvanced ? (
        <View style={styles.advancedFields}>
          <TextInput
            style={styles.filterInput}
            value={filters.nombre}
            onChangeText={(nombre) => onChange({ ...filters, nombre })}
            placeholder="Nombre"
            placeholderTextColor={TalleriaColors.textMuted}
          />
          <TextInput
            style={styles.filterInput}
            value={filters.telefono}
            onChangeText={(telefono) => onChange({ ...filters, telefono })}
            placeholder="Teléfono"
            placeholderTextColor={TalleriaColors.textMuted}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.filterInput}
            value={filters.email}
            onChangeText={(email) => onChange({ ...filters, email })}
            placeholder="Email"
            placeholderTextColor={TalleriaColors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.filterInput}
            value={filters.documento}
            onChangeText={(documento) => onChange({ ...filters, documento })}
            placeholder="Documento / DNI"
            placeholderTextColor={TalleriaColors.textMuted}
          />
        </View>
      ) : null}
    </View>
  );
}

function ClienteCard({
  cliente,
  vehiculos,
  onPress,
}: {
  cliente: Cliente;
  vehiculos: { id: string; patente: string }[];
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress}>
      <Text style={styles.nombre}>{cliente.nombre}</Text>
      <Text style={styles.detalle}>{cliente.telefono || '—'}</Text>
      {cliente.email ? <Text style={styles.detalle}>{cliente.email}</Text> : null}
      <Text style={styles.detalle}>
        {vehiculos.length} vehículo{vehiculos.length !== 1 ? 's' : ''}
      </Text>
      {vehiculos.length > 0 ? (
        <View style={styles.tags}>
          {vehiculos.map((v) => (
            <Text key={v.id} style={styles.tag}>
              {v.patente}
            </Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

export default function ClientesScreen() {
  const router = useRouter();
  const connectionMode = useConnectionMode();
  const { isAuthenticated: isTallerOkAuth } = useTallerOkAuth();

  const [clientesApi, setClientesApi] = useState<ClienteConVehiculos[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ClientesSearchFilters>(EMPTY_FILTERS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const loadClientes = useCallback(async () => {
    if (!isTallerOkAuth) {
      setClientesApi([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiClientes = await listClientes();
      const conVehiculos = await Promise.all(
        apiClientes.map(async (cliente) => {
          const vehiculos = await listVehiculosByCliente(cliente.id);
          return {
            cliente: mapTallerOkClienteToCliente(cliente),
            vehiculos,
            rawCliente: cliente,
          };
        }),
      );
      setClientesApi(conVehiculos);
    } catch (err) {
      const message =
        err instanceof TallerOkApiError
          ? err.message
          : 'No se pudieron cargar los clientes. Volvé a intentar.';
      setError(message);
      setClientesApi([]);
    } finally {
      setIsLoading(false);
    }
  }, [isTallerOkAuth]);

  useFocusEffect(
    useCallback(() => {
      void loadClientes();
    }, [loadClientes]),
  );

  const filteredApiClientes = useMemo(() => {
    if (!hasActiveFilters(filters)) return clientesApi;

    const rawList = clientesApi
      .map((item) => item.rawCliente)
      .filter((c): c is TallerOkCliente => c != null);
    const filteredIds = new Set(
      filterClientes(rawList, filters).map((cliente) => cliente.id),
    );
    return clientesApi.filter((item) => filteredIds.has(item.cliente.id));
  }, [clientesApi, filters]);

  const filteredMockClientes = useMemo(() => {
    if (!hasActiveFilters(filters)) return mockClientes;

    const asTallerOk: TallerOkCliente[] = mockClientes.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono,
      email: c.email,
    }));
    const filteredIds = new Set(filterClientes(asTallerOk, filters).map((c) => c.id));
    return mockClientes.filter((c) => filteredIds.has(c.id));
  }, [filters]);

  const handleClientePress = (
    clienteId: string,
    vehiculos: { id: string }[],
    clienteNombre: string,
  ) => {
    if (isTallerOkAuth) {
      router.push(`/(flow)/cliente/${clienteId}` as Href);
      return;
    }
    const primerVehiculo = vehiculos[0];
    if (primerVehiculo) {
      router.push(`/(flow)/vehiculo/${primerVehiculo.id}`);
      return;
    }
    Alert.alert('Sin vehículos', `${clienteNombre} no tiene vehículos cargados todavía.`);
  };

  const handleCreateCliente = async (values: Parameters<typeof createCliente>[0]) => {
    setIsCreating(true);
    try {
      await createCliente(values);
      setShowCreateModal(false);
      await loadClientes();
    } catch (err) {
      const message =
        err instanceof TallerOkApiError ? err.message : 'No se pudo crear el cliente.';
      Alert.alert('Error', message);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const subtitle = isTallerOkAuth
    ? 'Datos desde la API TallerOK'
    : 'Modo demo — datos de ejemplo';

  const listToRender = isTallerOkAuth ? filteredApiClientes : filteredMockClientes;
  const totalCount = isTallerOkAuth ? clientesApi.length : mockClientes.length;
  const isFiltering = hasActiveFilters(filters);

  return (
    <Screen title="Clientes" subtitle={subtitle}>
      <View style={styles.headerRow}>
        <ConnectionBadge mode={connectionMode} compact />
      </View>

      <ClientesSearchBar
        filters={filters}
        onChange={setFilters}
        onClear={clearFilters}
        showAdvanced={showAdvanced}
        onToggleAdvanced={() => setShowAdvanced((prev) => !prev)}
      />

      {isTallerOkAuth ? (
        <PrimaryButton title="Nuevo cliente" onPress={() => setShowCreateModal(true)} />
      ) : null}

      {isLoading ? (
        <View style={styles.centerRow}>
          <ActivityIndicator color={TalleriaColors.accent} />
          <Text style={styles.muted}>Cargando clientes…</Text>
        </View>
      ) : null}

      {error ? (
        <Card>
          <Text style={styles.error}>{error}</Text>
        </Card>
      ) : null}

      {!isLoading && !error && totalCount === 0 ? (
        <Card>
          <Text style={styles.emptyTitle}>Sin clientes</Text>
          <Text style={styles.muted}>Todavía no hay clientes cargados en tu taller.</Text>
        </Card>
      ) : null}

      {!isLoading && !error && totalCount > 0 && listToRender.length === 0 && isFiltering ? (
        <Card>
          <Text style={styles.emptyTitle}>Sin resultados</Text>
          <Text style={styles.muted}>
            No encontramos clientes con esos criterios. Probá con otro término o limpiá la
            búsqueda.
          </Text>
        </Card>
      ) : null}

      {isTallerOkAuth
        ? filteredApiClientes.map(({ cliente, vehiculos }) => (
            <ClienteCard
              key={cliente.id}
              cliente={cliente}
              vehiculos={vehiculos}
              onPress={() => handleClientePress(cliente.id, vehiculos, cliente.nombre)}
            />
          ))
        : filteredMockClientes.map((cliente) => {
            const vehiculosCliente = getVehiculosByCliente(cliente.id);
            return (
              <ClienteCard
                key={cliente.id}
                cliente={cliente}
                vehiculos={vehiculosCliente}
                onPress={() =>
                  handleClientePress(cliente.id, vehiculosCliente, cliente.nombre)
                }
              />
            );
          })}

      <ClienteFormModal
        visible={showCreateModal}
        title="Nuevo cliente"
        isSubmitting={isCreating}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCliente}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: -8,
  },
  searchBlock: {
    gap: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: TalleriaColors.text,
    backgroundColor: TalleriaColors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: `${TalleriaColors.textMuted}18`,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: TalleriaColors.textMuted,
  },
  advancedToggle: {
    alignSelf: 'flex-start',
  },
  advancedToggleText: {
    fontSize: 13,
    color: TalleriaColors.accent,
    fontWeight: '600',
  },
  advancedFields: {
    gap: 8,
  },
  filterInput: {
    fontSize: 14,
    color: TalleriaColors.text,
    backgroundColor: TalleriaColors.surface,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  nombre: {
    fontSize: 17,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
  detalle: {
    fontSize: 14,
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
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    fontSize: 12,
    color: TalleriaColors.accent,
    backgroundColor: `${TalleriaColors.accent}22`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
