/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/linea  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const lineaApi = {
  /** GET /api/linea/choferes */
  listarChoferes: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/linea/choferes', { params })).data,
  /** POST /api/linea/choferes */
  registrarChofer: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/linea/choferes', body, { params })).data,
  /** DELETE /api/linea/choferes/{chofer_id} */
  eliminarChofer: async <T = any>(choferId: Id, params?: Query): Promise<T> =>
    (await api.delete<T>(`/linea/choferes/${choferId}`, { params })).data,
  /** GET /api/linea/mi-linea */
  getMiLinea: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/linea/mi-linea', { params })).data,
  /** GET /api/linea/mis-reservas */
  getMisReservas: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/linea/mis-reservas', { params })).data,
  /** POST /api/linea/recargar */
  recargarWalletLinea: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/linea/recargar', body, { params })).data,
  /** POST /api/linea/registro */
  registrarLinea: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/linea/registro', body, { params })).data,
  /** DELETE /api/linea/reservas/{reserva_id} */
  cancelarReserva: async <T = any>(reservaId: Id, params?: Query): Promise<T> =>
    (await api.delete<T>(`/linea/reservas/${reservaId}`, { params })).data,
  /** GET /api/linea/rutas-populares */
  getRutasPopulares: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/linea/rutas-populares', { params })).data,
  /** GET /api/linea/vehiculos */
  listarVehiculos: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/linea/vehiculos', { params })).data,
  /** POST /api/linea/vehiculos */
  registrarVehiculo: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/linea/vehiculos', body, { params })).data,
  /** DELETE /api/linea/vehiculos/{vehiculo_id} */
  eliminarVehiculo: async <T = any>(vehiculoId: Id, params?: Query): Promise<T> =>
    (await api.delete<T>(`/linea/vehiculos/${vehiculoId}`, { params })).data,
  /** GET /api/linea/viajes */
  listarMisViajes: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/linea/viajes', { params })).data,
  /** POST /api/linea/viajes */
  crearViaje: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/linea/viajes', body, { params })).data,
  /** GET /api/linea/viajes/buscar */
  buscarViajes: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/linea/viajes/buscar', { params })).data,
  /** DELETE /api/linea/viajes/{viaje_id} */
  cancelarViaje: async <T = any>(viajeId: Id, params?: Query): Promise<T> =>
    (await api.delete<T>(`/linea/viajes/${viajeId}`, { params })).data,
  /** GET /api/linea/viajes/{viaje_id} */
  getViajeDetalle: async <T = any>(viajeId: Id, params?: Query): Promise<T> =>
    (await api.get<T>(`/linea/viajes/${viajeId}`, { params })).data,
  /** PATCH /api/linea/viajes/{viaje_id}/asignar-chofer */
  asignarChofer: async <T = any>(viajeId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.patch<T>(`/linea/viajes/${viajeId}/asignar-chofer`, body, { params })).data,
  /** POST /api/linea/viajes/{viaje_id}/completar */
  completarViaje: async <T = any>(viajeId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/linea/viajes/${viajeId}/completar`, body, { params })).data,
  /** POST /api/linea/viajes/{viaje_id}/comprar */
  comprarBoletos: async <T = any>(viajeId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/linea/viajes/${viajeId}/comprar`, body, { params })).data,
  /** POST /api/linea/viajes/{viaje_id}/iniciar */
  iniciarViaje: async <T = any>(viajeId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/linea/viajes/${viajeId}/iniciar`, body, { params })).data,
};
