/**
 * Cliente de geolocalización de XUVE.
 * ===================================
 * TODO el acceso a Google Maps pasa por el backend (/api/geo/*), nunca directo.
 * Así la API key facturable (Places, Directions, Distance Matrix, Geocoding) vive
 * SOLO en el servidor. El render del mapa usa otra llave distinta vía Maps SDK.
 */
import { geoApi } from '../api';

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
  try {
    const params: Record<string, any> = { query };
    if (bias) {
      params.lat = bias.latitude;
      params.lng = bias.longitude;
    }
    const data = await geoApi.autocomplete(params);
    if (data && data.predictions && data.predictions.length > 0) {
      return data.predictions;
    }
  } catch (err) {
    console.warn('Backend autocomplete fallback:', err);
  }

  // Fallback directo con OpenStreetMap Nominatim a nivel nacional
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Venezuela')}&format=json&countrycodes=ve&limit=8`;
    const res = await fetch(url, { headers: { 'User-Agent': 'XuveApp/2.0' } });
    if (res.ok) {
      const list = await res.json();
      return list.map((item: any) => {
        const parts = (item.display_name || '').split(',');
        return {
          place_id: `osm_${item.place_id}`,
          mainText: parts[0]?.trim() || item.name || query,
          secondaryText: parts.slice(1, 4).join(',').trim() || 'Venezuela',
          description: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        };
      });
    }
  } catch (e) {
    /* noop */
  }

  return [];
}

/** Resuelve un place_id (de autocompletePlaces) a coordenadas + dirección. */
export async function getPlaceDetails(placeId: string): Promise<GeoPlace> {
  return geoApi.placeDetails(placeId);
}

/** Geocoding directo: texto -> coordenadas. */
export async function geocodeAddress(address: string): Promise<GeoPlace[]> {
  const data = await geoApi.geocode({ address });
  return (data.results ?? []).map((r: any) => ({
    place_id: '',
    name: r.address,
    address: r.address,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

/** Geocoding inverso: coordenadas -> nombre legible de dirección. */
export async function reverseGeocodeLocation(lat: number, lng: number): Promise<string> {
  try {
    const data = await geoApi.reverseGeocode({ lat, lng });
    return data.name || data.address || `Punto (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  } catch {
    return `Punto (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  }
}

/** Ruta entre dos puntos: distancia, duración y polyline listo para el mapa. */
export async function getDirections(origin: LatLng, destination: LatLng): Promise<GeoRoute> {
  return geoApi.directions({
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
  });
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
  return geoApi.quote({
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
    ...(vehicleTypes ? { vehicle_types: vehicleTypes.join(',') } : {}),
  });
}
