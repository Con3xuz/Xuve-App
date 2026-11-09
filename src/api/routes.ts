/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/routes  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const routesApi = {
  /** GET /api/routes */
  getFixedRoutes: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/routes', { params })).data,
  /** POST /api/routes */
  createRoute: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/routes', body, { params })).data,
  /** GET /api/routes/{route_id} */
  getRoute: async <T = any>(routeId: Id, params?: Query): Promise<T> =>
    (await api.get<T>(`/routes/${routeId}`, { params })).data,
};
