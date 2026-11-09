// entities/user/hooks/useCurrentUser.ts
// Hook centralizado para datos del usuario autenticado.
// Reemplaza el patrón manual: useState + useEffect + api.get('/auth/me').

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { authApi } from '../../../api';
import { computeWalletSummary } from '../types';
import type { User, WalletSummary } from '../types';

// Query key como constante exportada: permite invalidar desde cualquier hook
export const USER_QUERY_KEY = ['user', 'me'] as const;

// ─── Hook principal ──────────────────────────────────────────────────────────

/**
 * Obtiene y cachea los datos frescos del usuario desde el backend.
 * - Sincroniza el authStore si los datos del servidor difieren del token en caché.
 * - staleTime 2 min: rápido para cambios de balance/kyc sin saturar el server.
 */
export function useCurrentUser() {
  const token = useAuthStore((s) => s.token);
  const updateUser = useAuthStore((s) => s.updateUser);

  return useQuery<User, Error>({
    queryKey: USER_QUERY_KEY,
    queryFn: async () => {
      const data = await authApi.getMe<User>();
      // Mantiene el authStore sincronizado con la respuesta del servidor
      updateUser(data);
      return data;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 2,    // 2 min
    gcTime:    1000 * 60 * 10,   // 10 min en caché tras quedar inactivo
    retry: 1,
  });
}

// ─── Hook derivado: balance de billetera ─────────────────────────────────────

/**
 * Retorna el resumen de la billetera del usuario desde el authStore (síncrono).
 * No dispara fetch — usa el estado ya cargado. Úsalo cuando solo necesitas
 * mostrar el balance sin esperar una respuesta de red.
 */
export function useWalletSummary(): WalletSummary {
  const user = useAuthStore((s) => s.user);
  return computeWalletSummary({
    wallet_balance: user?.wallet_balance ?? 0,
    wallet_held:    user?.wallet_held    ?? 0,
  });
}

// ─── Utilidad: invalidar usuario manualmente ─────────────────────────────────

/**
 * Retorna una función para forzar un refetch del usuario.
 * Úsalo después de operaciones que mutan el perfil (ej. recargar wallet).
 *
 * @example
 *   const invalidateUser = useInvalidateUser();
 *   await rechargeWallet();
 *   invalidateUser();
 */
export function useInvalidateUser() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
}
