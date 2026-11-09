/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/chat  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const chatApi = {
  /** GET /api/chat/conversations */
  getConversations: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/chat/conversations', { params })).data,
  /** POST /api/chat/conversations */
  createConversation: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/chat/conversations', body, { params })).data,
  /** GET /api/chat/conversations/{conversation_id}/messages */
  getMessages: async <T = any>(conversationId: Id, params?: Query): Promise<T> =>
    (await api.get<T>(`/chat/conversations/${conversationId}/messages`, { params })).data,
  /** POST /api/chat/conversations/{conversation_id}/messages */
  sendMessage: async <T = any>(conversationId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/chat/conversations/${conversationId}/messages`, body, { params })).data,
  /** POST /api/chat/service */
  createServiceConversation: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/chat/service', body, { params })).data,
  /** GET /api/chat/service/{service_type}/{service_id} */
  getServiceConversation: async <T = any>(serviceType: Id, serviceId: Id, params?: Query): Promise<T> =>
    (await api.get<T>(`/chat/service/${serviceType}/${serviceId}`, { params })).data,
};
