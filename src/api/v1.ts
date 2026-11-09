/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/v1  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const v1Api = {
  /** GET /api/v1/user/payment-methods */
  listPaymentMethods: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/v1/user/payment-methods', { params })).data,
  /** POST /api/v1/user/payment-methods */
  registerPaymentMethod: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/v1/user/payment-methods', body, { params })).data,
  /** POST /api/v1/user/payment-methods/pre-validate */
  preValidate: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/v1/user/payment-methods/pre-validate', body, { params })).data,
};
