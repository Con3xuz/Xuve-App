import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { Card } from '../../src/components/ui';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../src/constants/theme';
import api from '../../src/lib/api';

interface Service {
  service_id: string;
  service_type: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  fare: number;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: COLORS.warning },
  accepted: { label: 'Aceptado', color: COLORS.info },
  in_progress: { label: 'En progreso', color: COLORS.secondary },
  completed: { label: 'Completado', color: COLORS.success },
  cancelled: { label: 'Cancelado', color: COLORS.error },
};

export default function ServicesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeServices, setActiveServices] = useState<Service[]>([]);
  const [historyServices, setHistoryServices] = useState<Service[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      const [activeRes, historyRes] = await Promise.all([
        api.get('/services/active'),
        api.get('/services/history'),
      ]);
      setActiveServices(activeRes.data || []);
      setHistoryServices(historyRes.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  };

  const services = activeTab === 'active' ? activeServices : historyServices;

  const renderServiceCard = (service: Service) => {
    const statusConfig = STATUS_CONFIG[service.status] || STATUS_CONFIG.pending;
    return (
      <View key={service.service_id} style={styles.serviceCard}>
        <View style={styles.serviceHeader}>
          <View style={styles.serviceTypeRow}>
            <Ionicons name={service.service_type === 'taxi' ? 'car' : 'bicycle'} size={18} color={COLORS.primary} />
            <Text style={styles.serviceType}>{service.service_type === 'taxi' ? 'Taxi' : 'Delivery'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
        </View>
        <View style={styles.addressContainer}>
          <View style={styles.addressRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.addressText} numberOfLines={1}>{service.pickup_address || 'Origen'}</Text>
          </View>
          <View style={styles.addressLine} />
          <View style={styles.addressRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.accent }]} />
            <Text style={styles.addressText} numberOfLines={1}>{service.dropoff_address || 'Destino'}</Text>
          </View>
        </View>
        <View style={styles.serviceFooter}>
          <Text style={styles.serviceDate}>
            {new Date(service.created_at).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </Text>
          {service.fare > 0 && <Text style={styles.serviceFare}>${service.fare.toFixed(2)}</Text>}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>MIS SERVICIOS</Text>
      </View>
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'active' && styles.tabActive]} onPress={() => setActiveTab('active')}>
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Activos ({activeServices.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'history' && styles.tabActive]} onPress={() => setActiveTab('history')}>
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>Historial ({historyServices.length})</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.emptyContainer}><Text style={styles.emptyText}>Cargando...</Text></View>
        ) : services.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>{activeTab === 'active' ? 'No tienes servicios activos' : 'No hay historial de servicios'}</Text>
            <Text style={styles.emptySubtext}>{activeTab === 'active' ? 'Solicita un taxi o delivery desde el inicio' : 'Tus viajes completados aparecerán aquí'}</Text>
          </View>
        ) : (
          services.map(renderServiceCard)
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/request-service')}
      >
        <Ionicons name="add" size={24} color={COLORS.textOnPrimary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerSection: { padding: SPACING.md, paddingBottom: 0 },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.text, letterSpacing: 2 },
  tabContainer: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.sm },
  tab: { flex: 1, paddingVertical: SPACING.sm + 2, alignItems: 'center', borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, fontWeight: '600' },
  tabTextActive: { color: COLORS.textOnPrimary },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  serviceCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  serviceTypeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  serviceType: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full },
  statusText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  addressContainer: { marginBottom: SPACING.md },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  addressLine: { width: 2, height: 16, backgroundColor: COLORS.border, marginLeft: 4, marginVertical: 2 },
  addressText: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.text },
  serviceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  serviceDate: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  serviceFare: { fontSize: FONT_SIZE.lg, fontWeight: 'bold', color: COLORS.primary },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxl * 2 },
  emptyText: { fontSize: FONT_SIZE.lg, color: COLORS.textSecondary, marginTop: SPACING.md },
  emptySubtext: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, marginTop: SPACING.xs, textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
