/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/root  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const rootApi = {
  /** GET /api/ */
  root: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/', { params })).data,
};
