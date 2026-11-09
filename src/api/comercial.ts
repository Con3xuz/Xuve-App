/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/comercial  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const comercialApi = {
  /** GET /api/comercial/categories */
  getAllCategories: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/comercial/categories', { params })).data,
  /** GET /api/comercial/orders/active */
  getActiveOrders: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/comercial/orders/active', { params })).data,
  /** GET /api/comercial/orders/history */
  getOrderHistory: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/comercial/orders/history', { params })).data,
  /** GET /api/comercial/orders/incoming */
  getIncomingOrders: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/comercial/orders/incoming', { params })).data,
  /** GET /api/comercial/orders/stats/today */
  getTodayStats: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/comercial/orders/stats/today', { params })).data,
  /** POST /api/comercial/orders/{order_id}/accept */
  acceptOrder: async <T = any>(orderId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/comercial/orders/${orderId}/accept`, body, { params })).data,
  /** POST /api/comercial/orders/{order_id}/ready */
  markOrderReady: async <T = any>(orderId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/comercial/orders/${orderId}/ready`, body, { params })).data,
  /** POST /api/comercial/orders/{order_id}/reject */
  rejectOrder: async <T = any>(orderId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/comercial/orders/${orderId}/reject`, body, { params })).data,
  /** GET /api/comercial/profile */
  getStoreProfile: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/comercial/profile', { params })).data,
  /** POST /api/comercial/profile/setup */
  setupStoreProfile: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/comercial/profile/setup', body, { params })).data,
  /** PATCH /api/comercial/profile/toggle-open */
  toggleStoreOpen: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.patch<T>('/comercial/profile/toggle-open', body, { params })).data,
  /** POST /api/comercial/register */
  registerComercialStore: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/comercial/register', body, { params })).data,
  /** GET /api/comercial/stores/all */
  getAllStores: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/comercial/stores/all', { params })).data,
  /** GET /api/comercial/stores/by-category/{category} */
  getStoresByCategory: async <T = any>(category: Id, params?: Query): Promise<T> =>
    (await api.get<T>(`/comercial/stores/by-category/${category}`, { params })).data,
};
