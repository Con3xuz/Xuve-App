/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/user  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const userApi = {
  /** GET /api/user/dashboard-route */
  getUserDashboardRoute: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/user/dashboard-route', { params })).data,
  /** GET /api/user/profile */
  getUserProfile: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/user/profile', { params })).data,
};
