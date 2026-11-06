import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/stores/authStore';
import api from '../../src/lib/api';
import XuveMapView from '../../src/components/XuveMapView';
import { useDirections } from '../../src/hooks/useDirections';

export default function ActiveRideScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const serviceId = params.serviceId as string || 'demo';
  const { user } = useAuthStore();
  const [service, setService] = useState<any>(null);
  const [driver, setDriver] = useState<any>(null);
  const [status, setStatus] = useState('searching');

  useEffect(() => {
    // Simulate fetching service data
    setService({
      service_id: serviceId,
      status: 'in_progress',
      pickup_address: 'Centro Comercial Las Americas',
      dropoff_address: 'Universidad de Los Andes',
      pickup_lat: 8.5847,
      pickup_lng: -71.1615,
      dropoff_lat: 8.5863,
      dropoff_lng: -71.1496,
      fare: 8.50,
      vehicle_type: 'Taxi',
      payment_method: 'Pago Móvil',
    });
    setDriver({
      name: 'Carlos Méndez',
      phone: '0412-555-1234',
      rating: 4.9,
      trips_completed: 847,
      vehicle: { brand: 'Toyota', model: 'Corolla', year: '2020', color: 'Blanco', plate_number: 'ABC-123' },
    });
    setStatus('in_progress');
  }, []);

  const handleCancel = () => {
    Alert.alert('Cancelar Viaje', '¿Estás seguro?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => {
        Alert.alert('Viaje cancelado');
        router.back();
      }},
    ]);
  };

  const sendSOS = async () => {
    try {
      await api.post(`/sos?lat=8.5897&lng=-71.1561&service_id=${serviceId}`);
      Alert.alert('SOS', '¡Alerta de emergencia enviada!');
    } catch { Alert.alert('SOS enviado'); }
  };

  const STATUS_STEPS = [
    { id: 'searching', label: 'Buscando conductor', icon: 'search' },
    { id: 'accepted', label: 'Conductor en camino', icon: 'car' },
    { id: 'arrived', label: 'Conductor llegó', icon: 'flag' },
    { id: 'in_progress', label: 'En viaje', icon: 'navigate' },
    { id: 'completed', label: 'Completado', icon: 'checkmark-circle' },
  ];

  const currentStep = STATUS_STEPS.findIndex(s => s.id === status);

  // Coordenadas del viaje -> ruta real (Directions vía proxy del backend).
  const origin = service?.pickup_lat != null
    ? { latitude: service.pickup_lat, longitude: service.pickup_lng, name: service.pickup_address }
    : null;
  const destination = service?.dropoff_lat != null
    ? { latitude: service.dropoff_lat, longitude: service.dropoff_lng, name: service.dropoff_address }
    : null;
  const { route } = useDirections(origin, destination);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>VIAJE ACTIVO</Text>
        <TouchableOpacity style={styles.sosBtn} onPress={sendSOS}>
          <Text style={styles.sosBtnText}>SOS</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Mapa con la ruta real del viaje */}
        {origin && destination ? (
          <View style={styles.mapWrapper}>
            <XuveMapView
              origin={origin}
              destination={destination}
              routeCoordinates={route?.polyline}
              style={styles.mapArea}
            />
            {route && (
              <View style={styles.mapEta}>
                <Ionicons name="navigate" size={14} color={COLORS.primary} />
                <Text style={styles.mapEtaText}>{route.distance_text} • {route.duration_text}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.mapArea}>
            <Ionicons name="navigate-circle" size={64} color={COLORS.primary + '50'} />
            <Text style={styles.mapText}>Mapa en tiempo real</Text>
          </View>
        )}

        {/* Status Steps */}
        <View style={styles.stepsContainer}>
          {STATUS_STEPS.map((step, i) => (
            <View key={step.id} style={styles.stepRow}>
              <View style={[styles.stepDot, i <= currentStep && styles.stepDotActive]}>
                <Ionicons name={step.icon as any} size={14} color={i <= currentStep ? COLORS.textOnPrimary : COLORS.textLight} />
              </View>
              {i < STATUS_STEPS.length - 1 && <View style={[styles.stepLine, i < currentStep && styles.stepLineActive]} />}
              <Text style={[styles.stepLabel, i <= currentStep && styles.stepLabelActive]}>{step.label}</Text>
            </View>
          ))}
        </View>

        {/* Route */}
        {service && (
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.routeAddress}>{service.pickup_address}</Text>
            </View>
            <View style={styles.routeDivider} />
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: COLORS.accent }]} />
              <Text style={styles.routeAddress}>{service.dropoff_address}</Text>
            </View>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>{service.vehicle_type} • {service.payment_method}</Text>
              <Text style={styles.fareAmount}>${service.fare?.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Driver Info */}
        {driver && (
          <View style={styles.driverCard}>
            <View style={styles.driverHeader}>
              <View style={styles.driverAvatar}>
                <Ionicons name="person" size={28} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <View style={styles.driverMeta}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.driverRating}>{driver.rating}</Text>
                  <Text style={styles.driverTrips}>• {driver.trips_completed} viajes</Text>
                </View>
              </View>
            </View>
            {/* Vehicle */}
            <View style={styles.vehicleInfo}>
              <Ionicons name="car" size={18} color={COLORS.primary} />
              <Text style={styles.vehicleText}>{driver.vehicle.brand} {driver.vehicle.model} {driver.vehicle.year}</Text>
              <View style={styles.plateBadge}>
                <Text style={styles.plateText}>{driver.vehicle.plate_number}</Text>
              </View>
            </View>
            {/* Actions */}
            <View style={styles.driverActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/(main)/chat', params: { serviceId } })}>
                <Ionicons name="chatbubble" size={18} color={COLORS.primary} />
                <Text style={styles.actionBtnText}>Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Llamar', driver.phone)}>
                <Ionicons name="call" size={18} color={COLORS.secondary} />
                <Text style={[styles.actionBtnText, { color: COLORS.secondary }]}>Llamar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={handleCancel}>
                <Ionicons name="close" size={18} color={COLORS.accent} />
                <Text style={[styles.actionBtnText, { color: COLORS.accent }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: 'bold', color: COLORS.text, letterSpacing: 2 },
  sosBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  sosBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '900', color: '#fff' },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  mapArea: { height: 200, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xxl, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  mapWrapper: { position: 'relative', marginBottom: SPACING.md },
  mapEta: { position: 'absolute', bottom: SPACING.md + SPACING.sm, left: SPACING.sm, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.background + 'E6', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border },
  mapEtaText: { fontSize: FONT_SIZE.sm, color: COLORS.text, fontWeight: '600' },
  mapText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginTop: SPACING.sm },
  mapSubtext: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
  stepsContainer: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xxl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm, position: 'relative' },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.surfaceHighlight, justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: COLORS.primary },
  stepLine: { position: 'absolute', left: 13, top: 28, width: 2, height: 16, backgroundColor: COLORS.border },
  stepLineActive: { backgroundColor: COLORS.primary },
  stepLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textLight },
  stepLabelActive: { color: COLORS.text, fontWeight: '500' },
  routeCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xxl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  routeDot: { width: 12, height: 12, borderRadius: 6 },
  routeDivider: { width: 2, height: 20, backgroundColor: COLORS.border, marginLeft: 5, marginVertical: 2 },
  routeAddress: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.text },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  fareLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  fareAmount: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.primary },
  driverCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xxl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  driverHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  driverAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  driverName: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text },
  driverMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  driverRating: { fontSize: FONT_SIZE.sm, color: '#F59E0B', fontWeight: '500' },
  driverTrips: { fontSize: FONT_SIZE.sm, color: COLORS.textLight },
  vehicleInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surfaceHighlight, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md },
  vehicleText: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.text },
  plateBadge: { backgroundColor: COLORS.background, paddingHorizontal: SPACING.sm + 2, paddingVertical: 4, borderRadius: BORDER_RADIUS.md },
  plateText: { fontSize: FONT_SIZE.md, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 2 },
  driverActions: { flexDirection: 'row', gap: SPACING.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.xl, backgroundColor: COLORS.surfaceHighlight, borderWidth: 1, borderColor: COLORS.border },
  actionBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.primary },
  cancelBtn: { borderColor: COLORS.accent + '30' },
});
