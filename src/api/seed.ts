/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/seed  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const seedApi = {
  /** GET /api/seed */
  seedDatabase: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/seed', { params })).data,
  /** POST /api/seed */
  seedDatabasePost: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/seed', body, { params })).data,
};
