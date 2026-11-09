/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/health  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const healthApi = {
  /** GET /api/health */
  healthCheck: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/health', { params })).data,
};
