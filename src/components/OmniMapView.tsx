import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, BORDER_RADIUS } from '../constants/theme';

const MERIDA_CENTER = {
  latitude: 8.5957,
  longitude: -71.1437,
};

interface Location {
  latitude: number;
  longitude: number;
  name?: string;
}

interface OmniMapViewProps {
  origin?: Location | null;
  destination?: Location | null;
  onMapPress?: (location: Location) => void;
  style?: any;
  showUserLocation?: boolean;
  routeCoordinates?: Location[];
}

export default function OmniMapView({ origin, destination, style, routeCoordinates }: OmniMapViewProps) {
  const htmlContent = useMemo(() => {
    const centerLat = origin?.latitude || MERIDA_CENTER.latitude;
    const centerLng = origin?.longitude || MERIDA_CENTER.longitude;
    const zoom = origin && destination ? 13 : origin ? 15 : 14;

    let markersCode = '';
    if (origin) {
      markersCode += `L.circleMarker([${origin.latitude},${origin.longitude}],{radius:8,color:'#fff',fillColor:'#4DFF91',fillOpacity:1,weight:2}).addTo(map).bindPopup('${origin.name || "Origen"}');`;
    }
    if (destination) {
      markersCode += `L.circleMarker([${destination.latitude},${destination.longitude}],{radius:8,color:'#fff',fillColor:'#FF4444',fillOpacity:1,weight:2}).addTo(map).bindPopup('${destination.name || "Destino"}');`;
    }

    let routeCode = '';
    if (routeCoordinates && routeCoordinates.length > 1) {
      // Ruta REAL (polyline de Directions vía proxy). Trazo sólido siguiendo calles.
      const pts = routeCoordinates.map((c) => `[${c.latitude},${c.longitude}]`).join(',');
      routeCode = `var rt=L.polyline([${pts}],{color:'#4DFF91',weight:4,opacity:0.9}).addTo(map);map.fitBounds(rt.getBounds(),{padding:[30,30]});`;
    } else if (origin && destination) {
      // Fallback: línea recta punteada mientras no haya ruta calculada.
      routeCode = `L.polyline([[${origin.latitude},${origin.longitude}],[${destination.latitude},${destination.longitude}]],{color:'#4DFF91',weight:3,opacity:0.8,dashArray:'8,6'}).addTo(map);map.fitBounds([[${origin.latitude},${origin.longitude}],[${destination.latitude},${destination.longitude}]],{padding:[30,30]});`;
    }

    return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>*{margin:0;padding:0}#map{width:100%;height:100vh}
.leaflet-control-zoom a{background:#1a1a1a!important;color:#4DFF91!important;border-color:#333!important}
.leaflet-control-attribution{display:none!important}
</style></head><body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:true,attributionControl:false}).setView([${centerLat},${centerLng}],${zoom});
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:19}).addTo(map);
${markersCode}
${routeCode}
</script></body></html>`;
  }, [origin, destination, routeCoordinates]);

  return (
    <View style={[styles.mapContainer, style]}>
      {/* @ts-ignore */}
      <iframe
        srcDoc={htmlContent}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: 16,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    width: '100%',
    height: 220,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
});
