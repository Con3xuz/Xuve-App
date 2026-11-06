import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuthStore } from '../stores/authStore';
import { Button, Input } from '../components/ui';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import api from '../lib/api';
import { showServiceNotification } from '../utils/notifications';
import LocationSearchInput from '../components/LocationSearchInput';
import OmniMapView from '../components/OmniMapView';
import { useQuote } from '../hooks/useQuote';
import { VEHICLE_OPTIONS } from '../features/rides';

const SERVICE_TYPES = [
  { id: 'ride', label: 'Ride', icon: 'car', desc: 'Transporte personal' },
  { id: 'delivery', label: 'Delivery', icon: 'bicycle', desc: 'Entrega de productos' },
];

export default function RequestServiceScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [serviceType, setServiceType] = useState('ride');
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState('mototaxi');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Cotización (ruta + tarifa por vehículo) en una sola llamada cuando hay
  // origen + destino en modo 'ride'.
  const { quote, loading: quoteLoading } = useQuote(
    pickupLocation,
    serviceType === 'ride' ? dropoffLocation : null,
  );

  // Tarifa del vehículo seleccionado (para resaltar y para el payload).
  const selectedFare = quote?.fares.find((f) => f.vehicle_type === selectedVehicle);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu ubicación para solicitar servicios.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setPickupLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación.');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleRequestService = async () => {
    if (!pickupLocation) {
      Alert.alert('Error', 'Se requiere tu ubicación actual.');
      return;
    }

    setLoading(true);
    try {
      const serviceData = {
        service_type: serviceType,
        pickup_lat: pickupLocation.latitude,
        pickup_lng: pickupLocation.longitude,
        dropoff_lat: dropoffLocation?.latitude,
        dropoff_lng: dropoffLocation?.longitude,
        dropoff_address: dropoffLocation?.name,
        vehicle_preference: serviceType === 'ride' ? selectedVehicle : undefined,
        estimated_fare: serviceType === 'ride' ? selectedFare?.estimated_fare : undefined,
        notes: notes.trim() || null,
      };

      const response = await api.post('/services/request', serviceData);
      const service = response.data;

      showServiceNotification('requested');
      Alert.alert(
        'Servicio Solicitado',
        'Tu solicitud ha sido enviada. Buscando proveedores cercanos...',
        [
          {
            text: 'Ver Estado',
            onPress: () => router.push(`/service/${service.service_id}`),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo solicitar el servicio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Solicitar Servicio</Text>
        </View>

        {/* Service Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿Qué necesitas?</Text>
          <View style={styles.serviceTypes}>
            {SERVICE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.serviceTypeCard,
                  serviceType === type.id && styles.serviceTypeCardActive,
                ]}
                onPress={() => setServiceType(type.id)}
              >
                <Ionicons
                  name={type.icon}
                  size={24}
                  color={serviceType === type.id ? COLORS.primary : COLORS.textSecondary}
                />
                <Text style={[
                  styles.serviceTypeLabel,
                  serviceType === type.id && styles.serviceTypeLabelActive,
                ]}>
                  {type.label}
                </Text>
                <Text style={styles.serviceTypeDesc}>{type.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicación</Text>
          
          <View style={styles.locationCard}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Punto de recogida</Text>
              {pickupLocation ? (
                <Text style={styles.locationText}>
                  {pickupLocation.latitude.toFixed(4)}, {pickupLocation.longitude.toFixed(4)}
                </Text>
              ) : (
                <Text style={styles.locationText}>Obteniendo ubicación...</Text>
              )}
            </View>
            <TouchableOpacity onPress={getCurrentLocation} disabled={gettingLocation}>
              {gettingLocation ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons name="refresh" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          </View>

          {serviceType === 'ride' && (
            <View style={{ zIndex: 100 }}>
              <Text style={styles.locationLabel}>Destino</Text>
              <LocationSearchInput
                placeholder="¿A dónde vas? (Destino)"
                value={dropoffLocation}
                onLocationSelect={setDropoffLocation}
                dotColor={COLORS.secondary}
                iconColor={COLORS.secondary}
                biasLocation={pickupLocation}
              />
            </View>
          )}
        </View>

        {/* Mapa con la ruta real (Directions vía proxy del backend) */}
        {pickupLocation && (
          <View style={styles.section}>
            <OmniMapView
              origin={pickupLocation}
              destination={serviceType === 'ride' ? dropoffLocation : null}
              routeCoordinates={quote?.polyline}
              showUserLocation
              style={styles.mapView}
            />
            {serviceType === 'ride' && dropoffLocation && (
              <View style={styles.routeInfo}>
                {quoteLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : quote ? (
                  <>
                    <View style={styles.routeInfoItem}>
                      <Ionicons name="navigate" size={16} color={COLORS.primary} />
                      <Text style={styles.routeInfoText}>{quote.distance_text}</Text>
                    </View>
                    <View style={styles.routeInfoItem}>
                      <Ionicons name="time" size={16} color={COLORS.primary} />
                      <Text style={styles.routeInfoText}>{quote.duration_text}</Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.routeInfoText}>Ruta no disponible</Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Selección de vehículo con tarifa estimada (solo 'ride' con destino) */}
        {serviceType === 'ride' && dropoffLocation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Elige tu vehículo</Text>
            {quoteLoading && !quote ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
            ) : (
              VEHICLE_OPTIONS.map((option) => {
                const fare = quote?.fares.find((f) => f.vehicle_type === option.id);
                const active = selectedVehicle === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.vehicleCard, active && styles.vehicleCardActive]}
                    onPress={() => setSelectedVehicle(option.id)}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color={active ? COLORS.primary : COLORS.textSecondary}
                    />
                    <View style={styles.vehicleInfo}>
                      <Text style={[styles.vehicleLabel, active && styles.vehicleLabelActive]}>
                        {option.label}
                      </Text>
                      <Text style={styles.vehicleEta}>
                        {quote ? quote.duration_text : option.estimatedTime}
                      </Text>
                    </View>
                    <Text style={[styles.vehiclePrice, active && styles.vehiclePriceActive]}>
                      {fare ? `$${fare.estimated_fare.toFixed(2)}` : '—'}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas adicionales</Text>
          <Input
            placeholder="Ej: Urgente, equipaje grande, etc."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />
        </View>

        {/* Request Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={
              serviceType === 'ride' && selectedFare
                ? `SOLICITAR • $${selectedFare.estimated_fare.toFixed(2)}`
                : 'SOLICITAR SERVICIO'
            }
            onPress={handleRequestService}
            loading={loading}
            disabled={!pickupLocation}
            style={styles.requestButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  serviceTypes: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  serviceTypeCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  serviceTypeCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  serviceTypeLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  serviceTypeLabelActive: {
    color: COLORS.primary,
  },
  serviceTypeDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  locationInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  locationLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  locationText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  mapView: {
    marginTop: SPACING.md,
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    marginTop: SPACING.md,
    minHeight: 24,
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  routeInfoText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  vehicleLabelActive: {
    color: COLORS.text,
  },
  vehicleEta: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  vehiclePrice: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  vehiclePriceActive: {
    color: COLORS.primary,
  },
  buttonContainer: {
    marginTop: SPACING.xl,
  },
  requestButton: {
    backgroundColor: COLORS.primary,
  },
});