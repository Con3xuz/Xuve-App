/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/services  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const servicesApi = {
  /** GET /api/services/active */
  getActiveServices: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/services/active', { params })).data,
  /** GET /api/services/driver/pending */
  getDriverPendingServices: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/services/driver/pending', { params })).data,
  /** GET /api/services/history */
  getServiceHistory: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/services/history', { params })).data,
  /** POST /api/services/provider/availability */
  updateProviderAvailability: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/services/provider/availability', body, { params })).data,
  /** POST /api/services/request */
  requestService: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/services/request', body, { params })).data,
  /** POST /api/services/sos */
  sendSos: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/services/sos', body, { params })).data,
  /** GET /api/services/{service_id} */
  getService: async <T = any>(serviceId: Id, params?: Query): Promise<T> =>
    (await api.get<T>(`/services/${serviceId}`, { params })).data,
  /** POST /api/services/{service_id}/accept */
  acceptService: async <T = any>(serviceId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/services/${serviceId}/accept`, body, { params })).data,
  /** POST /api/services/{service_id}/complete */
  completeService: async <T = any>(serviceId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/services/${serviceId}/complete`, body, { params })).data,
  /** GET /api/services/{service_id}/match */
  findMatches: async <T = any>(serviceId: Id, params?: Query): Promise<T> =>
    (await api.get<T>(`/services/${serviceId}/match`, { params })).data,
  /** GET /api/services/{service_id}/messages */
  getMessages: async <T = any>(serviceId: Id, params?: Query): Promise<T> =>
    (await api.get<T>(`/services/${serviceId}/messages`, { params })).data,
  /** POST /api/services/{service_id}/messages */
  sendMessage: async <T = any>(serviceId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/services/${serviceId}/messages`, body, { params })).data,
  /** POST /api/services/{service_id}/rate */
  rateService: async <T = any>(serviceId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/services/${serviceId}/rate`, body, { params })).data,
  /** GET /api/services/{service_id}/rating */
  getServiceRatings: async <T = any>(serviceId: Id, params?: Query): Promise<T> =>
    (await api.get<T>(`/services/${serviceId}/rating`, { params })).data,
  /** POST /api/services/{service_id}/reject */
  rejectService: async <T = any>(serviceId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/services/${serviceId}/reject`, body, { params })).data,
};
