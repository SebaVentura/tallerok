export type Repuesto = {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
};

export type ManoObra = {
  id: string;
  descripcion: string;
  monto: number;
};

export type PresupuestoSesion = {
  ordenId: string;
  numeroOrden: string;
  nombreTaller: string;
  clienteNombre: string;
  clienteTelefono: string;
  vehiculoPatente: string;
  vehiculoDescripcion: string;
  fecha: string;
  diagnosticoTexto: string;
  fotoPrincipalUri: string | null;
  repuestos: Repuesto[];
  manoObra: ManoObra[];
  observaciones: string;
  porcentajeAdelanto: number;
  mensajeCliente: string;
  totalRepuestos: number;
  totalManoObra: number;
  totalGeneral: number;
  adelantoSugerido: number;
  pdfUri: string | null;
  pdfGeneradoEn?: string;
};
