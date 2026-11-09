/**
 * Cliente HTTP central de XUVE.
 * ============================
 * Axios apuntando al backend de producciÃ³n (https://api.xuve.net) con prefijo /api.
 * Gestiona el token de sesiÃ³n: lo persiste de forma segura y lo inyecta como
 * `Authorization: Bearer <token>` en cada peticiÃ³n.
 *
 * El backend acepta tanto cookie de sesiÃ³n como header Bearer (ver utils/auth.py),
 * asÃ­ que en mÃ³vil usamos Bearer (las cookies no son fiables en React Native).
 *
 * La URL base se puede sobreescribir con EXPO_PUBLIC_BACKEND_URL para apuntar a
 * un backend local/staging durante el desarrollo.
 */
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'xuve_session_token';

// ProducciÃ³n por defecto; configurable por entorno para dev/staging.
export const BASE_URL =
  (process.env.EXPO_PUBLIC_BACKEND_URL?.replace(/\/+$/, '') ||
    'https://api.xuve.net') + '/api';

// --- Persistencia del token --------------------------------------------------
// SecureStore no existe en web; ahÃ­ caemos a localStorage.
const isWeb = Platform.OS === 'web';

export async function setToken(token: string): Promise<void> {
  if (isWeb) {
    try {
      globalThis.localStorage?.setItem(TOKEN_KEY, token);
    } catch {
      /* almacenamiento no disponible */
    }
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  if (isWeb) {
    try {
      return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  if (isWeb) {
    try {
      globalThis.localStorage?.removeItem(TOKEN_KEY);
    } catch {
      /* noop */
    }
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// --- Instancia de axios ------------------------------------------------------
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
  // Permite que el backend setee/lea la cookie de sesiÃ³n en web.
  withCredentials: true,
});

// Inyecta el Bearer token (si existe) en cada peticiÃ³n.
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
