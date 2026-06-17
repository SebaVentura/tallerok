import type { ManoObra, Repuesto } from '@/types/presupuesto';
import type { OrdenTrabajo } from '@/types/talleria';
import { getPresupuestoByOrden } from '@/data/mock';

export function seedRepuestos(
  repuestosBase: { nombre: string; cantidad: number }[],
  ordenId: string,
): Repuesto[] {
  const mockPresupuesto = getPresupuestoByOrden(ordenId);
  const montoRepuestos =
    mockPresupuesto?.items.find((item) => item.concepto.toLowerCase().includes('repuesto'))
      ?.monto ?? 0;
  const precioPorItem =
    repuestosBase.length > 0 ? Math.round(montoRepuestos / repuestosBase.length) : 0;

  return repuestosBase.map((repuesto, index) => ({
    id: `rep-${index}-${Date.now()}`,
    nombre: repuesto.nombre,
    cantidad: repuesto.cantidad,
    precioUnitario: precioPorItem,
  }));
}

export function seedManoObra(tareas: string[], ordenId: string): ManoObra[] {
  const mockPresupuesto = getPresupuestoByOrden(ordenId);
  const montosManoObra =
    mockPresupuesto?.items
      .filter((item) => !item.concepto.toLowerCase().includes('repuesto'))
      .map((item) => item.monto) ?? [];

  if (tareas.length === 0) {
    return [
      {
        id: `mo-0-${Date.now()}`,
        descripcion: 'Mano de obra',
        monto: montosManoObra[0] ?? 0,
      },
    ];
  }

  return tareas.map((tarea, index) => ({
    id: `mo-${index}-${Date.now()}`,
    descripcion: tarea,
    monto: montosManoObra[index] ?? montosManoObra[0] ?? 0,
  }));
}

export function seedRepuestosFromOrden(orden: OrdenTrabajo): Repuesto[] {
  return seedRepuestos(orden.repuestos, orden.id);
}

export function seedManoObraFromOrden(orden: OrdenTrabajo): ManoObra[] {
  return seedManoObra(orden.tareas, orden.id);
}
