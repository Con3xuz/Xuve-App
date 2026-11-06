// features/rides/hooks/useRequestRide.ts
// Mutación para solicitar un viaje. Encapsula toda la lógica de:
//   - Transformar el modelo de la UI al payload del API (camelCase → snake_case)
//   - Navegar a la pantalla de viaje activo al éxito
//   - Invalidar caché de servicios para reflejar el nuevo servicio

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import api from '../../../lib/api';
import { validateRideRequest } from '../types';
import type { RideRequest, RideRequestPayload, Service } from '../types';

// ─── Query keys relacionados ──────────────────────────────────────────────────

export const SERVICES_QUERY_KEY = ['services'] as const;

// ─── Tipos de resultado del hook ─────────────────────────────────────────────

export interface UseRequestRideReturn {
  requestRide: (request: RideRequest) => void;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
}

// ─── Hook principal ──────────────────────────────────────────────────────────

/**
 * Encapsula la solicitud de un viaje al backend.
 *
 * Uso típico en el componente:
 * ```tsx
 * const { requestRide, isLoading, isError, error } = useRequestRide();
 *
 * const handleSubmit = () => {
 *   const validation = validateRideRequest(origin, destination, vehicle, payment);
 *   if (!validation.valid) {
 *     Alert.alert('Atención', validation.message);
 *     return;
 *   }
 *   requestRide({ origin, destination, vehicleType: vehicle, paymentMethod: payment });
 * };
 * ```
 */
export function useRequestRide(): UseRequestRideReturn {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation<Service, Error, RideRequest>({
    mutationFn: async (request: RideRequest) => {
      const payload: RideRequestPayload = {
        service_type:        request.vehicleType,
        origin_lat:          request.origin.latitude,
        origin_lng:          request.origin.longitude,
        destination_lat:     request.destination.latitude,
        destination_lng:     request.destination.longitude,
        origin_address:      request.origin.name,
        destination_address: request.destination.name,
        payment_method:      request.paymentMethod,
      };
      const { data } = await api.post<Service>('/services/request', payload);
      return data;
    },
    onSuccess: () => {
      // Invalida el caché de servicios activos para que active-ride los recargue
      queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY });
      router.push('/(main)/active-ride');
    },
  });

  return {
    requestRide: mutation.mutate,
    isLoading:   mutation.isPending,
    isError:     mutation.isError,
    error:       mutation.error,
    reset:       mutation.reset,
  };
}

// ─── Re-exporta la validación para que el componente no importe de types.ts ──
// (El componente solo necesita importar desde hooks/, no desde types.ts directamente)
export { validateRideRequest };
