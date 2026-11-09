/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/interurbano  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const interurbanoApi = {
  /** GET /api/interurbano/mis-reservas */
  getMisReservas: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/interurbano/mis-reservas', { params })).data,
  /** GET /api/interurbano/mis-viajes */
  getMisViajes: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/interurbano/mis-viajes', { params })).data,
  /** DELETE /api/interurbano/reservas/{reserva_id} */
  cancelarReserva: async <T = any>(reservaId: Id, params?: Query): Promise<T> =>
    (await api.delete<T>(`/interurbano/reservas/${reservaId}`, { params })).data,
  /** GET /api/interurbano/rutas-populares */
  getRutasPopulares: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/interurbano/rutas-populares', { params })).data,
  /** POST /api/interurbano/viajes */
  crearViaje: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/interurbano/viajes', body, { params })).data,
  /** GET /api/interurbano/viajes/buscar */
  buscarViajes: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/interurbano/viajes/buscar', { params })).data,
  /** DELETE /api/interurbano/viajes/{viaje_id} */
  cancelarViaje: async <T = any>(viajeId: Id, params?: Query): Promise<T> =>
    (await api.delete<T>(`/interurbano/viajes/${viajeId}`, { params })).data,
  /** GET /api/interurbano/viajes/{viaje_id} */
  getViaje: async <T = any>(viajeId: Id, params?: Query): Promise<T> =>
    (await api.get<T>(`/interurbano/viajes/${viajeId}`, { params })).data,
  /** POST /api/interurbano/viajes/{viaje_id}/completar */
  completarViaje: async <T = any>(viajeId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/interurbano/viajes/${viajeId}/completar`, body, { params })).data,
  /** POST /api/interurbano/viajes/{viaje_id}/comprar */
  comprarBoletos: async <T = any>(viajeId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/interurbano/viajes/${viajeId}/comprar`, body, { params })).data,
  /** POST /api/interurbano/viajes/{viaje_id}/iniciar */
  iniciarViaje: async <T = any>(viajeId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/interurbano/viajes/${viajeId}/iniciar`, body, { params })).data,
};
