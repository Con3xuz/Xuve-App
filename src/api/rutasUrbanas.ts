/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/rutas-urbanas  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const rutasUrbanasApi = {
  /** POST /api/rutas-urbanas/actualizar-ubicacion */
  actualizarUbicacion: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/rutas-urbanas/actualizar-ubicacion', body, { params })).data,
  /** GET /api/rutas-urbanas/busetas-activas */
  getBusetasActivas: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/rutas-urbanas/busetas-activas', { params })).data,
  /** GET /api/rutas-urbanas/busetas-activas/{ruta_id} */
  getBusetasPorRuta: async <T = any>(rutaId: Id, params?: Query): Promise<T> =>
    (await api.get<T>(`/rutas-urbanas/busetas-activas/${rutaId}`, { params })).data,
  /** POST /api/rutas-urbanas/finalizar-recorrido */
  finalizarRecorrido: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/rutas-urbanas/finalizar-recorrido', body, { params })).data,
  /** POST /api/rutas-urbanas/iniciar-recorrido */
  iniciarRecorrido: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/rutas-urbanas/iniciar-recorrido', body, { params })).data,
  /** GET /api/rutas-urbanas/mi-asignacion */
  getMiAsignacion: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/rutas-urbanas/mi-asignacion', { params })).data,
  /** GET /api/rutas-urbanas/mis-pasajes */
  getMisPasajes: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/rutas-urbanas/mis-pasajes', { params })).data,
  /** POST /api/rutas-urbanas/pagar-pasaje */
  pagarPasaje: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/rutas-urbanas/pagar-pasaje', body, { params })).data,
  /** GET /api/rutas-urbanas/rutas */
  listarRutas: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/rutas-urbanas/rutas', { params })).data,
  /** POST /api/rutas-urbanas/rutas */
  crearRuta: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/rutas-urbanas/rutas', body, { params })).data,
  /** GET /api/rutas-urbanas/rutas-publicas */
  getRutasPublicas: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/rutas-urbanas/rutas-publicas', { params })).data,
  /** DELETE /api/rutas-urbanas/rutas/{ruta_id} */
  eliminarRuta: async <T = any>(rutaId: Id, params?: Query): Promise<T> =>
    (await api.delete<T>(`/rutas-urbanas/rutas/${rutaId}`, { params })).data,
  /** POST /api/rutas-urbanas/rutas/{ruta_id}/asignar */
  asignarChoferVehiculo: async <T = any>(rutaId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/rutas-urbanas/rutas/${rutaId}/asignar`, body, { params })).data,
  /** DELETE /api/rutas-urbanas/rutas/{ruta_id}/asignar/{chofer_id} */
  desasignarChofer: async <T = any>(rutaId: Id, choferId: Id, params?: Query): Promise<T> =>
    (await api.delete<T>(`/rutas-urbanas/rutas/${rutaId}/asignar/${choferId}`, { params })).data,
};
