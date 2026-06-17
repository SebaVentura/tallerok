import type {
  Cliente,
  DashboardKpis,
  Diagnostico,
  Evidencia,
  HistorialItem,
  OrdenTrabajo,
  Presupuesto,
  ResumenEconomico,
  TopTrabajo,
  Vehiculo,
} from '@/types/talleria';

export const clientes: Cliente[] = [
  { id: 'c1', nombre: 'María González', telefono: '+54 11 4567-8901', email: 'maria@email.com' },
  { id: 'c2', nombre: 'Carlos Ruiz', telefono: '+54 11 2345-6789', email: 'carlos@email.com' },
  { id: 'c3', nombre: 'Ana Martínez', telefono: '+54 11 9876-5432', email: 'ana@email.com' },
];

export const vehiculos: Vehiculo[] = [
  { id: 'v1', clienteId: 'c1', patente: 'AB 123 CD', marca: 'Toyota', modelo: 'Corolla', anio: 2019, km: 84500 },
  { id: 'v2', clienteId: 'c1', patente: 'AC 456 EF', marca: 'Ford', modelo: 'Ranger', anio: 2021, km: 52000 },
  { id: 'v3', clienteId: 'c2', patente: 'AD 789 GH', marca: 'VW', modelo: 'Gol', anio: 2017, km: 112000 },
  { id: 'v4', clienteId: 'c3', patente: 'AE 012 IJ', marca: 'Chevrolet', modelo: 'Onix', anio: 2022, km: 31000 },
];

export const historial: HistorialItem[] = [
  { id: 'h1', vehiculoId: 'v1', fecha: '2026-05-10', motivo: 'Service 80.000 km', estado: 'entregado' },
  { id: 'h2', vehiculoId: 'v1', fecha: '2026-06-01', motivo: 'Ruido en tren delantero', estado: 'en_taller', ordenId: 'o1' },
  { id: 'h3', vehiculoId: 'v2', fecha: '2026-04-22', motivo: 'Cambio de aceite', estado: 'entregado' },
  { id: 'h4', vehiculoId: 'v3', fecha: '2026-06-08', motivo: 'Falla encendido', estado: 'presupuestado', ordenId: 'o2' },
];

export const diagnosticos: Diagnostico[] = [
  {
    id: 'd1',
    vehiculoId: 'v1',
    fecha: '2026-06-01',
    resumenIA:
      'Análisis de audio: posible desgaste en bujes de barra estabilizadora del lado derecho. Se recomienda inspección visual y prueba en ruta.',
    hallazgos: ['Crujido en badén a baja velocidad', 'Juego leve en rótula', 'Neumático delantero derecho con desgaste irregular'],
    audioDuracionSeg: 47,
  },
  {
    id: 'd2',
    vehiculoId: 'v3',
    fecha: '2026-06-08',
    resumenIA: 'El motor presenta tironeo en ralentí. Probable falla en bobina o bujías.',
    hallazgos: ['Código P0301 detectado (mock)', 'Bujía 1 con residuo excesivo'],
    audioDuracionSeg: 32,
  },
];

export const evidencias: Evidencia[] = [
  { id: 'e1', diagnosticoId: 'd1', tipo: 'foto', descripcion: 'Buje barra estabilizadora' },
  { id: 'e2', diagnosticoId: 'd1', tipo: 'video', descripcion: 'Prueba en badén' },
  { id: 'e3', diagnosticoId: 'd2', tipo: 'foto', descripcion: 'Bujía cilindro 1' },
];

export const ordenes: OrdenTrabajo[] = [
  {
    id: 'o1',
    vehiculoId: 'v1',
    diagnosticoId: 'd1',
    numero: 'OT-2026-0142',
    tecnico: 'Lucas Fernández',
    estado: 'en_taller',
    tareas: ['Reemplazar bujes barra estabilizadora', 'Alinear ruedas', 'Balancear neumáticos'],
    repuestos: [
      { nombre: 'Kit bujes barra estabilizadora', cantidad: 1 },
      { nombre: 'Grasa litio', cantidad: 1 },
    ],
  },
  {
    id: 'o2',
    vehiculoId: 'v3',
    diagnosticoId: 'd2',
    numero: 'OT-2026-0158',
    tecnico: 'Sofía López',
    estado: 'presupuestado',
    tareas: ['Cambio de bujías', 'Limpieza inyectores', 'Escaneo ECU'],
    repuestos: [{ nombre: 'Kit bujías NGK', cantidad: 1 }],
  },
];

