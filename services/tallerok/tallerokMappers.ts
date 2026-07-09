import type { Cliente, HistorialItem, Vehiculo } from '@/types/talleria';
import type {
  TallerOkCliente,
  TallerOkHistorialItem,
  TallerOkOrden,
  TallerOkOrdenEstado,
  TallerOkOrdenRepuesto,
  TallerOkOrdenTarea,
  TallerOkTaller,
  TallerOkUser,
  TallerOkVehiculo,
} from '@/types/tallerokApi';

type WithMongoId = { _id?: string; id?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function resolveId(entity: unknown): string {
  if (!isRecord(entity)) return '';
  const id = entity.id ?? entity._id;
  return typeof id === 'string' ? id : id != null ? String(id) : '';
}

function resolveClienteId(entity: TallerOkVehiculo & { cliente?: string }): string {
  return entity.clienteId ?? entity.cliente ?? '';
}

export function normalizeTallerOkUser(raw: unknown): TallerOkUser {
  if (!isRecord(raw)) {
    throw new Error('Respuesta inválida: falta el usuario de la sesión.');
  }

  const id = resolveId(raw);
  if (!id) {
    throw new Error('Respuesta inválida: el usuario no tiene identificador (id o _id).');
  }

  const name =
    (typeof raw.name === 'string' && raw.name) ||
    (typeof raw.nombre === 'string' && raw.nombre) ||
    '';
  const email = typeof raw.email === 'string' ? raw.email : '';
  const role = typeof raw.role === 'string' ? raw.role : 'owner';

  return {
    id,
    name,
    email,
    role,
  };
}

export function normalizeTallerOkTaller(raw: unknown): TallerOkTaller {
  if (!isRecord(raw)) {
    throw new Error('Respuesta inválida: faltan los datos del taller.');
  }

  const id = resolveId(raw);
  if (!id) {
    throw new Error('Respuesta inválida: el taller no tiene identificador (id o _id).');
  }

  const nombre =
    (typeof raw.nombre === 'string' && raw.nombre) ||
    (typeof raw.name === 'string' && raw.name) ||
    '';

  return {
    id,
    nombre,
    telefono: typeof raw.telefono === 'string' ? raw.telefono : null,
    direccion: typeof raw.direccion === 'string' ? raw.direccion : null,
    rubro: typeof raw.rubro === 'string' ? raw.rubro : null,
    email: typeof raw.email === 'string' ? raw.email : null,
  };
}

export function normalizeTallerOkCliente(
  raw: TallerOkCliente & WithMongoId & { dni?: string | null },
): TallerOkCliente {
  return {
    ...raw,
    id: resolveId(raw),
    documento: raw.documento ?? raw.dni ?? null,
  };
}

export function normalizeTallerOkVehiculo(
  raw: TallerOkVehiculo & WithMongoId & {
    kilometraje?: number;
    año?: number;
    observaciones?: string | null;
  },
): TallerOkVehiculo {
  return {
    ...raw,
    id: resolveId(raw),
    clienteId: resolveClienteId(raw),
    anio: raw.anio ?? raw.año ?? null,
    km: raw.km ?? raw.kilometraje ?? null,
    notas: raw.notas ?? raw.observaciones ?? null,
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
  vehiculoIdFallback?: string,
): HistorialItem {
  const motivo =
    item.descripcion?.trim() ||
    item.titulo?.trim() ||
    item.motivo?.trim() ||
    '—';

  return {
    id: resolveId(item),
    vehiculoId: item.vehiculoId ?? vehiculoIdFallback ?? '',
    fecha: item.fecha,
    motivo,
    estado: item.estado as HistorialItem['estado'],
    ordenId: item.ordenId ?? undefined,
  };
}

const ORDEN_ESTADOS: TallerOkOrdenEstado[] = [
  'pendiente',
  'en_proceso',
  'esperando_repuesto',
  'listo',
  'entregado',
  'cancelado',
];

function normalizeOrdenEstado(raw: unknown): TallerOkOrdenEstado {
  if (typeof raw !== 'string') return 'pendiente';
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, '_');
  if (ORDEN_ESTADOS.includes(normalized as TallerOkOrdenEstado)) {
    return normalized as TallerOkOrdenEstado;
  }
  if (normalized === 'en_taller') return 'en_proceso';
  return 'pendiente';
}

function normalizeTareas(raw: unknown): TallerOkOrdenTarea[] {
  if (!Array.isArray(raw)) return [];
  const result: TallerOkOrdenTarea[] = [];
  raw.forEach((item, index) => {
    if (typeof item === 'string') {
      const descripcion = item.trim();
      if (descripcion) {
        result.push({ id: `tarea-${index}`, descripcion, realizada: false });
      }
      return;
    }
    if (!isRecord(item)) return;
    const descripcion =
      (typeof item.descripcion === 'string' && item.descripcion.trim()) ||
      (typeof item.nombre === 'string' && item.nombre.trim()) ||
      '';
    if (!descripcion) return;
    const realizada =
      typeof item.realizada === 'boolean'
        ? item.realizada
        : typeof item.completada === 'boolean'
          ? item.completada
          : false;
    result.push({
      id: resolveId(item) || `tarea-${index}`,
      descripcion,
      realizada,
      completada: realizada,
    });
  });
  return result;
}

function normalizeRepuestos(raw: unknown): TallerOkOrdenRepuesto[] {
  if (!Array.isArray(raw)) return [];
  const result: TallerOkOrdenRepuesto[] = [];
  raw.forEach((item, index) => {
    if (!isRecord(item)) return;
    const nombre = typeof item.nombre === 'string' ? item.nombre : '';
    if (!nombre) return;
    result.push({
      id: resolveId(item) || `rep-${index}`,
      nombre,
      cantidad: typeof item.cantidad === 'number' ? item.cantidad : undefined,
      precio: typeof item.precio === 'number' ? item.precio : undefined,
    });
  });
  return result;
}

export function normalizeTallerOkOrden(raw: unknown): TallerOkOrden {
  if (!isRecord(raw)) {
    throw new Error('Respuesta inválida: falta la orden.');
  }

  const id = resolveId(raw);
  if (!id) {
    throw new Error('Respuesta inválida: la orden no tiene identificador (id o _id).');
  }

  const vehiculoId =
    (typeof raw.vehiculoId === 'string' && raw.vehiculoId) ||
    (isRecord(raw.vehiculo) ? resolveId(raw.vehiculo) : '') ||
    '';

  const clienteId =
    (typeof raw.clienteId === 'string' && raw.clienteId) ||
    (isRecord(raw.cliente) ? resolveId(raw.cliente) : null) ||
    null;

  const motivoIngreso =
    (typeof raw.motivoIngreso === 'string' && raw.motivoIngreso) ||
    (typeof raw.motivo === 'string' && raw.motivo) ||
    '';

  const kilometrajeIngreso =
    typeof raw.kilometrajeIngreso === 'number'
      ? raw.kilometrajeIngreso
      : typeof raw.kmIngreso === 'number'
        ? raw.kmIngreso
        : null;

  const diagnosticoNotas =
    (typeof raw.diagnosticoNotas === 'string' && raw.diagnosticoNotas) ||
    (typeof raw.diagnostico === 'string' && raw.diagnostico) ||
    null;

  const observacionesInternas =
    (typeof raw.observacionesInternas === 'string' && raw.observacionesInternas) ||
    (typeof raw.observaciones === 'string' && raw.observaciones) ||
    null;

  const fechaIngreso =
    (typeof raw.fechaIngreso === 'string' && raw.fechaIngreso) ||
    (typeof raw.fecha_ingreso === 'string' && raw.fecha_ingreso) ||
    (typeof raw.createdAt === 'string' && raw.createdAt) ||
    null;

  const fechaFinalizacion =
    (typeof raw.fechaFinalizacion === 'string' && raw.fechaFinalizacion) ||
    (typeof raw.fecha_finalizacion === 'string' && raw.fecha_finalizacion) ||
    null;

  const resumenCliente =
    (typeof raw.resumenCliente === 'string' && raw.resumenCliente) ||
    (typeof raw.resumen_cliente === 'string' && raw.resumen_cliente) ||
    null;

  const orden: TallerOkOrden = {
    id,
    numero: typeof raw.numero === 'string' ? raw.numero : null,
    vehiculoId,
    clienteId,
    estado: normalizeOrdenEstado(raw.estado),
    motivoIngreso,
    kilometrajeIngreso,
    diagnosticoNotas,
    tareas: normalizeTareas(raw.tareas),
    repuestos: normalizeRepuestos(raw.repuestos),
    observacionesInternas,
    resumenCliente,
    fechaIngreso,
    fechaFinalizacion,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
  };

  if (isRecord(raw.vehiculo)) {
    orden.vehiculo = normalizeTallerOkVehiculo(raw.vehiculo as TallerOkVehiculo);
  }
  if (isRecord(raw.cliente)) {
    orden.cliente = normalizeTallerOkCliente(raw.cliente as TallerOkCliente);
  }

  return orden;
}
