export type EstadoOrden = 'pendiente' | 'en_taller' | 'presupuestado' | 'listo' | 'entregado';

export type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
};

export type Vehiculo = {
  id: string;
  clienteId: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  km: number;
};

export type HistorialItem = {
  id: string;
  vehiculoId: string;
  fecha: string;
  motivo: string;
  estado: EstadoOrden;
  ordenId?: string;
};

export type Diagnostico = {
  id: string;
  vehiculoId: string;
  fecha: string;
  resumenIA: string;
  hallazgos: string[];
  audioDuracionSeg: number;
};

export type Evidencia = {
  id: string;
  diagnosticoId: string;
  tipo: 'foto' | 'video';
  descripcion: string;
};

export type OrdenTrabajo = {
  id: string;
  vehiculoId: string;
  diagnosticoId: string;
  numero: string;
  tecnico: string;
  estado: EstadoOrden;
  tareas: string[];
  repuestos: { nombre: string; cantidad: number }[];
};

export type PresupuestoItem = {
  concepto: string;
  monto: number;
};

export type Presupuesto = {
  id: string;
  ordenId: string;
  items: PresupuestoItem[];
  adelantoSolicitado: number;
  adelantoCobrado: number;
};

export type ResumenEconomico = {
  ordenId: string;
  total: number;
  adelanto: number;
  saldo: number;
  totalCobrado: number;
  totalRepuestos: number;
  totalManoObra: number;
  gananciaEstimada: number;
  margenPromedio: number;
  pagos: { fecha: string; concepto: string; monto: number }[];
};

export type TopTrabajo = {
  id: string;
  nombre: string;
  ganancia: number;
};

export type DashboardKpis = {
  activas: number;
  enTaller: number;
  facturacionMes: number;
  gananciaEstimada: number;
  vehiculosEntregados: number;
  presupuestosPendientes: number;
  adelantosCobrados: number;
  ticketPromedio: number;
};