export const presupuestos: Presupuesto[] = [
  {
    id: 'p1',
    ordenId: 'o1',
    items: [
      { concepto: 'Mano de obra', monto: 45000 },
      { concepto: 'Repuestos', monto: 28500 },
      { concepto: 'Alineación y balanceo', monto: 18000 },
    ],
    adelantoSolicitado: 40000,
    adelantoCobrado: 40000,
  },
  {
    id: 'p2',
    ordenId: 'o2',
    items: [
      { concepto: 'Mano de obra', monto: 38000 },
      { concepto: 'Repuestos', monto: 22000 },
    ],
    adelantoSolicitado: 30000,
    adelantoCobrado: 0,
  },
];

export const topTrabajosMes: TopTrabajo[] = [
  { id: 't1', nombre: 'Distribución Toyota Hilux', ganancia: 145000 },
  { id: 't2', nombre: 'Embrague Amarok', ganancia: 120000 },
  { id: 't3', nombre: 'Tren delantero Gol', ganancia: 95000 },
];

export const resumenes: ResumenEconomico[] = [
  {
    ordenId: 'o1',
    total: 91500,
    adelanto: 40000,
    saldo: 51500,
    totalCobrado: 40000,
    totalRepuestos: 28500,
    totalManoObra: 63000,
    gananciaEstimada: 36600,
    margenPromedio: 40,
    pagos: [
      { fecha: '2026-06-02', concepto: 'Adelanto Mercado Pago', monto: 40000 },
    ],
  },
  {
    ordenId: 'o2',
    total: 60000,
    adelanto: 0,
    saldo: 60000,
    totalCobrado: 0,
    totalRepuestos: 22000,
    totalManoObra: 38000,
    gananciaEstimada: 24000,
    margenPromedio: 40,
    pagos: [],
  },
];

export function getCliente(id: string) {
  return clientes.find((c) => c.id === id);
}

export function getVehiculo(id: string) {
  return vehiculos.find((v) => v.id === id);
}

export function getVehiculosByCliente(clienteId: string) {
  return vehiculos.filter((v) => v.clienteId === clienteId);
}

export function getClienteByVehiculo(vehiculoId: string) {
  const vehiculo = getVehiculo(vehiculoId);
  return vehiculo ? getCliente(vehiculo.clienteId) : undefined;
}

export function getHistorialVehiculo(vehiculoId: string) {
  return historial.filter((h) => h.vehiculoId === vehiculoId);
}

export function getDiagnosticoByVehiculo(vehiculoId: string) {
  return diagnosticos.find((d) => d.vehiculoId === vehiculoId);
}

export function getEvidenciasByDiagnostico(diagnosticoId: string) {
  return evidencias.filter((e) => e.diagnosticoId === diagnosticoId);
}

export function getOrden(id: string) {
  return ordenes.find((o) => o.id === id);
}

export function getOrdenByVehiculo(vehiculoId: string) {
  return ordenes.find((o) => o.vehiculoId === vehiculoId);
}

export function getPresupuestoByOrden(ordenId: string) {
  return presupuestos.find((p) => p.ordenId === ordenId);
}

export function getResumenByOrden(ordenId: string) {
  return resumenes.find((r) => r.ordenId === ordenId);
}

export function getDashboardKpis(): DashboardKpis {
  const activas = ordenes.filter((o) => o.estado === 'en_taller' || o.estado === 'presupuestado').length;
  const enTaller = ordenes.filter((o) => o.estado === 'en_taller').length;

  return {
    activas,
    enTaller,
    facturacionMes: 2450000,
    gananciaEstimada: 980000,
    vehiculosEntregados: 18,
    presupuestosPendientes: 4,
    adelantosCobrados: 740000,
    ticketPromedio: 136000,
  };
}

export function getTopTrabajosMes() {
  return topTrabajosMes;
}

export function formatMonto(monto: number) {
  return `$ ${monto.toLocaleString('es-AR')}`;
}
