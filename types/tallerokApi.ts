export type TallerOkUserRole =
  | 'owner'
  | 'admin'
  | 'operador'
  | 'mecanico'
  | 'recepcion'
  | 'solo_lectura'
  | string;

/** Usuario de sesión TallerOK — siempre `name`, nunca `nombre`. */
export type TallerOkUser = {
  id: string;
  email: string;
  name: string;
  role: TallerOkUserRole;
};

export type TallerOkTaller = {
  id: string;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  rubro?: string | null;
};

/** Forma canónica de sesión real en la app. */
export type TallerOkSession = {
  accessToken: string;
  user: TallerOkUser;
  taller: TallerOkTaller;
};

export type TallerOkAuthResponse = TallerOkSession;

export type TallerOkMeResponse = {
  user: TallerOkUser;
  taller: TallerOkTaller;
};

export type TallerOkRegisterTallerPayload = {
  tallerNombre: string;
  tallerTelefono?: string;
  tallerDireccion?: string;
  tallerRubro?: string;
  nombre: string;
  email: string;
  password: string;
};

export type TallerOkLoginPayload = {
  email: string;
  password: string;
};

export type TallerOkCliente = {
  id: string;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  documento?: string | null;
  direccion?: string | null;
  notas?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TallerOkCreateClientePayload = {
  nombre: string;
  telefono?: string;
  email?: string;
  documento?: string;
  direccion?: string;
  notas?: string;
};

export type TallerOkUpdateClientePayload = Partial<TallerOkCreateClientePayload>;

export type TallerOkVehiculo = {
  id: string;
  clienteId: string;
  patente: string;
  marca: string;
  modelo: string;
  anio?: number | null;
  km?: number | null;
  color?: string | null;
  notas?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TallerOkCreateVehiculoPayload = {
  patente: string;
  marca: string;
  modelo: string;
  anio?: number;
  km?: number;
  color?: string;
  notas?: string;
  observaciones?: string;
  kilometraje?: number;
};

export type TallerOkUpdateTallerPayload = {
  nombre?: string;
  telefono?: string;
  direccion?: string;
  rubro?: string;
};

export type TallerOkUpdateVehiculoPayload = Partial<TallerOkCreateVehiculoPayload>;

export type TallerOkHistorialItem = {
  id: string;
  vehiculoId?: string;
  tipo?: string | null;
  ordenId?: string | null;
  titulo?: string | null;
  descripcion?: string | null;
  /** @deprecated usar descripcion o titulo */
  motivo?: string;
  estado: string;
  fecha: string;
  kilometraje?: number | null;
};

export type TallerOkActividadReciente = {
  id: string;
  fecha: string;
  motivo: string;
  estado: string;
  vehiculoId?: string | null;
  vehiculoPatente?: string | null;
  ordenId?: string | null;
};

export type TallerOkDashboard = {
  clientesTotal: number;
  vehiculosTotal: number;
  ordenesActivas: number;
  presupuestosPendientes: number;
  actividadReciente: TallerOkActividadReciente[];
};

export type TallerOkApiErrorBody = {
  message?: string | string[];
  statusCode?: number;
  error?: string;
};

export type TallerOkTallerSettings = {
  nombre?: string;
  telefono?: string;
  direccion?: string;
  rubro?: string;
  accentColor?: string;
  logoUrl?: string | null;
  [key: string]: unknown;
};

export type TallerOkOrdenEstado =
  | 'pendiente'
  | 'en_proceso'
  | 'esperando_repuesto'
  | 'listo'
  | 'entregado'
  | 'cancelado';

export type TallerOkOrdenTarea = {
  id?: string;
  descripcion: string;
  /** API usa `realizada`; legacy interno `completada` */
  realizada?: boolean;
  completada?: boolean;
};

export type TallerOkOrdenRepuesto = {
  id?: string;
  nombre: string;
  cantidad?: number;
  precio?: number;
};

export type TallerOkOrden = {
  id: string;
  numero?: string | null;
  vehiculoId: string;
  clienteId?: string | null;
  estado: TallerOkOrdenEstado;
  motivoIngreso: string;
  kilometrajeIngreso?: number | null;
  diagnosticoNotas?: string | null;
  tareas: TallerOkOrdenTarea[];
  repuestos?: TallerOkOrdenRepuesto[];
  observacionesInternas?: string | null;
  resumenCliente?: string | null;
  fechaIngreso?: string | null;
  fechaFinalizacion?: string | null;
  createdAt?: string;
  updatedAt?: string;
  vehiculo?: TallerOkVehiculo;
  cliente?: TallerOkCliente;
};

export type TallerOkCreateOrdenPayload = {
  vehiculoId: string;
  clienteId?: string;
  motivoIngreso: string;
  kilometrajeIngreso?: number;
  diagnosticoNotas?: string;
  tareas?: TallerOkOrdenTarea[];
  observacionesInternas?: string;
};

export type TallerOkUpdateOrdenPayload = {
  estado?: TallerOkOrdenEstado;
  motivoIngreso?: string;
  kilometrajeIngreso?: number;
  diagnosticoNotas?: string;
  tareas?: TallerOkOrdenTarea[];
  observacionesInternas?: string;
};

export type TallerOkOrdenesListResponse = {
  items: TallerOkOrden[];
  meta?: {
    total?: number;
    page?: number;
    perPage?: number;
  };
};

export type TallerOkListOrdenesParams = {
  estado?: TallerOkOrdenEstado | string;
  vehiculoId?: string;
  clienteId?: string;
  q?: string;
};
