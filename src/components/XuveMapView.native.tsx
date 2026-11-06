import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const MERIDA_CENTER = {
  latitude: 8.5957,
  longitude: -71.1437,
  latitudeDelta: 0.025,
  longitudeDelta: 0.025,
};

interface Location {
  latitude: number;
  longitude: number;
  name?: string;
}

interface XuveMapViewProps {
  origin?: Location | null;
  destination?: Location | null;
  onMapPress?: (location: Location) => void;
  style?: any;
  showUserLocation?: boolean;
  routeCoordinates?: Location[];
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a50' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d32' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
];

export default function XuveMapView({ origin, destination, onMapPress, style, showUserLocation, routeCoordinates }: XuveMapViewProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (mapRef.current && origin && destination) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: origin.latitude, longitude: origin.longitude },
          { latitude: destination.latitude, longitude: destination.longitude },
        ],
        {
          edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
          animated: true,
        }
      );
    } else if (mapRef.current && origin) {
      mapRef.current.animateToRegion({
        latitude: origin.latitude,
        longitude: origin.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  }, [origin, destination]);

  return (
    <View style={[styles.mapContainer, style]}>
      <MapView
        ref={mapRef}
        style={styles.nativeMap}
        initialRegion={MERIDA_CENTER}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        onPress={(e) => {
          if (onMapPress) {
            onMapPress({
              latitude: e.nativeEvent.coordinate.latitude,
              longitude: e.nativeEvent.coordinate.longitude,
            });
          }
        }}
        customMapStyle={darkMapStyle}
      >
        {origin && (
          <Marker
            coordinate={{ latitude: origin.latitude, longitude: origin.longitude }}
            title={origin.name || 'Origen'}
            pinColor={COLORS.primary}
          />
        )}
        {destination && (
          <Marker
            coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
            title={destination.name || 'Destino'}
            pinColor="#FF4444"
          />
        )}
        {routeCoordinates && routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={COLORS.primary}
            strokeWidth={4}
          />
        )}
      </MapView>
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
  nativeMap: {
    width: '100%',
    height: '100%',
  },
});
