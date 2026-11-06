/**
 * Cliente de geolocalización de XUVE.
 * ===================================
 * TODO el acceso a Google Maps pasa por el backend (/api/geo/*), nunca directo.
 * Así la API key facturable (Places, Directions, Distance Matrix, Geocoding) vive
 * SOLO en el servidor. El render del mapa usa otra llave distinta vía Maps SDK.
 */
import api from './api';

export interface GeoPrediction {
  place_id: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

export interface GeoPlace {
  place_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface GeoRoute {
  distance_m: number;
  distance_text: string;
  duration_s: number;
  duration_text: string;
  polyline: LatLng[];
}

export interface FareQuote {
  vehicle_type: string;
  vehicle_class: 'moto' | 'auto';
  currency: string;
  distance_km: number;
  duration_min: number;
  min_fare: number;
  per_km: number;
  distance_fare: number;
  floor_applied: boolean;
  estimated_fare: number;
}

export interface RouteQuote {
  distance_text: string;
  duration_text: string;
  distance_m: number;
  duration_s: number;
  polyline: LatLng[];
  fares: FareQuote[];
}

/**
 * Autocompletado de direcciones a nivel nacional (Venezuela).
 * Si se pasa `bias` (GPS del usuario), prioriza resultados de su zona.
 */
export async function autocompletePlaces(
  query: string,
  bias?: LatLng | null,
): Promise<GeoPrediction[]> {
  const params: Record<string, any> = { query };
  if (bias) {
    params.lat = bias.latitude;
    params.lng = bias.longitude;
  }
  const { data } = await api.get('/geo/autocomplete', { params });
  return data.predictions ?? [];
}

/** Resuelve un place_id (de autocompletePlaces) a coordenadas + dirección. */
export async function getPlaceDetails(placeId: string): Promise<GeoPlace> {
  const { data } = await api.get(`/geo/place/${placeId}`);
  return data;
}

/** Geocoding directo: texto -> coordenadas. */
export async function geocodeAddress(address: string): Promise<GeoPlace[]> {
  const { data } = await api.get('/geo/geocode', { params: { address } });
  return (data.results ?? []).map((r: any) => ({
    place_id: '',
    name: r.address,
    address: r.address,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

/** Ruta entre dos puntos: distancia, duración y polyline listo para el mapa. */
export async function getDirections(origin: LatLng, destination: LatLng): Promise<GeoRoute> {
  const { data } = await api.get('/geo/directions', {
    params: {
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
    },
  });
  return data;
}

/**
 * Cotización completa en una sola llamada: ruta (polyline + ETA) + tarifa
 * estimada por cada tipo de vehículo. Evita pedir Directions una vez por vehículo.
 */
export async function getQuote(
  origin: LatLng,
  destination: LatLng,
  vehicleTypes?: string[],
): Promise<RouteQuote> {
  const { data } = await api.get('/geo/quote', {
    params: {
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      ...(vehicleTypes ? { vehicle_types: vehicleTypes.join(',') } : {}),
    },
  });
  return data;
}
