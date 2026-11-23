// Generador unificado de HTML para mapas interactivos Leaflet / OSM (Web + Mobile)

export interface MapLocation {
  latitude: number;
  longitude: number;
  name: string;
}

export interface NearbyDriver {
  id: string;
  latitude: number;
  longitude: number;
  vehicle_type?: string;
}

export const MERIDA_CENTER = {
  latitude: 8.5957,
  longitude: -71.1437,
};

interface GenerateMapHtmlOptions {
  origin?: MapLocation | null;
  destination?: MapLocation | null;
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  nearbyDrivers?: NearbyDriver[];
  center?: { latitude: number; longitude: number };
  zoom?: number;
  isConductorMode?: boolean;
}

export function generateLeafletMapHtml({
  origin,
  destination,
  routeCoordinates,
  nearbyDrivers,
  center,
  zoom,
  isConductorMode = false,
}: GenerateMapHtmlOptions): string {
  const centerLat = center?.latitude || origin?.latitude || destination?.latitude || MERIDA_CENTER.latitude;
  const centerLng = center?.longitude || origin?.longitude || destination?.longitude || MERIDA_CENTER.longitude;
  const initialZoom = zoom || (origin && destination ? 13 : origin ? 15 : 14);

  const originNameJson = JSON.stringify(origin?.name || 'Punto de Recogida');
  const destNameJson = JSON.stringify(destination?.name || 'Destino');

  let originMarkerJs = '';
  if (origin) {
    originMarkerJs = `
      var originIcon = L.divIcon({
        className: 'custom-pin-pickup',
        html: '<div class="pin-halo pin-halo-pickup"></div><div class="pin-badge pin-pickup">📍</div>',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      });
      var originMarker = L.marker([${origin.latitude}, ${origin.longitude}], {
        icon: originIcon,
        draggable: true
      }).addTo(map);
      originMarker.bindPopup('<b style="color:#4DFF91">Recogida</b><br>' + ${originNameJson});
      originMarker.on('dragend', function(e) {
        var pos = e.target.getLatLng();
        postToApp('ORIGIN_DRAGGED', { latitude: pos.lat, longitude: pos.lng });
      });
    `;
  }

  let destMarkerJs = '';
  if (destination) {
    destMarkerJs = `
      var destIcon = L.divIcon({
        className: 'custom-pin-dropoff',
        html: '<div class="pin-halo pin-halo-dropoff"></div><div class="pin-badge pin-dropoff">🎯</div>',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      });
      var destMarker = L.marker([${destination.latitude}, ${destination.longitude}], {
        icon: destIcon,
        draggable: true
      }).addTo(map);
      destMarker.bindPopup('<b style="color:#FF4444">Destino</b><br>' + ${destNameJson});
      destMarker.on('dragend', function(e) {
        var pos = e.target.getLatLng();
        postToApp('DEST_DRAGGED', { latitude: pos.lat, longitude: pos.lng });
      });
    `;
  }

  let driversJs = '';
  const drivers = (nearbyDrivers && nearbyDrivers.length > 0) ? nearbyDrivers : [
    { id: 'd1', latitude: centerLat + 0.0035, longitude: centerLng + 0.0028, vehicle_type: 'car' },
    { id: 'd2', latitude: centerLat - 0.0028, longitude: centerLng + 0.0041, vehicle_type: 'moto' },
    { id: 'd3', latitude: centerLat + 0.0019, longitude: centerLng - 0.0036, vehicle_type: 'car' },
    { id: 'd4', latitude: centerLat - 0.0042, longitude: centerLng - 0.0018, vehicle_type: 'car' },
  ];

  drivers.forEach((d) => {
    const isMoto = d.vehicle_type === 'moto' || d.vehicle_type === 'mototaxi';
    const iconChar = isMoto ? '🛵' : '🚗';
    driversJs += `
      var dIcon_${d.id} = L.divIcon({
        className: 'driver-pin',
        html: '<div class="driver-bubble">${iconChar}</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      var dMarker_${d.id} = L.marker([${d.latitude}, ${d.longitude}], { icon: dIcon_${d.id} }).addTo(map);
      dMarker_${d.id}.bindTooltip('Conductor disponible', { direction: 'top', className: 'driver-tooltip' });
    `;
  });

  let routeJs = '';
  if (routeCoordinates && routeCoordinates.length > 1) {
    const pts = routeCoordinates.map((c) => `[${c.latitude},${c.longitude}]`).join(',');
    routeJs = `
      var routeUnder = L.polyline([${pts}], { color: '#000000', weight: 8, opacity: 0.6 }).addTo(map);
      var routeLine = L.polyline([${pts}], { color: '#4DFF91', weight: 5, opacity: 0.95, lineJoin: 'round' }).addTo(map);
      map.fitBounds(routeLine.getBounds(), { padding: [35, 35] });
    `;
  } else if (origin && destination) {
    routeJs = `
      var dashed = L.polyline([[${origin.latitude},${origin.longitude}],[${destination.latitude},${destination.longitude}]], {
        color: '#4DFF91', weight: 3, opacity: 0.85, dashArray: '6,8'
      }).addTo(map);
      map.fitBounds(dashed.getBounds(), { padding: [35, 35] });
    `;
  }

  const hintText = isConductorMode ? 'Zona de cobertura y solicitudes activas' : 'Toca el mapa para fijar tu ubicación';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; user-select:none; -webkit-tap-highlight-color:transparent; }
    html, body {
      width:100%; height:100%; min-height:100%; margin:0; padding:0; overflow:hidden;
      background:#0a0a0f; font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;
      position:relative;
    }
    #map {
      position:absolute; top:0; bottom:0; left:0; right:0;
      width:100%; height:100%; min-height:100%; z-index:1; background:#0a0a0f;
    }
    .leaflet-control-zoom { border:none!important; margin:12px!important; }
    .leaflet-control-zoom a {
      background:#161622!important; color:#4DFF91!important; border:1px solid #2a2a3e!important;
      border-radius:10px!important; width:34px!important; height:34px!important; line-height:32px!important;
      font-size:18px!important; font-weight:bold!important; box-shadow:0 4px 12px rgba(0,0,0,0.6)!important;
      margin-bottom:6px!important;
    }
    .leaflet-control-zoom a:hover { background:#222238!important; color:#00F0FF!important; }
    .leaflet-control-attribution { display:none!important; }
    .leaflet-popup-content-wrapper {
      background:#181826!important; color:#fff!important; border-radius:12px!important;
      border:1px solid #33334d!important; box-shadow:0 8px 24px rgba(0,0,0,0.8)!important;
      font-size:12px!important; padding:4px!important;
    }
    .leaflet-popup-tip { background:#181826!important; }
    .pin-badge {
      width:36px; height:36px; border-radius:18px; display:flex; align-items:center; justify-content:center;
      font-size:18px; border:2px solid #fff; box-shadow:0 4px 14px rgba(0,0,0,0.7); position:relative; z-index:2;
      cursor:grab;
    }
    .pin-pickup { background:#10B981; }
    .pin-dropoff { background:#EF4444; }
    .pin-halo {
      position:absolute; width:48px; height:48px; border-radius:24px; top:-6px; left:-6px;
      animation:pulseHalo 2s infinite ease-out; opacity:0.6; z-index:1;
    }
    .pin-halo-pickup { background:rgba(77,255,145,0.4); }
    .pin-halo-dropoff { background:rgba(239,68,68,0.4); }
    @keyframes pulseHalo {
      0% { transform:scale(0.7); opacity:0.8; }
      100% { transform:scale(1.4); opacity:0; }
    }
    .driver-bubble {
      width:28px; height:28px; border-radius:14px; background:#1e1e2d; border:1.5px solid #F59E0B;
      display:flex; align-items:center; justify-content:center; font-size:14px;
      box-shadow:0 0 10px rgba(245,158,11,0.5); cursor:pointer;
    }
    .driver-tooltip {
      background:#181826!important; color:#F59E0B!important; border:1px solid #F59E0B60!important;
      font-size:10px!important; font-weight:700!important; border-radius:6px!important;
    }
    .gps-btn {
      position:absolute; bottom:14px; right:14px; z-index:1000; width:42px; height:42px;
      border-radius:21px; background:#161622; border:1.5px solid #4DFF91; display:flex;
      align-items:center; justify-content:center; font-size:20px; color:#4DFF91;
      cursor:pointer; box-shadow:0 4px 16px rgba(0,0,0,0.8); transition:all .2s ease;
    }
    .gps-btn:active { transform:scale(0.92); background:#4DFF9120; }
    .map-hint {
      position:absolute; top:12px; left:50%; transform:translateX(-50%); z-index:1000;
      background:rgba(20,20,32,0.88); backdrop-filter:blur(8px); border:1px solid rgba(77,255,145,0.3);
      color:#fff; padding:6px 14px; border-radius:20px; font-size:11px; font-weight:600;
      display:flex; align-items:center; gap:6px; box-shadow:0 4px 16px rgba(0,0,0,0.5);
      pointer-events:none; white-space:nowrap;
    }
    .dot-hint { width:8px; height:8px; border-radius:4px; background:#4DFF91; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="map-hint">
    <div class="dot-hint"></div>
    <span>${hintText}</span>
  </div>
  <div class="gps-btn" id="gpsBtn" title="Ubicar mi posición">🎯</div>

  <script>
    function postToApp(type, payload) {
      var msg = Object.assign({ type: type }, payload || {});
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(msg));
        } else if (window.parent && window.parent.postMessage) {
          window.parent.postMessage(msg, '*');
        }
      } catch (err) {}
    }

    function initMap() {
      if (typeof L === 'undefined') {
        setTimeout(initMap, 60);
        return;
      }

      var mapEl = document.getElementById('map');
      if (!mapEl) {
        setTimeout(initMap, 60);
        return;
      }

      var map = L.map('map', {
        zoomControl: true,
        attributionControl: false
      }).setView([${centerLat}, ${centerLng}], ${initialZoom});

      // Múltiples fuentes de mosaicos con fallback garantizado
      var cartoDarkUrl = 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
      var osmFallbackUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

      var tileLayer = L.tileLayer(cartoDarkUrl, {
        maxZoom: 19
      });

      tileLayer.on('tileerror', function() {
        if (!window._switchedToOsm) {
          window._switchedToOsm = true;
          map.removeLayer(tileLayer);
          L.tileLayer(osmFallbackUrl, { maxZoom: 19 }).addTo(map);
        }
      });

      tileLayer.addTo(map);

      ${originMarkerJs}
      ${destMarkerJs}
      ${driversJs}
      ${routeJs}

      // Redibujado en varios intervalos por si el contenedor animó su tamaño
      setTimeout(function() { map.invalidateSize(); }, 100);
      setTimeout(function() { map.invalidateSize(); }, 350);
      setTimeout(function() { map.invalidateSize(); }, 900);
      window.addEventListener('resize', function() { map.invalidateSize(); });

      map.on('click', function(e) {
        postToApp('MAP_CLICK', {
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        });
      });

      var userMarker = null;
      var gpsBtn = document.getElementById('gpsBtn');
      if (gpsBtn) {
        gpsBtn.addEventListener('click', function() {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(pos) {
              var lat = pos.coords.latitude;
              var lng = pos.coords.longitude;
              map.flyTo([lat, lng], 15, { duration: 1.2 });
              if (!userMarker) {
                userMarker = L.circleMarker([lat, lng], {
                  radius: 9,
                  color: '#ffffff',
                  fillColor: '#00F0FF',
                  fillOpacity: 1,
                  weight: 3
                }).addTo(map).bindPopup('<b>Tu Ubicación</b>');
              } else {
                userMarker.setLatLng([lat, lng]);
              }
              postToApp('USER_LOCATED', { latitude: lat, longitude: lng });
            }, function() {
              postToApp('GPS_ERROR', { message: 'Por favor permite el acceso a tu ubicación.' });
            }, { enableHighAccuracy: true, timeout: 8000 });
          }
        });
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initMap);
    } else {
      initMap();
    }
  </script>
</body>
</html>`;
}
