/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/sos  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const sosApi = {
  /** POST /api/sos */
  sendSosRoot: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/sos', body, { params })).data,
};
