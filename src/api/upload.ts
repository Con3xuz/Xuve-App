/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/upload  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const uploadApi = {
  /** POST /api/upload/image */
  uploadImage: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/upload/image', body, { params, headers: { 'Content-Type': 'multipart/form-data' } })).data,
};
