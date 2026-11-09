/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/wallet  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const walletApi = {
  /** GET /api/wallet/balance */
  getWalletBalance: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/wallet/balance', { params })).data,
  /** POST /api/wallet/hold */
  createWalletHold: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/wallet/hold', body, { params })).data,
  /** POST /api/wallet/hold/{hold_id}/charge */
  chargeWalletHold: async <T = any>(holdId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/wallet/hold/${holdId}/charge`, body, { params })).data,
  /** POST /api/wallet/hold/{hold_id}/release */
  releaseWalletHold: async <T = any>(holdId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/wallet/hold/${holdId}/release`, body, { params })).data,
  /** GET /api/wallet/holds */
  getWalletHolds: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/wallet/holds', { params })).data,
  /** POST /api/wallet/recharge */
  rechargeWallet: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/wallet/recharge', body, { params })).data,
  /** GET /api/wallet/transactions */
  getTransactions: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/wallet/transactions', { params })).data,
  /** POST /api/wallet/withdraw */
  withdrawWallet: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/wallet/withdraw', body, { params })).data,
};
