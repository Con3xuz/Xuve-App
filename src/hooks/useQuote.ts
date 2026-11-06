/**
 * useQuote — cotización del viaje (ruta + tarifas por vehículo) vía el proxy.
 * ==========================================================================
 * Una sola llamada a /api/geo/quote devuelve el polyline para el mapa y la
 * tarifa estimada de cada tipo de vehículo, para comparar precios antes de
 * confirmar. Maneja loading/error y cancelación.
 */
import { useState, useEffect } from 'react';
import { getQuote, RouteQuote, LatLng } from '../lib/geo';

export function useQuote(
  origin?: LatLng | null,
  destination?: LatLng | null,
  vehicleTypes?: string[],
) {
  const [quote, setQuote] = useState<RouteQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!origin || !destination) {
      setQuote(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getQuote(origin, destination, vehicleTypes)
      .then((q) => {
        if (!cancelled) setQuote(q);
      })
      .catch(() => {
        if (!cancelled) {
          setError('No se pudo estimar la tarifa');
          setQuote(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // Recalcula solo cuando cambian las coordenadas.
  }, [origin?.latitude, origin?.longitude, destination?.latitude, destination?.longitude]);

  return { quote, loading, error };
}
