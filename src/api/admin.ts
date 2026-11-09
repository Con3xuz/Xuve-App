/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/admin  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const adminApi = {
  /** GET /api/admin/config/financial */
  getFinancialConfig: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/admin/config/financial', { params })).data,
  /** POST /api/admin/config/financial */
  updateFinancialConfig: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/admin/config/financial', body, { params })).data,
  /** GET /api/admin/drivers */
  getDriversList: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/admin/drivers', { params })).data,
  /** GET /api/admin/financial/stats */
  getFinancialStats: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/admin/financial/stats', { params })).data,
  /** GET /api/admin/kyc-requests */
  getKycRequests: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/admin/kyc-requests', { params })).data,
  /** GET /api/admin/kyc-requests/{kyc_id} */
  getKycRequestDetail: async <T = any>(kycId: Id, params?: Query): Promise<T> =>
    (await api.get<T>(`/admin/kyc-requests/${kycId}`, { params })).data,
  /** POST /api/admin/kyc-requests/{kyc_id}/approve */
  approveKycRequest: async <T = any>(kycId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/admin/kyc-requests/${kycId}/approve`, body, { params })).data,
  /** POST /api/admin/kyc-requests/{kyc_id}/reject */
  rejectKycRequest: async <T = any>(kycId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/admin/kyc-requests/${kycId}/reject`, body, { params })).data,
  /** GET /api/admin/kyc/all-pending */
  getAllPendingKyc: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/admin/kyc/all-pending', { params })).data,
  /** POST /api/admin/kyc/comercial/{socio_id}/approve */
  approveComercialKyc: async <T = any>(socioId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/admin/kyc/comercial/${socioId}/approve`, body, { params })).data,
  /** POST /api/admin/kyc/conductor/{socio_id}/approve */
  approveConductorKyc: async <T = any>(socioId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/admin/kyc/conductor/${socioId}/approve`, body, { params })).data,
  /** GET /api/admin/kyc/pending */
  getPendingKyc: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/admin/kyc/pending', { params })).data,
  /** POST /api/admin/kyc/repartidor/{socio_id}/approve */
  approveRepartidorKyc: async <T = any>(socioId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/admin/kyc/repartidor/${socioId}/approve`, body, { params })).data,
  /** POST /api/admin/kyc/{type}/{entity_id}/approve */
  approveEntityKyc: async <T = any>(type: Id, entityId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/admin/kyc/${type}/${entityId}/approve`, body, { params })).data,
  /** POST /api/admin/kyc/{type}/{entity_id}/reject */
  rejectEntityKyc: async <T = any>(type: Id, entityId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/admin/kyc/${type}/${entityId}/reject`, body, { params })).data,
  /** GET /api/admin/stats */
  getAdminStats: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/admin/stats', { params })).data,
  /** GET /api/admin/transactions */
  getTransactionsList: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/admin/transactions', { params })).data,
  /** GET /api/admin/verticales/carga */
  getCargaStats: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/admin/verticales/carga', { params })).data,
  /** GET /api/admin/verticales/rent-a-car */
  getRentStats: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/admin/verticales/rent-a-car', { params })).data,
  /** GET /api/admin/verticales/terminales */
  getTerminalesStats: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/admin/verticales/terminales', { params })).data,
  /** GET /api/admin/verticales/urbanas */
  getLineasUrbanas: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/admin/verticales/urbanas', { params })).data,
};
