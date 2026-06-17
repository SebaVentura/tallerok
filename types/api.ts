export type MobileUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export type MobileSocio = {
  id: number;
  nro_socio: number | string;
  nombre_apellido: string;
  denominacion_taller: string | null;
  estado: string;
  estado_cuota: string | null;
};

export type MobileMeResponse = {
  user: MobileUser;
  socio: MobileSocio | null;
};

export type MobileLoginResponse = {
  token: string;
  user: MobileUser;
  socio?: MobileSocio | null;
};

export type MobileLoginPayload = {
  email: string;
  password: string;
};

export type ApiErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
};
