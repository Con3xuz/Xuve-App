/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/urban-linea  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const urbanLineaApi = {
  /** POST /api/urban-linea/chofer/actualizar-ubicacion */
  actualizarUbicacionUrbana: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/urban-linea/chofer/actualizar-ubicacion', body, { params })).data,
  /** POST /api/urban-linea/chofer/finalizar-recorrido */
  finalizarRecorridoUrbano: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/urban-linea/chofer/finalizar-recorrido', body, { params })).data,
  /** POST /api/urban-linea/chofer/iniciar-recorrido */
  iniciarRecorridoUrbano: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/urban-linea/chofer/iniciar-recorrido', body, { params })).data,
  /** GET /api/urban-linea/chofer/mi-asignacion */
  getMiAsignacionUrbana: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/urban-linea/chofer/mi-asignacion', { params })).data,
  /** GET /api/urban-linea/choferes */
  listarChoferesUrbanos: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/urban-linea/choferes', { params })).data,
  /** POST /api/urban-linea/choferes */
  registrarChoferUrbano: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/urban-linea/choferes', body, { params })).data,
  /** DELETE /api/urban-linea/choferes/{chofer_id} */
  eliminarChoferUrbano: async <T = any>(choferId: Id, params?: Query): Promise<T> =>
    (await api.delete<T>(`/urban-linea/choferes/${choferId}`, { params })).data,
  /** GET /api/urban-linea/mi-linea */
  getMiLineaUrbana: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/urban-linea/mi-linea', { params })).data,
  /** GET /api/urban-linea/publico/busetas-activas */
  getBusetasActivasUrbanas: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/urban-linea/publico/busetas-activas', { params })).data,
  /** POST /api/urban-linea/publico/pagar-pasaje */
  pagarPasajeUrbano: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/urban-linea/publico/pagar-pasaje', body, { params })).data,
  /** GET /api/urban-linea/publico/rutas */
  getRutasPublicasUrbanas: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/urban-linea/publico/rutas', { params })).data,
  /** POST /api/urban-linea/recargar */
  recargarWalletUrbana: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/urban-linea/recargar', body, { params })).data,
  /** POST /api/urban-linea/registro */
  registrarLineaUrbana: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/urban-linea/registro', body, { params })).data,
  /** GET /api/urban-linea/rutas */
  listarRutasUrbanas: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/urban-linea/rutas', { params })).data,
  /** POST /api/urban-linea/rutas */
  crearRutaUrbana: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/urban-linea/rutas', body, { params })).data,
  /** DELETE /api/urban-linea/rutas/{ruta_id} */
  eliminarRutaUrbana: async <T = any>(rutaId: Id, params?: Query): Promise<T> =>
    (await api.delete<T>(`/urban-linea/rutas/${rutaId}`, { params })).data,
  /** POST /api/urban-linea/rutas/{ruta_id}/asignar */
  asignarARutaUrbana: async <T = any>(rutaId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/urban-linea/rutas/${rutaId}/asignar`, body, { params })).data,
  /** DELETE /api/urban-linea/rutas/{ruta_id}/asignar/{chofer_id} */
  desasignarDeRutaUrbana: async <T = any>(rutaId: Id, choferId: Id, params?: Query): Promise<T> =>
    (await api.delete<T>(`/urban-linea/rutas/${rutaId}/asignar/${choferId}`, { params })).data,
  /** PUT /api/urban-linea/rutas/{ruta_id}/waypoints */
  actualizarWaypoints: async <T = any>(rutaId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.put<T>(`/urban-linea/rutas/${rutaId}/waypoints`, body, { params })).data,
  /** GET /api/urban-linea/vehiculos */
  listarVehiculosUrbanos: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/urban-linea/vehiculos', { params })).data,
  /** POST /api/urban-linea/vehiculos */
  registrarVehiculoUrbano: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/urban-linea/vehiculos', body, { params })).data,
  /** DELETE /api/urban-linea/vehiculos/{vehiculo_id} */
  eliminarVehiculoUrbano: async <T = any>(vehiculoId: Id, params?: Query): Promise<T> =>
    (await api.delete<T>(`/urban-linea/vehiculos/${vehiculoId}`, { params })).data,
};
