import { calcularTotales, recalcularPresupuesto } from '@/data/calcPresupuesto';
import { formatMonto } from '@/data/mock';
import type { PresupuestoSesion } from '@/types/presupuesto';
import {
  getCliente,
  getDiagnosticoByVehiculo,
  getOrden,
  getPresupuestoByOrden,
  getVehiculo,
} from '@/data/mock';
import { seedManoObraFromOrden, seedRepuestosFromOrden } from '@/data/seedPresupuesto';

let presupuestoActual: PresupuestoSesion | null = null;

export function setPresupuestoSesion(presupuesto: PresupuestoSesion) {
  presupuestoActual = presupuesto;
}

export function getPresupuestoSesionByOrdenId(ordenId: string): PresupuestoSesion | null {
  if (presupuestoActual?.ordenId === ordenId) {
    return presupuestoActual;
  }
  return null;
}

export function updatePresupuestoSesion(presupuesto: PresupuestoSesion) {
  presupuestoActual = recalcularPresupuesto(presupuesto);
}

export function setPdfUri(ordenId: string, uri: string, generadoEn?: string) {
  const generado = generadoEn ?? new Date().toISOString();
  if (presupuestoActual?.ordenId === ordenId) {
    presupuestoActual = {
      ...presupuestoActual,
      pdfUri: uri,
      pdfGeneradoEn: generado,
    };
  }
}

export function clearPresupuestoSesion() {
  presupuestoActual = null;
}

export function buildMensajeCliente(p: PresupuestoSesion): string {
  const observaciones = p.observaciones.trim()
    ? `\n\nObservaciones: ${p.observaciones.trim()}`
    : '';

  return (
    `Hola ${p.clienteNombre}, te enviamos el diagnóstico y presupuesto de tu ${p.vehiculoPatente} (${p.vehiculoDescripcion}).\n\n` +
    `Diagnóstico: ${p.diagnosticoTexto.trim() || 'Sin detalle cargado.'}\n\n` +
    `Total: ${formatMonto(p.totalGeneral)}\n` +
    `Adelanto sugerido (${p.porcentajeAdelanto}%): ${formatMonto(p.adelantoSugerido)}` +
    `${observaciones}\n\n` +
    `Quedamos atentos a tu aprobación.`
  );
}

export function buildPresupuestoSesion(input: {
  ordenId: string;
  numeroOrden: string;
  clienteNombre: string;
  clienteTelefono: string;
  vehiculoPatente: string;
  vehiculoDescripcion: string;
  diagnosticoTexto: string;
  fotoPrincipalUri: string | null;
  repuestos: PresupuestoSesion['repuestos'];
  manoObra: PresupuestoSesion['manoObra'];
  observaciones?: string;
  porcentajeAdelanto?: number;
  mensajeCliente?: string;
}): PresupuestoSesion {
  const base: PresupuestoSesion = {
    ...input,
    nombreTaller: 'TallerOK Demo',
    fecha: new Date().toLocaleDateString('es-AR'),
    observaciones: input.observaciones ?? '',
    porcentajeAdelanto: input.porcentajeAdelanto ?? 30,
    mensajeCliente: '',
    pdfUri: null,
    totalRepuestos: 0,
    totalManoObra: 0,
    totalGeneral: 0,
    adelantoSugerido: 0,
  };

  const recalculado = recalcularPresupuesto(base);
  return {
    ...recalculado,
    mensajeCliente: input.mensajeCliente ?? buildMensajeCliente(recalculado),
  };
}

export function buildMockPresupuestoSesion(ordenId: string): PresupuestoSesion | null {
  const orden = getOrden(ordenId);
  if (!orden) return null;

  const vehiculo = getVehiculo(orden.vehiculoId);
  const cliente = vehiculo ? getCliente(vehiculo.clienteId) : undefined;
  const diagnostico = getDiagnosticoByVehiculo(orden.vehiculoId);
  const mockPresupuesto = getPresupuestoByOrden(ordenId);

  if (!vehiculo || !cliente || !mockPresupuesto) return null;

  return buildPresupuestoSesion({
    ordenId: orden.id,
    numeroOrden: orden.numero,
    clienteNombre: cliente.nombre,
    clienteTelefono: cliente.telefono,
    vehiculoPatente: vehiculo.patente,
    vehiculoDescripcion: `${vehiculo.marca} ${vehiculo.modelo} · ${vehiculo.anio}`,
    diagnosticoTexto: diagnostico?.resumenIA ?? 'Diagnóstico no disponible.',
    fotoPrincipalUri: null,
    repuestos: seedRepuestosFromOrden(orden),
    manoObra: seedManoObraFromOrden(orden),
  });
}

export function formatWhatsAppPhone(telefono: string): string {
  let digits = telefono.replace(/\D/g, '');
  if (digits.startsWith('54')) return digits;
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10 || digits.length === 11) return `54${digits}`;
  return digits;
}
