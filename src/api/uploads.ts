/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/uploads  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const uploadsApi = {
  /** GET /api/uploads/{filename} */
  getUploadedFile: async <T = any>(filename: Id, params?: Query): Promise<T> =>
    (await api.get<T>(`/uploads/${filename}`, { params })).data,
};
