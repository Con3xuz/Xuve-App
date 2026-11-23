import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZE, SPACING } from '../constants/theme';
import { reverseGeocodeLocation } from '../lib/geo';
import type {
  MapLocation,
  NearbyDriver,
} from './mapHtml';
import {
  generateLeafletMapHtml,
  MERIDA_CENTER,
} from './mapHtml';

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

  const htmlContent = useMemo(() => {
    return generateLeafletMapHtml({
      origin,
      destination,
      routeCoordinates,
      nearbyDrivers,
      isConductorMode,
    });
  }, [origin, destination, routeCoordinates, nearbyDrivers, isConductorMode]);

  const handleMessage = async (event: any) => {
    try {
      const rawData = event.nativeEvent?.data;
      if (!rawData) return;
      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

      if (data.type === 'MAP_CLICK') {
        const lat = data.latitude;
        const lng = data.longitude;
        const addressName = await reverseGeocodeLocation(lat, lng);
        const loc: MapLocation = { latitude: lat, longitude: lng, name: addressName };
        if (onMapPress) onMapPress(loc);
      } else if (data.type === 'ORIGIN_DRAGGED') {
        const lat = data.latitude;
        const lng = data.longitude;
        const addressName = await reverseGeocodeLocation(lat, lng);
        if (onOriginChange) onOriginChange({ latitude: lat, longitude: lng, name: addressName });
      } else if (data.type === 'DEST_DRAGGED') {
        const lat = data.latitude;
        const lng = data.longitude;
        const addressName = await reverseGeocodeLocation(lat, lng);
        if (onDestinationChange) onDestinationChange({ latitude: lat, longitude: lng, name: addressName });
      } else if (data.type === 'USER_LOCATED') {
        const lat = data.latitude;
        const lng = data.longitude;
        const addressName = await reverseGeocodeLocation(lat, lng);
        if (onUserLocate) onUserLocate({ latitude: lat, longitude: lng, name: addressName });
      }
    } catch (err) {
      console.warn('Error parsing WebView map message:', err);
    }
  };

  return (
    <View style={[styles.mapContainer, style]}>
      {/* Route Badge */}
      {distanceText && durationText && (
        <View style={styles.routeBadge}>
          <Ionicons name="navigate" size={14} color={COLORS.primary} />
          <Text style={styles.routeBadgeText}>
            {distanceText} • ~{durationText}
          </Text>
        </View>
      )}

      {/* Embedded Native WebView with Leaflet Dark Mode */}
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        geolocationEnabled={true}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
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
  webview: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  routeBadge: {
    position: 'absolute',
    top: 10,
    left: 12,
    zIndex: 10,
    backgroundColor: 'rgba(10, 10, 18, 0.88)',
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
