/**
 * useDirections — calcula la ruta real entre dos puntos vía el proxy del backend.
 * ==============================================================================
 * Encapsula la llamada a getDirections (/api/geo/directions) con estado de carga
 * y cancelación, para que las pantallas solo consuman { route, loading, error }.
 * La API key de Google nunca se toca aquí: todo pasa por FastAPI.
 */
import { useState, useEffect } from 'react';
import { getDirections, GeoRoute, LatLng } from '../lib/geo';

export function useDirections(
  origin?: LatLng | null,
  destination?: LatLng | null,
) {
  const [route, setRoute] = useState<GeoRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!origin || !destination) {
      setRoute(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getDirections(origin, destination)
      .then((r) => {
        if (!cancelled) setRoute(r);
      })
      .catch(() => {
        if (!cancelled) {
          setError('No se pudo calcular la ruta');
          setRoute(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // Solo recalcula cuando cambian las coordenadas, no la identidad del objeto.
  }, [origin?.latitude, origin?.longitude, destination?.latitude, destination?.longitude]);

  return { route, loading, error };
}
