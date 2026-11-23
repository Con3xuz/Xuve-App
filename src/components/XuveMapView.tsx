import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZE, SPACING } from '../constants/theme';
import { reverseGeocodeLocation } from '../lib/geo';
import type { MapLocation, NearbyDriver } from './mapHtml';
import { MERIDA_CENTER } from './mapHtml';

export type { MapLocation, NearbyDriver };
export { MERIDA_CENTER };

interface XuveMapViewProps {
  origin?: MapLocation | null;
  destination?: MapLocation | null;
  onMapPress?: (location: MapLocation) => void;
  onOriginChange?: (location: MapLocation) => void;
  onDestinationChange?: (location: MapLocation) => void;
  onUserLocate?: (location: MapLocation) => void;
  style?: any;
  showUserLocation?: boolean;
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  nearbyDrivers?: NearbyDriver[];
  distanceText?: string;
  durationText?: string;
  selectionMode?: 'origin' | 'destination' | 'auto';
  isConductorMode?: boolean;
}

export default function XuveMapView({
  origin,
  destination,
  onMapPress,
  onOriginChange,
  onDestinationChange,
  onUserLocate,
  style,
  routeCoordinates,
  nearbyDrivers,
  distanceText,
  durationText,
  isConductorMode = false,
}: XuveMapViewProps) {
  const containerRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const originMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const driversLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);

  // Instancia de Leaflet cargada dinámicamente en cliente (SSR-safe)
  const [L, setL] = useState<any>(null);

  const centerLat = origin?.latitude || destination?.latitude || MERIDA_CENTER.latitude;
  const centerLng = origin?.longitude || destination?.longitude || MERIDA_CENTER.longitude;

  // Cargar Leaflet solo en el navegador (evita error 'window is not defined' en SSR
  // y evita chunks asyncRequire interceptados por extensiones del navegador)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('leaflet');
      setL(mod.default || mod);
    } catch (err) {
      console.warn('Error cargando módulo Leaflet en cliente:', err);
    }
  }, []);

  // Conductores cercanos
  const driversToRender = useMemo(() => {
    if (nearbyDrivers && nearbyDrivers.length > 0) return nearbyDrivers;
    return [
      { id: 'd1', latitude: centerLat + 0.0035, longitude: centerLng + 0.0028, vehicle_type: 'car' },
      { id: 'd2', latitude: centerLat - 0.0028, longitude: centerLng + 0.0041, vehicle_type: 'moto' },
      { id: 'd3', latitude: centerLat + 0.0019, longitude: centerLng - 0.0036, vehicle_type: 'car' },
      { id: 'd4', latitude: centerLat - 0.0042, longitude: centerLng - 0.0018, vehicle_type: 'car' },
    ];
  }, [nearbyDrivers, centerLat, centerLng]);

  // 1. Inicialización del mapa en cuanto Leaflet y el contenedor estén listos
  useEffect(() => {
    if (!L || Platform.OS !== 'web' || typeof window === 'undefined') return;

    const el = containerRef.current;
    if (!el || mapInstanceRef.current) return;

    try {
      const initialZoom = origin && destination ? 13 : origin ? 15 : 14;

      const map = L.map(el, {
        zoomControl: true,
        attributionControl: false,
      }).setView([centerLat, centerLng], initialZoom);

      // Usar OpenStreetMap directo (100% libre de bloqueos de adblockers)
      const osmUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      L.tileLayer(osmUrl, {
        maxZoom: 19,
        className: 'dark-tiles',
      }).addTo(map);

      // Evento de clic en el mapa para fijar origen o destino
      map.on('click', async (e: any) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        const address = await reverseGeocodeLocation(lat, lng);
        if (onMapPress) {
          onMapPress({ latitude: lat, longitude: lng, name: address });
        }
      });

      mapInstanceRef.current = map;

      // InvalidateSize en varios frames para acomodar la carga del layout
      const timers = [150, 500, 1200].map((delay) =>
        setTimeout(() => {
          if (mapInstanceRef.current === map) {
            map.invalidateSize();
          }
        }, delay)
      );

      const handleResize = () => {
        if (mapInstanceRef.current === map) {
          map.invalidateSize();
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        timers.forEach((id) => clearTimeout(id));
        window.removeEventListener('resize', handleResize);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    } catch (err) {
      console.warn('Error inicializando mapa local:', err);
    }
  }, [L]);

  // 2. Actualizar marcadores de origen, destino, conductores y ruta
  useEffect(() => {
    if (!L) return;
    const map = mapInstanceRef.current;
    if (!map) return;

    // Marcador de Origen
    if (originMarkerRef.current) {
      map.removeLayer(originMarkerRef.current);
      originMarkerRef.current = null;
    }
    if (origin) {
      const originIcon = L.divIcon({
        className: 'custom-pin-pickup',
        html: '<div style="width:36px;height:36px;border-radius:18px;background:#10B981;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 14px rgba(0,0,0,0.8);cursor:grab">📍</div>',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });
      const marker = L.marker([origin.latitude, origin.longitude], {
        icon: originIcon,
        draggable: true,
      }).addTo(map);
      marker.bindPopup(`<b style="color:#10B981">Punto de Recogida</b><br>${origin.name || 'Origen'}`);
      marker.on('dragend', async (e: any) => {
        const pos = e.target.getLatLng();
        const address = await reverseGeocodeLocation(pos.lat, pos.lng);
        if (onOriginChange) onOriginChange({ latitude: pos.lat, longitude: pos.lng, name: address });
      });
      originMarkerRef.current = marker;
    }

    // Marcador de Destino
    if (destMarkerRef.current) {
      map.removeLayer(destMarkerRef.current);
      destMarkerRef.current = null;
    }
    if (destination) {
      const destIcon = L.divIcon({
        className: 'custom-pin-dropoff',
        html: '<div style="width:36px;height:36px;border-radius:18px;background:#EF4444;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 14px rgba(0,0,0,0.8);cursor:grab">🎯</div>',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });
      const marker = L.marker([destination.latitude, destination.longitude], {
        icon: destIcon,
        draggable: true,
      }).addTo(map);
      marker.bindPopup(`<b style="color:#EF4444">Destino</b><br>${destination.name || 'Destino'}`);
      marker.on('dragend', async (e: any) => {
        const pos = e.target.getLatLng();
        const address = await reverseGeocodeLocation(pos.lat, pos.lng);
        if (onDestinationChange) onDestinationChange({ latitude: pos.lat, longitude: pos.lng, name: address });
      });
      destMarkerRef.current = marker;
    }

    // Conductores
    if (driversLayerRef.current) {
      map.removeLayer(driversLayerRef.current);
      driversLayerRef.current = null;
    }
    const dGroup = L.layerGroup();
    driversToRender.forEach((d) => {
      const isMoto = d.vehicle_type === 'moto' || d.vehicle_type === 'mototaxi';
      const icon = L.divIcon({
        html: `<div style="width:28px;height:28px;border-radius:14px;background:#1e1e2d;border:1.5px solid #F59E0B;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 0 10px rgba(245,158,11,0.6)">${isMoto ? '🛵' : '🚗'}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([d.latitude, d.longitude], { icon }).addTo(dGroup);
    });
    dGroup.addTo(map);
    driversLayerRef.current = dGroup;

    // Ruta
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (routeCoordinates && routeCoordinates.length > 1) {
      const pts = routeCoordinates.map((c) => [c.latitude, c.longitude]);
      const poly = L.polyline(pts, { color: '#4DFF91', weight: 5, opacity: 0.95 }).addTo(map);
      map.fitBounds(poly.getBounds(), { padding: [35, 35] });
      routeLayerRef.current = poly;
    } else if (origin && destination) {
      const dashed = L.polyline(
        [[origin.latitude, origin.longitude], [destination.latitude, destination.longitude]],
        { color: '#4DFF91', weight: 3, opacity: 0.85, dashArray: '6,8' }
      ).addTo(map);
      map.fitBounds(dashed.getBounds(), { padding: [35, 35] });
      routeLayerRef.current = dashed;
    } else if (origin) {
      map.setView([origin.latitude, origin.longitude], 15);
    }
  }, [L, origin, destination, routeCoordinates, driversToRender]);

  // Manejo de ubicación GPS
  const handleGPSLocate = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const address = await reverseGeocodeLocation(lat, lng);
          const loc: MapLocation = { latitude: lat, longitude: lng, name: address };

          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.2 });
          }
          if (onUserLocate) onUserLocate(loc);
        },
        (err) => {
          console.warn('GPS error:', err);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  return (
    <View style={[styles.mapContainer, style]}>
      {/* Contenedor del mapa Leaflet montado en DOM local */}
      <View
        // @ts-ignore
        ref={containerRef}
        style={styles.domMap}
      />

      {/* Estilos CSS embebidos completos para Leaflet sin advertencias de imágenes relativas */}
      {Platform.OS === 'web' && (
        <style
          // @ts-ignore
          dangerouslySetInnerHTML={{
            __html: `
              .leaflet-pane, .leaflet-tile, .leaflet-marker-icon, .leaflet-marker-shadow,
              .leaflet-tile-container, .leaflet-pane > svg, .leaflet-pane > canvas,
              .leaflet-zoom-box, .leaflet-image-layer, .leaflet-layer {
                position: absolute;
                left: 0;
                top: 0;
              }
              .leaflet-container {
                overflow: hidden;
                position: relative;
                width: 100%;
                height: 100%;
                background: #0a0a0f !important;
                font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
                -webkit-tap-highlight-color: transparent;
              }
              .leaflet-tile {
                filter: inherit;
                visibility: hidden;
                user-select: none;
                -webkit-user-select: none;
                -webkit-user-drag: none;
              }
              .leaflet-tile-loaded {
                visibility: inherit;
              }
              .dark-tiles {
                filter: brightness(0.65) invert(1) contrast(3) hue-rotate(200deg) saturate(0.35) brightness(0.8);
              }
              .leaflet-control-zoom {
                border: none !important;
                margin: 10px !important;
                position: absolute;
                top: 0;
                left: 0;
                z-index: 500;
              }
              .leaflet-control-zoom a {
                background: #161622 !important;
                color: #4DFF91 !important;
                border: 1px solid #2a2a3e !important;
                border-radius: 8px !important;
                width: 32px !important;
                height: 32px !important;
                line-height: 30px !important;
                font-size: 16px !important;
                font-weight: bold !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                margin-bottom: 4px !important;
                text-decoration: none !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.6) !important;
                cursor: pointer !important;
              }
              .leaflet-control-zoom a:hover {
                background: #222238 !important;
                color: #00F0FF !important;
              }
              .leaflet-popup {
                position: absolute;
                text-align: center;
                margin-bottom: 20px;
                z-index: 700;
              }
              .leaflet-popup-content-wrapper {
                background: #181826 !important;
                color: #fff !important;
                border-radius: 12px !important;
                border: 1px solid #33334d !important;
                box-shadow: 0 8px 24px rgba(0,0,0,0.8) !important;
                font-size: 12px !important;
                padding: 4px !important;
                text-align: left;
              }
              .leaflet-popup-tip-container {
                width: 40px;
                height: 20px;
                position: absolute;
                left: 50%;
                margin-left: -20px;
                overflow: hidden;
                pointer-events: none;
              }
              .leaflet-popup-tip {
                background: #181826 !important;
                width: 17px;
                height: 17px;
                padding: 1px;
                margin: -10px auto 0;
                transform: rotate(45deg);
              }
            `,
          }}
        />
      )}

      {/* Indicador superior */}
      <View style={styles.mapHintBadge}>
        <View style={styles.dotHint} />
        <Text style={styles.mapHintText}>
          {isConductorMode ? 'Zona de cobertura activa' : 'Toca el mapa para fijar tu ubicación'}
        </Text>
      </View>

      {/* Botón flotante de GPS */}
      <TouchableOpacity style={styles.gpsButton} onPress={handleGPSLocate}>
        <Ionicons name="locate" size={20} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Badge informativo de ruta */}
      {distanceText && durationText && (
        <View style={styles.routeBadge}>
          <Ionicons name="navigate" size={14} color={COLORS.primary} />
          <Text style={styles.routeBadgeText}>
            {distanceText} • ~{durationText}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    width: '100%',
    height: 260,
    minHeight: 260,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: '#0a0a0f',
    borderWidth: 1.5,
    borderColor: 'rgba(77, 255, 145, 0.25)',
    position: 'relative',
  },
  domMap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#0a0a0f',
    zIndex: 1,
  },
  mapHintBadge: {
    position: 'absolute',
    top: 10,
    left: 12,
    zIndex: 10,
    backgroundColor: 'rgba(10, 10, 18, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(77, 255, 145, 0.3)',
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotHint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4DFF91',
  },
  mapHintText: {
    fontSize: FONT_SIZE.xs - 1,
    fontWeight: '600',
    color: '#fff',
  },
  gpsButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#161622',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  routeBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    zIndex: 10,
    backgroundColor: 'rgba(10, 10, 18, 0.92)',
    borderWidth: 1,
    borderColor: COLORS.primary + '60',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  routeBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
});
