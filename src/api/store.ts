/* eslint-disable @typescript-eslint/no-explicit-any */
// Rutas del backend bajo /api/store  (generado desde las rutas de Xuve-Api/routes)
import api from './client';

type Id = string | number;
type Query = Record<string, string | number | boolean | undefined | null>;

export const storeApi = {
  /** GET /api/store/products */
  getMyProducts: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/store/products', { params })).data,
  /** POST /api/store/products */
  createProduct: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/store/products', body, { params })).data,
  /** POST /api/store/products/bulk/delete */
  bulkDeleteProducts: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/store/products/bulk/delete', body, { params })).data,
  /** POST /api/store/products/bulk/update-availability */
  bulkUpdateAvailability: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/store/products/bulk/update-availability', body, { params })).data,
  /** POST /api/store/products/bulk/update-stock */
  bulkUpdateStock: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/store/products/bulk/update-stock', body, { params })).data,
  /** GET /api/store/products/categories/list */
  getCategories: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/store/products/categories/list', { params })).data,
  /** GET /api/store/products/categories/my-store */
  getMyStoreCategories: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/store/products/categories/my-store', { params })).data,
  /** POST /api/store/products/import/csv */
  importProductsCsv: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/store/products/import/csv', body, { params })).data,
  /** POST /api/store/products/import/preview */
  previewImport: async <T = any>(body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>('/store/products/import/preview', body, { params })).data,
  /** GET /api/store/products/import/template */
  getImportTemplate: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/store/products/import/template', { params })).data,
  /** GET /api/store/products/stats */
  getProductsStats: async <T = any>(params?: Query): Promise<T> =>
    (await api.get<T>('/store/products/stats', { params })).data,
  /** DELETE /api/store/products/{product_id} */
  deleteProduct: async <T = any>(productId: Id, params?: Query): Promise<T> =>
    (await api.delete<T>(`/store/products/${productId}`, { params })).data,
  /** GET /api/store/products/{product_id} */
  getProduct: async <T = any>(productId: Id, params?: Query): Promise<T> =>
    (await api.get<T>(`/store/products/${productId}`, { params })).data,
  /** PUT /api/store/products/{product_id} */
  updateProduct: async <T = any>(productId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.put<T>(`/store/products/${productId}`, body, { params })).data,
  /** POST /api/store/products/{product_id}/images */
  addProductImage: async <T = any>(productId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.post<T>(`/store/products/${productId}/images`, body, { params })).data,
  /** DELETE /api/store/products/{product_id}/images/{image_id} */
  removeProductImage: async <T = any>(productId: Id, imageId: Id, params?: Query): Promise<T> =>
    (await api.delete<T>(`/store/products/${productId}/images/${imageId}`, { params })).data,
  /** PUT /api/store/products/{product_id}/images/{image_id}/primary */
  setPrimaryImage: async <T = any>(productId: Id, imageId: Id, body?: unknown, params?: Query): Promise<T> =>
    (await api.put<T>(`/store/products/${productId}/images/${imageId}/primary`, body, { params })).data,
};
