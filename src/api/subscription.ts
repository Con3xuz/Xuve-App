/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/subscription  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const subscriptionApi = {
  /** POST /api/subscription/activate */
  activateMySubscription: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/subscription/activate', body, { params })).data,
  /** GET /api/subscription/admin/stats */
  getAdminSubscriptionStats: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/subscription/admin/stats', { params })).data,
  /** POST /api/subscription/deactivate */
  deactivateMySubscription: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/subscription/deactivate', body, { params })).data,
  /** GET /api/subscription/info */
  getSubscriptionInfo: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/subscription/info', { params })).data,
  /** GET /api/subscription/status */
  getMySubscriptionStatus: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/subscription/status', { params })).data,
};
