/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/ratings  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const ratingsApi = {
  /** GET /api/ratings/user/{user_id} */
  getUserRatings: async <T = any>(userId: Id, params?: Query): Promise<T> =>
    (await api.get<T>(`/ratings/user/${userId}`, { params })).data,
};
