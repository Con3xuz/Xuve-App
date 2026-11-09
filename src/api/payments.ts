/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/payments  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const paymentsApi = {
  /** POST /api/payments/simulate/{reference} */
  simulatePayment: async <T = any>(reference: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/payments/simulate/${reference}`, body, { params })).data,
  /** POST /api/payments/subscribe */
  subscribe: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/payments/subscribe', body, { params })).data,
  /** GET /api/payments/subscription-status */
  subscriptionStatus: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/payments/subscription-status', { params })).data,
  /** POST /api/payments/webhook */
  paymentsWebhook: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/payments/webhook', body, { params })).data,
};
