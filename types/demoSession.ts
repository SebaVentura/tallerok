export type DiagnosticoFoto = {
  id: string;
  uri: string;
};

export type DiagnosticoSesion = {
  vehiculoId: string;
  ordenId: string;
  textoDiagnostico: string;
  hallazgos: string[];
  audioUri: string | null;
  audioDuracionSec: number;
  fotos: DiagnosticoFoto[];
  tareas: string[];
  repuestos: { nombre: string; cantidad: number }[];
  creadoEn: string;
};
