import { api } from '@/services/api/client';

export type PaymentLink = {
  url: string;
  reference: string;
  amount: number;
  expires_at?: string;
};

export type MyCollectionsSummary = {
  saldo_pendiente?: number;
  ultimo_pago?: string;
  [key: string]: unknown;
};

/**
 * Cobranzas del socio autenticado.
 *
 * Endpoint mobile seguro (a implementar):
 *   GET /api/mobile/me/collections/summary
 *   POST /api/mobile/me/collections/payment-link
 *
 * NO usar desde la app:
 *   GET /api/admin/collections/summary
 *   GET /api/admin/collections/debtors
 *
 * Los montos y links de pago deben generarse siempre en el servidor.
 */
export async function getMyCollectionsSummary(): Promise<MyCollectionsSummary> {
  return api.get<MyCollectionsSummary>('/mobile/me/collections/summary', { auth: true });
}

export async function requestMyPaymentLink(payload: {
  concepto: string;
  monto?: number;
}): Promise<PaymentLink> {
  return api.post<PaymentLink>('/mobile/me/collections/payment-link', payload, { auth: true });
}
