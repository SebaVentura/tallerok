export type TallerOkUserRole =
  | 'owner'
  | 'admin'
  | 'operador'
  | 'mecanico'
  | 'recepcion'
  | 'solo_lectura'
  | string;

export type TallerOkUser = {
  id: string;
  nombre: string;
  email: string;
  role: TallerOkUserRole;
};

export type TallerOkTaller = {
  id: string;
  nombre: string;
  telefono?: string | null;
  direccion?: string | null;
  rubro?: string | null;
  email?: string | null;
};

export type TallerOkAuthResponse = {
  accessToken: string;
  user: TallerOkUser;
  taller: TallerOkTaller;
};

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
  notas?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TallerOkCreateClientePayload = {
  nombre: string;
  telefono?: string;
  email?: string;
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
};

export type TallerOkUpdateVehiculoPayload = Partial<TallerOkCreateVehiculoPayload>;

export type TallerOkHistorialItem = {
  id: string;
  vehiculoId: string;
  fecha: string;
  motivo: string;
  estado: string;
  ordenId?: string | null;
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
