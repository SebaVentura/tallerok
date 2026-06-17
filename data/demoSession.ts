import type { DiagnosticoSesion } from '@/types/demoSession';

let sesionActual: DiagnosticoSesion | null = null;

export function setDiagnosticoSesion(sesion: DiagnosticoSesion) {
  sesionActual = sesion;
}

export function getDiagnosticoSesionByOrdenId(ordenId: string): DiagnosticoSesion | null {
  if (sesionActual?.ordenId === ordenId) {
    return sesionActual;
  }
  return null;
}

export function getDiagnosticoSesionByVehiculoId(vehiculoId: string): DiagnosticoSesion | null {
  if (sesionActual?.vehiculoId === vehiculoId) {
    return sesionActual;
  }
  return null;
}

export function updateDiagnosticoSesion(partial: Partial<DiagnosticoSesion>) {
  if (sesionActual) {
    sesionActual = { ...sesionActual, ...partial };
  }
}

export function clearDiagnosticoSesion() {
  sesionActual = null;
}
