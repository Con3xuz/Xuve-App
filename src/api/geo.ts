/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/geo  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const geoApi = {
  /** GET /api/geo/autocomplete */
  autocomplete: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/geo/autocomplete', { params })).data,
  /** GET /api/geo/directions */
  directions: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/geo/directions', { params })).data,
  /** GET /api/geo/distance-matrix */
  distanceMatrix: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/geo/distance-matrix', { params })).data,
  /** GET /api/geo/estimate-fare */
  estimateFareEndpoint: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/geo/estimate-fare', { params })).data,
  /** GET /api/geo/geocode */
  geocode: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/geo/geocode', { params })).data,
  /** GET /api/geo/place/{place_id} */
  placeDetails: async <T = any>(placeId: Id, params?: Query): Promise<T> =>
    (await api.get<T>(`/geo/place/${placeId}`, { params })).data,
  /** GET /api/geo/quote */
  quote: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/geo/quote', { params })).data,
};
