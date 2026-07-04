import type { TallerOkCliente } from '@/types/tallerokApi';

export type ClientesSearchFilters = {
  q?: string;
  nombre?: string;
  telefono?: string;
  email?: string;
  documento?: string;
};

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function getDocumento(cliente: TallerOkCliente): string {
  const raw = cliente as TallerOkCliente & { documento?: string | null; dni?: string | null };
  return normalize(raw.documento ?? raw.dni);
}

function matchesField(value: string, filter: string): boolean {
  const normalizedFilter = normalize(filter);
  if (!normalizedFilter) return true;
  return normalize(value).includes(normalizedFilter);
}

export function filterClientes(
  clientes: TallerOkCliente[],
  filters: ClientesSearchFilters,
): TallerOkCliente[] {
  const generalQuery = normalize(filters.q);
  const hasSpecificFilters =
    Boolean(filters.nombre?.trim()) ||
    Boolean(filters.telefono?.trim()) ||
    Boolean(filters.email?.trim()) ||
    Boolean(filters.documento?.trim());

  return clientes.filter((cliente) => {
    if (generalQuery) {
      const haystack = [
        cliente.nombre,
        cliente.telefono,
        cliente.email,
        getDocumento(cliente),
        cliente.direccion,
      ]
        .map(normalize)
        .join(' ');

      if (!haystack.includes(generalQuery)) {
        return false;
      }
    }

    if (hasSpecificFilters) {
      if (!matchesField(cliente.nombre, filters.nombre ?? '')) return false;
      if (!matchesField(cliente.telefono ?? '', filters.telefono ?? '')) return false;
      if (!matchesField(cliente.email ?? '', filters.email ?? '')) return false;
      if (!matchesField(getDocumento(cliente), filters.documento ?? '')) return false;
    }

    return true;
  });
}

export function buildClientesQueryString(filters: ClientesSearchFilters): string {
  const params = new URLSearchParams();

  if (filters.q?.trim()) params.set('q', filters.q.trim());
  if (filters.nombre?.trim()) params.set('nombre', filters.nombre.trim());
  if (filters.telefono?.trim()) params.set('telefono', filters.telefono.trim());
  if (filters.email?.trim()) params.set('email', filters.email.trim());
  if (filters.documento?.trim()) params.set('documento', filters.documento.trim());

  return params.toString();
}
