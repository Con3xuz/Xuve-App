/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/driver  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const driverApi = {
  /** POST /api/driver/approve/{driver_id} */
  approveDriver: async <T = any>(driverId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/driver/approve/${driverId}`, body, { params })).data,
  /** POST /api/driver/go-offline */
  driverGoOffline: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/driver/go-offline', body, { params })).data,
  /** POST /api/driver/go-online */
  driverGoOnline: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/driver/go-online', body, { params })).data,
  /** GET /api/driver/profile */
  getDriverProfile: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/driver/profile', { params })).data,
  /** POST /api/driver/register */
  registerDriver: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/driver/register', body, { params })).data,
};
