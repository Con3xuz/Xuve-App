/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/kyc  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const kycApi = {
  /** POST /api/kyc/admin/approve/{kyc_id} */
  adminApproveKyc: async <T = any>(kycId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/kyc/admin/approve/${kycId}`, body, { params })).data,
  /** POST /api/kyc/admin/reject/{kyc_id} */
  adminRejectKyc: async <T = any>(kycId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/kyc/admin/reject/${kycId}`, body, { params })).data,
  /** GET /api/kyc/my-status */
  getMyKycStatus: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/kyc/my-status', { params })).data,
  /** GET /api/kyc/roles-info */
  getRolesInfo: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/kyc/roles-info', { params })).data,
  /** POST /api/kyc/simulate/{kyc_id} */
  simulateKycDecision: async <T = any>(kycId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/kyc/simulate/${kycId}`, body, { params })).data,
  /** POST /api/kyc/submit */
  submitKycRequest: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/kyc/submit', body, { params })).data,
  /** POST /api/kyc/verify/driver */
  verifyDriverDossier: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/kyc/verify/driver', body, { params })).data,
  /** POST /api/kyc/verify/merchant */
  verifyMerchantDossier: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/kyc/verify/merchant', body, { params })).data,
  /** POST /api/kyc/webhook */
  kycWebhook: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/kyc/webhook', body, { params })).data,
};
