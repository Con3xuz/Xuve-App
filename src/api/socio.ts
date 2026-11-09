/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/socio  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const socioApi = {
  /** GET /api/socio/comercial/orders */
  getComercialOrders: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/socio/comercial/orders', { params })).data,
  /** PATCH /api/socio/comercial/orders/{order_id} */
  updateOrderStatus: async <T = any>(orderId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.patch<T>(`/socio/comercial/orders/${orderId}`, body, { params })).data,
  /** GET /api/socio/comercial/products */
  getComercialProducts: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/socio/comercial/products', { params })).data,
  /** POST /api/socio/comercial/products */
  createProduct: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/socio/comercial/products', body, { params })).data,
  /** DELETE /api/socio/comercial/products/{product_id} */
  deleteProduct: async <T = any>(productId: Id, params?: Query): Promise<T> =>
    (await api.delete<T>(`/socio/comercial/products/${productId}`, { params })).data,
  /** PUT /api/socio/comercial/products/{product_id} */
  updateProduct: async <T = any>(productId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.put<T>(`/socio/comercial/products/${productId}`, body, { params })).data,
  /** GET /api/socio/comercial/profile */
  getSocioComercialProfile: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/socio/comercial/profile', { params })).data,
  /** POST /api/socio/comercial/register */
  registerSocioComercial: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/socio/comercial/register', body, { params })).data,
  /** GET /api/socio/conductor/delivery/status */
  getConductorDeliveryStatus: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/socio/conductor/delivery/status', { params })).data,
  /** POST /api/socio/conductor/delivery/toggle */
  toggleConductorDeliveryMode: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/socio/conductor/delivery/toggle', body, { params })).data,
  /** POST /api/socio/conductor/go-offline */
  socioConductorGoOffline: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/socio/conductor/go-offline', body, { params })).data,
  /** POST /api/socio/conductor/go-online */
  socioConductorGoOnline: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/socio/conductor/go-online', body, { params })).data,
  /** GET /api/socio/conductor/nearby */
  getNearbyConductors: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/socio/conductor/nearby', { params })).data,
  /** GET /api/socio/conductor/profile */
  getSocioConductorProfile: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/socio/conductor/profile', { params })).data,
  /** POST /api/socio/conductor/register */
  registerSocioConductor: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/socio/conductor/register', body, { params })).data,
  /** POST /api/socio/conductor/update-location */
  updateConductorLocation: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/socio/conductor/update-location', body, { params })).data,
  /** POST /api/socio/register */
  registerSocio: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/socio/register', body, { params })).data,
  /** GET /api/socio/repartidor/delivery/status */
  getDeliveryStatus: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/socio/repartidor/delivery/status', { params })).data,
  /** POST /api/socio/repartidor/delivery/toggle */
  toggleDeliveryMode: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/socio/repartidor/delivery/toggle', body, { params })).data,
  /** POST /api/socio/repartidor/go-offline */
  socioRepartidorGoOffline: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/socio/repartidor/go-offline', body, { params })).data,
  /** POST /api/socio/repartidor/go-online */
  socioRepartidorGoOnline: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/socio/repartidor/go-online', body, { params })).data,
  /** GET /api/socio/repartidor/nearby */
  getNearbyRepartidores: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/socio/repartidor/nearby', { params })).data,
  /** GET /api/socio/repartidor/profile */
  getSocioRepartidorProfile: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/socio/repartidor/profile', { params })).data,
  /** POST /api/socio/repartidor/register */
  registerSocioRepartidor: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/socio/repartidor/register', body, { params })).data,
};
