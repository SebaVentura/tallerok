import type { ManoObra, PresupuestoSesion, Repuesto } from '@/types/presupuesto';

export function calcularTotales(
  repuestos: Repuesto[],
  manoObra: ManoObra[],
  porcentajeAdelanto = 30,
) {
  const totalRepuestos = repuestos.reduce(
    (sum, item) => sum + item.cantidad * item.precioUnitario,
    0,
  );
  const totalManoObra = manoObra.reduce((sum, item) => sum + item.monto, 0);
  const totalGeneral = totalRepuestos + totalManoObra;
  const pct = Math.min(100, Math.max(0, porcentajeAdelanto));
  const adelantoSugerido = Math.round(totalGeneral * (pct / 100));

  return {
    totalRepuestos,
    totalManoObra,
    totalGeneral,
    adelantoSugerido,
  };
}

export function recalcularPresupuesto(presupuesto: PresupuestoSesion): PresupuestoSesion {
  const totales = calcularTotales(
    presupuesto.repuestos,
    presupuesto.manoObra,
    presupuesto.porcentajeAdelanto,
  );
  return { ...presupuesto, ...totales };
}

export function parseMontoInput(value: string): number {
  const normalized = value.replace(/\./g, '').replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 0;
}

export function formatMontoInput(value: number): string {
  return value > 0 ? String(value) : '';
}
