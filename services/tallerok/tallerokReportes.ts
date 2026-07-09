import type {
  TallerOkOrden,
  TallerOkOrdenEstado,
  TallerOkOrdenRepuesto,
  TallerOkOrdenTarea,
} from '@/types/tallerokApi';

export type OrdenReporteResult = {
  texto: string;
  vacio: boolean;
};

const ESTADO_LABELS: Record<TallerOkOrdenEstado, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  esperando_repuesto: 'Esperando repuesto',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

function trimOrNull(value?: string | null): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatFecha(fecha?: string | null): string | null {
  if (!fecha) return null;
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return fecha;
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatNumeroOrden(orden: TallerOkOrden): string {
  return orden.numero?.trim() || `Orden ${orden.id.slice(-6)}`;
}

function isTareaRealizada(tarea: TallerOkOrdenTarea): boolean {
  return tarea.realizada ?? tarea.completada ?? false;
}

function formatRepuestoLine(repuesto: TallerOkOrdenRepuesto): string {
  const nombre = repuesto.nombre.trim();
  if (!nombre) return '';
  if (repuesto.cantidad != null && repuesto.cantidad > 0) {
    return `${nombre} x${repuesto.cantidad}`;
  }
  return nombre;
}

function appendBlock(lines: string[], title: string, content: string | null): void {
  if (!content) return;
  lines.push(`${title}:`);
  lines.push(content);
  lines.push('');
}

function appendBulletBlock(lines: string[], title: string, items: string[]): void {
  const filtered = items.map((item) => item.trim()).filter(Boolean);
  if (filtered.length === 0) return;
  lines.push(`${title}:`);
  lines.push('');
  for (const item of filtered) {
    lines.push(`* ${item}`);
  }
  lines.push('');
}

function hasSubstantiveOrdenData(orden: TallerOkOrden): boolean {
  return Boolean(
    trimOrNull(orden.motivoIngreso) ||
      orden.cliente ||
      orden.vehiculo ||
      trimOrNull(orden.diagnosticoNotas) ||
      trimOrNull(orden.resumenCliente) ||
      orden.kilometrajeIngreso != null ||
      orden.tareas.some((tarea) => trimOrNull(tarea.descripcion)) ||
      (orden.repuestos?.some((repuesto) => trimOrNull(repuesto.nombre)) ?? false) ||
      trimOrNull(orden.observacionesInternas),
  );
}

export function buildReporteTecnicoOrden(orden: TallerOkOrden): OrdenReporteResult {
  if (!hasSubstantiveOrdenData(orden)) {
    return {
      texto: '',
      vacio: true,
    };
  }

  const lines: string[] = [];

  lines.push(`Orden de trabajo: ${formatNumeroOrden(orden)}`);
  lines.push(`Estado: ${ESTADO_LABELS[orden.estado] ?? orden.estado}`);
  lines.push('');

  if (orden.cliente) {
    const clienteLines: string[] = [];
    const nombre = trimOrNull(orden.cliente.nombre);
    const telefono = trimOrNull(orden.cliente.telefono);
    const email = trimOrNull(orden.cliente.email);
    if (nombre) clienteLines.push(nombre);
    if (telefono) clienteLines.push(`Teléfono: ${telefono}`);
    if (email) clienteLines.push(`Email: ${email}`);
    if (clienteLines.length > 0) {
      lines.push('Cliente:');
      lines.push(...clienteLines);
      lines.push('');
    }
  }

  if (orden.vehiculo) {
    const vehiculoLines: string[] = [];
    const marcaModelo = [orden.vehiculo.marca, orden.vehiculo.modelo, orden.vehiculo.anio]
      .filter((part) => part != null && String(part).trim() !== '')
      .join(' ')
      .trim();
    const patente = trimOrNull(orden.vehiculo.patente);

    if (marcaModelo) vehiculoLines.push(marcaModelo);
    if (patente) vehiculoLines.push(`Patente: ${patente}`);
    if (orden.kilometrajeIngreso != null) {
      vehiculoLines.push(
        `Kilometraje: ${orden.kilometrajeIngreso.toLocaleString('es-AR')} km`,
      );
    }

    if (vehiculoLines.length > 0) {
      lines.push('Vehículo:');
      lines.push(...vehiculoLines);
      lines.push('');
    }
  } else if (orden.kilometrajeIngreso != null) {
    lines.push('Kilometraje:');
    lines.push(`${orden.kilometrajeIngreso.toLocaleString('es-AR')} km`);
    lines.push('');
  }

  const fechaIngreso = formatFecha(orden.fechaIngreso ?? orden.createdAt);
  if (fechaIngreso) {
    lines.push(`Fecha de ingreso: ${fechaIngreso}`);
    lines.push('');
  }

  const fechaFinalizacion = formatFecha(orden.fechaFinalizacion);
  if (fechaFinalizacion) {
    lines.push(`Fecha de finalización: ${fechaFinalizacion}`);
    lines.push('');
  }

  appendBlock(lines, 'Motivo de ingreso', trimOrNull(orden.motivoIngreso));
  appendBlock(lines, 'Diagnóstico / notas', trimOrNull(orden.diagnosticoNotas));

  const tareas = orden.tareas
    .map((tarea) => trimOrNull(tarea.descripcion))
    .filter((descripcion): descripcion is string => Boolean(descripcion));
  appendBulletBlock(lines, 'Tareas', tareas);

  const repuestos = (orden.repuestos ?? [])
    .map(formatRepuestoLine)
    .filter((line) => line.length > 0);
  appendBulletBlock(lines, 'Repuestos', repuestos);

  appendBlock(lines, 'Observaciones internas', trimOrNull(orden.observacionesInternas));

  return {
    texto: lines.join('\n').trimEnd(),
    vacio: false,
  };
}

export function buildResumenClienteOrden(orden: TallerOkOrden): OrdenReporteResult {
  const diagnostico = trimOrNull(orden.diagnosticoNotas) ?? trimOrNull(orden.resumenCliente);
  const tareas = orden.tareas
    .map((tarea) => {
      const descripcion = trimOrNull(tarea.descripcion);
      if (!descripcion) return null;
      const estadoTarea = isTareaRealizada(tarea) ? 'realizada' : 'pendiente';
      return `${descripcion} (${estadoTarea})`;
    })
    .filter((line): line is string => Boolean(line));

  const hasVehiculo = Boolean(orden.vehiculo);
  const hasMotivo = Boolean(trimOrNull(orden.motivoIngreso));
  const hasDiagnostico = Boolean(diagnostico);
  const hasTareas = tareas.length > 0;

  if (!hasVehiculo && !hasMotivo && !hasDiagnostico && !hasTareas) {
    return {
      texto: '',
      vacio: true,
    };
  }

  const lines: string[] = [];

  lines.push('Hola, te compartimos el estado de tu vehículo.');
  lines.push('');

  if (orden.vehiculo) {
    const vehiculoPartes: string[] = [];
    const marcaModelo = [orden.vehiculo.marca, orden.vehiculo.modelo]
      .map((part) => trimOrNull(part != null ? String(part) : null))
      .filter((part): part is string => Boolean(part))
      .join(' ');
    const patente = trimOrNull(orden.vehiculo.patente);

    if (marcaModelo) vehiculoPartes.push(marcaModelo);
    if (patente) vehiculoPartes.push(`patente ${patente}`);

    if (vehiculoPartes.length > 0) {
      lines.push(`Vehículo: ${vehiculoPartes.join(', ')}.`);
    }
  }

  const motivo = trimOrNull(orden.motivoIngreso);
  if (motivo) {
    lines.push(`Motivo de ingreso: ${motivo}.`);
  }

  lines.push(`Estado actual: ${ESTADO_LABELS[orden.estado] ?? orden.estado}.`);
  lines.push('');

  if (diagnostico) {
    lines.push('Diagnóstico:');
    lines.push(diagnostico);
    lines.push('');
  }

  appendBulletBlock(lines, 'Tareas', tareas);

  lines.push('Ante cualquier consulta, quedamos a disposición.');

  return {
    texto: lines.join('\n').trimEnd(),
    vacio: false,
  };
}
