/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/notifications  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const notificationsApi = {
  /** GET /api/notifications */
  getNotifications: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/notifications', { params })).data,
  /** POST /api/notifications/read-all */
  markAllAsRead: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/notifications/read-all', body, { params })).data,
  /** DELETE /api/notifications/{notification_id} */
  deleteNotification: async <T = any>(notificationId: Id, params?: Query): Promise<T> =>
    (await api.delete<T>(`/notifications/${notificationId}`, { params })).data,
  /** POST /api/notifications/{notification_id}/read */
  markAsRead: async <T = any>(notificationId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/notifications/${notificationId}/read`, body, { params })).data,
};
