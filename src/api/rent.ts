/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/rent  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const rentApi = {
  /** GET /api/rent/available */
  getAvailableCarsAlias: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/rent/available', { params })).data,
  /** GET /api/rent/cars */
  getAvailableCars: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/rent/cars', { params })).data,
  /** GET /api/rent/cars/{car_id} */
  getCarDetails: async <T = any>(carId: Id, params?: Query): Promise<T> =>
    (await api.get<T>(`/rent/cars/${carId}`, { params })).data,
  /** POST /api/rent/cars/{car_id}/request */
  requestRent: async <T = any>(carId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/rent/cars/${carId}/request`, body, { params })).data,
  /** GET /api/rent/my-cars */
  getMyCars: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/rent/my-cars', { params })).data,
  /** GET /api/rent/my-rentals */
  getMyRentals: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/rent/my-rentals', { params })).data,
  /** GET /api/rent/owner/requests */
  getRentRequests: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/rent/owner/requests', { params })).data,
  /** POST /api/rent/owner/requests/{request_id}/accept */
  acceptRentRequest: async <T = any>(requestId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/rent/owner/requests/${requestId}/accept`, body, { params })).data,
  /** POST /api/rent/owner/requests/{request_id}/reject */
  rejectRentRequest: async <T = any>(requestId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/rent/owner/requests/${requestId}/reject`, body, { params })).data,
  /** GET /api/rent/owner/vehicles */
  getOwnerVehicles: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/rent/owner/vehicles', { params })).data,
  /** POST /api/rent/owner/vehicles */
  createRentVehicle: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/rent/owner/vehicles', body, { params })).data,
  /** PATCH /api/rent/owner/vehicles/{vehicle_id} */
  updateRentVehicle: async <T = any>(vehicleId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.patch<T>(`/rent/owner/vehicles/${vehicleId}`, body, { params })).data,
  /** POST /api/rent/publish */
  publishCar: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/rent/publish', body, { params })).data,
  /** POST /api/rent/request */
  createRentRequest: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/rent/request', body, { params })).data,
};
