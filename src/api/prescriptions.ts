/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/prescriptions  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const prescriptionsApi = {
  /** POST /api/prescriptions */
  createPrescription: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/prescriptions', body, { params })).data,
  /** GET /api/prescriptions/my-prescriptions */
  getDoctorPrescriptions: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/prescriptions/my-prescriptions', { params })).data,
  /** GET /api/prescriptions/patient/my-prescriptions */
  getPatientPrescriptions: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/prescriptions/patient/my-prescriptions', { params })).data,
  /** GET /api/prescriptions/pharmacy/incoming */
  getPharmacyPrescriptions: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/prescriptions/pharmacy/incoming', { params })).data,
  /** GET /api/prescriptions/stats */
  getDoctorStats: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/prescriptions/stats', { params })).data,
  /** GET /api/prescriptions/{prescription_id} */
  getPrescription: async <T = any>(prescriptionId: Id, params?: Query): Promise<T> =>
    (await api.get<T>(`/prescriptions/${prescriptionId}`, { params })).data,
  /** PUT /api/prescriptions/{prescription_id}/status */
  updatePrescriptionStatus: async <T = any>(prescriptionId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.put<T>(`/prescriptions/${prescriptionId}/status`, body, { params })).data,
};
