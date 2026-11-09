/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/auth  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const authApi = {
  /** POST /api/auth/forgot-password */
  forgotPassword: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/auth/forgot-password', body, { params })).data,
  /** POST /api/auth/google/session */
  googleSession: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/auth/google/session', body, { params })).data,
  /** POST /api/auth/login */
  login: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/auth/login', body, { params })).data,
  /** POST /api/auth/logout */
  logout: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/auth/logout', body, { params })).data,
  /** GET /api/auth/me */
  getMe: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/auth/me', { params })).data,
  /** PATCH /api/auth/profile */
  updateProfile: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.patch<T>('/auth/profile', body, { params })).data,
  /** POST /api/auth/register */
  register: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/auth/register', body, { params })).data,
  /** POST /api/auth/resend-verification */
  resendVerification: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/auth/resend-verification', body, { params })).data,
  /** POST /api/auth/reset-password */
  resetPassword: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/auth/reset-password', body, { params })).data,
  /** POST /api/auth/verify-email */
  verifyEmail: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/auth/verify-email', body, { params })).data,
};
