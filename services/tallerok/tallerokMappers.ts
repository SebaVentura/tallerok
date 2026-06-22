import type { Cliente, HistorialItem, Vehiculo } from '@/types/talleria';
import type {
  TallerOkCliente,
  TallerOkHistorialItem,
  TallerOkTaller,
  TallerOkUser,
  TallerOkVehiculo,
} from '@/types/tallerokApi';

type WithMongoId = { _id?: string; id?: string };

function resolveId(entity: WithMongoId): string {
  return entity.id ?? entity._id ?? '';
}

function resolveClienteId(entity: TallerOkVehiculo & { cliente?: string }): string {
  return entity.clienteId ?? entity.cliente ?? '';
}

export function normalizeTallerOkUser(raw: TallerOkUser & WithMongoId): TallerOkUser {
  return {
    ...raw,
    id: resolveId(raw),
    nombre: raw.nombre ?? (raw as { name?: string }).name ?? '',
  };
}

export function normalizeTallerOkTaller(
  raw: TallerOkTaller & WithMongoId,
): TallerOkTaller {
  return {
    ...raw,
    id: resolveId(raw),
  };
}

export function normalizeTallerOkCliente(raw: TallerOkCliente & WithMongoId): TallerOkCliente {
  return {
    ...raw,
    id: resolveId(raw),
  };
}

export function normalizeTallerOkVehiculo(
  raw: TallerOkVehiculo & WithMongoId & { kilometraje?: number; año?: number },
): TallerOkVehiculo {
  return {
    ...raw,
    id: resolveId(raw),
    clienteId: resolveClienteId(raw),
    anio: raw.anio ?? raw.año ?? null,
    km: raw.km ?? raw.kilometraje ?? null,
  };
}

export function mapTallerOkClienteToCliente(cliente: TallerOkCliente): Cliente {
  return {
    id: cliente.id,
    nombre: cliente.nombre,
    telefono: cliente.telefono ?? '',
    email: cliente.email ?? '',
  };
}

export function mapTallerOkVehiculoToVehiculo(vehiculo: TallerOkVehiculo): Vehiculo {
  return {
    id: vehiculo.id,
    clienteId: vehiculo.clienteId,
    patente: vehiculo.patente,
    marca: vehiculo.marca,
    modelo: vehiculo.modelo,
    anio: vehiculo.anio ?? 0,
    km: vehiculo.km ?? 0,
  };
}

export function mapTallerOkHistorialToHistorialItem(
  item: TallerOkHistorialItem & WithMongoId,
): HistorialItem {
  return {
    id: resolveId(item),
    vehiculoId: item.vehiculoId,
    fecha: item.fecha,
    motivo: item.motivo,
    estado: item.estado as HistorialItem['estado'],
    ordenId: item.ordenId ?? undefined,
  };
}
