/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/market  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const marketApi = {
  /** GET /api/market/delivery/pending */
  getPendingDeliveries: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/market/delivery/pending', { params })).data,
  /** POST /api/market/delivery/{order_id}/accept */
  acceptDelivery: async <T = any>(orderId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/market/delivery/${orderId}/accept`, body, { params })).data,
  /** GET /api/market/orders */
  getUserOrders: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/market/orders', { params })).data,
  /** POST /api/market/orders */
  createOrder: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/market/orders', body, { params })).data,
  /** GET /api/market/orders/delivery/pending */
  getPendingDeliveryOrders: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/market/orders/delivery/pending', { params })).data,
  /** GET /api/market/orders/{order_id} */
  getOrder: async <T = any>(orderId: Id, params?: Query): Promise<T> =>
    (await api.get<T>(`/market/orders/${orderId}`, { params })).data,
  /** POST /api/market/orders/{order_id}/accept-delivery */
  acceptOrderDelivery: async <T = any>(orderId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/market/orders/${orderId}/accept-delivery`, body, { params })).data,
  /** POST /api/market/orders/{order_id}/complete */
  completeOrder: async <T = any>(orderId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/market/orders/${orderId}/complete`, body, { params })).data,
  /** POST /api/market/orders/{order_id}/confirm */
  confirmOrder: async <T = any>(orderId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/market/orders/${orderId}/confirm`, body, { params })).data,
  /** GET /api/market/products */
  getAllProducts: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/market/products', { params })).data,
  /** GET /api/market/stores */
  getMarketStores: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/market/stores', { params })).data,
  /** GET /api/market/stores/{store_id} */
  getStore: async <T = any>(storeId: Id, params?: Query): Promise<T> =>
    (await api.get<T>(`/market/stores/${storeId}`, { params })).data,
  /** GET /api/market/stores/{store_id}/products */
  getStoreProducts: async <T = any>(storeId: Id, params?: Query): Promise<T> =>
    (await api.get<T>(`/market/stores/${storeId}/products`, { params })).data,
};
