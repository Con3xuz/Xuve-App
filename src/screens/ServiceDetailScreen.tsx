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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import api from '../lib/api';
import { showServiceNotification } from '../utils/notifications';

interface Service {
  service_id: string;
  service_type: string;
  status: string;
  driver_id?: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat?: number;
  dropoff_lng?: number;
  created_at: string;
}

interface Match {
  provider_id: string;
  distance_km: number;
  estimated_time_min: number;
}

export default function ServiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();

  const [service, setService] = useState<Service | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchServiceDetails = async () => {
    try {
      // Fetch service details
      const serviceRes = await api.get(`/services/${id}`);
      setService(serviceRes.data);

      // If pending, fetch matches
      if (serviceRes.data.status === 'pending') {
        const matchRes = await api.get(`/services/${id}/match`);
        setMatches(matchRes.data.matches || []);
        if (matchRes.data.matches?.length > 0) {
          showServiceNotification('matched', { count: matchRes.data.matches.length });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar los detalles del servicio');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServiceDetails();
  }, [id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchServiceDetails();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando servicio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>Servicio no encontrado</Text>
          <Button title="Volver" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = {
    pending: { label: 'Buscando proveedores', color: COLORS.warning, icon: 'search' },
    matching: { label: 'Encontrando match', color: COLORS.info, icon: 'people' },
    accepted: { label: 'Aceptado', color: COLORS.success, icon: 'checkmark-circle' },
    in_progress: { label: 'En progreso', color: COLORS.secondary, icon: 'car' },
    completed: { label: 'Completado', color: COLORS.success, icon: 'checkmark-done' },
    cancelled: { label: 'Cancelado', color: COLORS.error, icon: 'close-circle' },
  };

  const currentStatus = statusConfig[service.status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Servicio #{service.service_id.slice(-8)}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIcon, { backgroundColor: currentStatus.color + '20' }]}>
            <Ionicons name={currentStatus.icon as any} size={32} color={currentStatus.color} />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>{currentStatus.label}</Text>
            <Text style={styles.statusTime}>
              {new Date(service.created_at).toLocaleString('es-VE')}
            </Text>
          </View>
        </View>

        {/* Service Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Detalles del Servicio</Text>
          <View style={styles.detailRow}>
            <Ionicons name="car" size={20} color={COLORS.primary} />
            <Text style={styles.detailText}>
              Tipo: {service.service_type === 'ride' ? 'Transporte' : 'Delivery'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.detailText}>
              Origen: {service.pickup_lat?.toFixed(4)}, {service.pickup_lng?.toFixed(4)}
            </Text>
          </View>
          {service.dropoff_lat && (
            <View style={styles.detailRow}>
              <Ionicons name="flag" size={20} color={COLORS.secondary} />
              <Text style={styles.detailText}>
                Destino: {service.dropoff_lat.toFixed(4)}, {service.dropoff_lng?.toFixed(4)}
              </Text>
            </View>
          )}
        </View>

        {/* Matches Section */}
        {service.status === 'pending' && matches.length > 0 && (
          <View style={styles.matchesCard}>
            <Text style={styles.sectionTitle}>Proveedores Cercanos</Text>
            {matches.map((match, index) => (
              <View key={match.provider_id} style={styles.matchItem}>
                <View style={styles.matchInfo}>
                  <Text style={styles.matchTitle}>Proveedor #{index + 1}</Text>
                  <Text style={styles.matchDetails}>
                    Distancia: {match.distance_km.toFixed(1)} km
                  </Text>
                  <Text style={styles.matchDetails}>
                    Tiempo estimado: {match.estimated_time_min} min
                  </Text>
                </View>
                <Ionicons name="person-circle" size={40} color={COLORS.primary} />
              </View>
            ))}
            <Text style={styles.matchesNote}>
              Esperando que un proveedor acepte tu solicitud...
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsCard}>
          {service.status === 'pending' && (
            <Button
              title="Buscar Nuevamente"
              onPress={handleRefresh}
              style={styles.actionButton}
            />
          )}
          {service.status === 'accepted' && (
            <Button
              title="Ver en Mapa"
              onPress={() => Alert.alert('Próximamente', 'Mapa disponible en la siguiente fase')}
              style={styles.actionButton}
            />
          )}
          <Button
            title="💬 Chat del Servicio"
            onPress={() => {
              const query = `?serviceType=${encodeURIComponent(service.service_type)}${service.driver_id ? `&providerId=${encodeURIComponent(service.driver_id)}` : ''}`;
              router.push(`/chat/${service.service_id}${query}`);
            }}
            style={{ ...styles.actionButton, backgroundColor: COLORS.info }}
          />
          <Button
            title="Contactar Soporte"
            onPress={() => Alert.alert('Soporte', 'Funcionalidad próximamente')}
            style={{ ...styles.actionButton, backgroundColor: COLORS.secondary }}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.error,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  backButton: {
    padding: SPACING.sm,
  },
  refreshButton: {
    padding: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statusTime: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  detailsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  detailText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  matchesCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  matchInfo: {
    flex: 1,
  },
  matchTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  matchDetails: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  matchesNote: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  actionsCard: {
    marginTop: SPACING.md,
  },
  actionButton: {
    marginBottom: SPACING.md,
  },
});