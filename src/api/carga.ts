/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/carga  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const cargaApi = {
  /** POST /api/carga/cotizacion */
  crearCotizacion: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/carga/cotizacion', body, { params })).data,
  /** POST /api/carga/cotizacion/{cotizacion_id}/aceptar */
  aceptarCotizacion: async <T = any>(cotizacionId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/carga/cotizacion/${cotizacionId}/aceptar`, body, { params })).data,
  /** POST /api/carga/cotizacion/{cotizacion_id}/completar */
  completarServicioCarga: async <T = any>(cotizacionId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/carga/cotizacion/${cotizacionId}/completar`, body, { params })).data,
  /** POST /api/carga/cotizacion/{cotizacion_id}/enviar */
  enviarCotizacionAConductores: async <T = any>(cotizacionId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/carga/cotizacion/${cotizacionId}/enviar`, body, { params })).data,
  /** GET /api/carga/mis-cotizaciones */
  getMisCotizaciones: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/carga/mis-cotizaciones', { params })).data,
  /** GET /api/carga/servicios-disponibles */
  getServiciosDisponibles: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/carga/servicios-disponibles', { params })).data,
  /** GET /api/carga/tarifas */
  getTarifas: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/carga/tarifas', { params })).data,
};
