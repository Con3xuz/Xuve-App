// features/rides/hooks/useExchangeRate.ts
// Tasa de cambio USD → Bs. Se usa en la UI para mostrar precios en bolívares.
// Tiene staleTime alto porque la tasa no cambia cada segundo.

import { useQuery } from '@tanstack/react-query';
import { exchangeRateApi } from '../../../api';
import type { ExchangeRate } from '../types';

export const EXCHANGE_RATE_QUERY_KEY = ['exchange-rate'] as const;

// ─── Hook principal ──────────────────────────────────────────────────────────

/**
 * Obtiene la tasa de cambio USD → Bs desde el backend.
 *
 * - staleTime 10 min: evita requests innecesarios al cambiar de tab.
 * - gcTime 30 min: permanece en caché aunque el componente se desmonte.
 * - retry 1: si falla una vez no insiste; la UI muestra el campo vacío.
 */
export function useExchangeRate() {
  return useQuery<ExchangeRate, Error>({
    queryKey: EXCHANGE_RATE_QUERY_KEY,
    queryFn: async () => {
      return exchangeRateApi.getExchangeRate<ExchangeRate>();
    },
    staleTime: 1000 * 60 * 10,   // 10 min
    gcTime:    1000 * 60 * 30,   // 30 min
    retry: 1,
  });
}

// ─── Utilidad: conversión de moneda ──────────────────────────────────────────

/**
 * Convierte un monto en USD a Bolívares usando la tasa actual.
 * Retorna null si la tasa aún no se ha cargado.
 *
 * @example
 *   const { convertToBs } = useExchangeRate();
 *   const priceInBs = convertToBs(2.50); // → "9.375,00 Bs"
 */
export function useConvertToBs() {
  const { data: rate } = useExchangeRate();

  return (usdAmount: number): string | null => {
    if (rate == null) return null;
    const bs = usdAmount * rate.usd_to_bs;
    return bs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Bs';
  };
}
