/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/exchange-rate  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const exchangeRateApi = {
  /** GET /api/exchange-rate */
  getExchangeRate: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/exchange-rate', { params })).data,
  /** POST /api/exchange-rate */
  setExchangeRate: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/exchange-rate', body, { params })).data,
};
