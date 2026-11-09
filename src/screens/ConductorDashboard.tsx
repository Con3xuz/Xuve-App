import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { Card, Button } from '../components/ui';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import api from '../api';

export default function ConductorDashboard() {
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayTrips, setTodayTrips] = useState(0);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [socioProfile, setSocioProfile] = useState<any>(null);

  const availableBalance = (user?.wallet_balance || 0) - (user?.wallet_held || 0);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/socio/conductor/profile');
      setSocioProfile(res.data);
      setIsOnline(res.data.is_online || false);
    } catch (error) {
      console.log('Conductor profile not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await api.get('/services/driver/pending');
      setPendingRequests(res.data || []);
    } catch (error) {
      console.log('No pending requests');
    }
  };

  const checkSubscription = async () => {
    try {
      const res = await api.get('/subscription/status');
      setHasSubscription(res.data.is_active || false);
    } catch (error) {
      console.log('Subscription check failed');
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchPendingRequests();
    checkSubscription();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchPendingRequests(), checkSubscription(), refreshUser()]);
    setRefreshing(false);
  };

  const toggleOnline = async () => {
    setTogglingOnline(true);
    try {
      if (!isOnline) {
        // Check subscription first
        if (!hasSubscription) {
          try {
            await api.post('/subscription/activate', { role: 'socio_conductor' });
            setHasSubscription(true);
          } catch (subError: any) {
            Alert.alert('Suscripción requerida', subError.response?.data?.detail || 'Se requiere $1.00 USD diario para conectarte. Recarga tu wallet.');
            setTogglingOnline(false);
            return;
          }
        }
        await api.post('/socio/conductor/go-online?lat=8.5897&lng=-71.1561');
        setIsOnline(true);
        Alert.alert('En línea', '¡Estás recibiendo solicitudes!');
      } else {
        await api.post('/socio/conductor/go-offline');
        setIsOnline(false);
      }
      await refreshUser();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al cambiar estado');
    } finally {
      setTogglingOnline(false);
    }
  };

  const acceptRequest = async (serviceId: string) => {
    try {
      await api.post(`/services/${serviceId}/accept`);
      Alert.alert('Aceptado', '¡Viaje aceptado!');
      fetchPendingRequests();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al aceptar');
    }
  };

  const rejectRequest = async (serviceId: string) => {
    try {
      await api.post(`/services/${serviceId}/reject`);
      fetchPendingRequests();
    } catch (error: any) {
      Alert.alert('Error', 'Error al rechazar');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Status Header */}
      <View style={styles.statusHeader}>
        <View>
          <Text style={styles.roleLabel}>SOCIO CONDUCTOR</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.ratingText}>{user?.avg_rating?.toFixed(1) || '5.0'}</Text>
          </View>
        </View>
        <View style={styles.onlineToggle}>
          <Text style={[styles.onlineLabel, { color: isOnline ? COLORS.primary : COLORS.accent }]}>
            {isOnline ? 'EN LNEA' : 'DESCONECTADO'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={toggleOnline}
            disabled={togglingOnline}
            trackColor={{ false: COLORS.border, true: COLORS.primary + '40' }}
            thumbColor={isOnline ? COLORS.primary : COLORS.textLight}
          />
        </View>
      </View>

      {/* Map placeholder */}
      <View style={styles.mapPlaceholder}>
        <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.primary : COLORS.accent }]} />
        <Ionicons name="navigate-circle" size={64} color={isOnline ? COLORS.primary + '50' : COLORS.textLight + '30'} />
        <Text style={styles.mapText}>{isOnline ? 'Buscando pasajeros...' : 'Conéctate para recibir viajes'}</Text>
      </View>

      {/* Subscription Banner */}
      {!hasSubscription && (
        <View style={styles.subscriptionBanner}>
          <Ionicons name="flash" size={20} color={COLORS.warning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.subBannerTitle}>Suscripción Diaria</Text>
            <Text style={styles.subBannerText}>$1.00 USD/día para recibir solicitudes</Text>
          </View>
          <TouchableOpacity style={styles.subActivateBtn} onPress={toggleOnline}>
            <Text style={styles.subActivateText}>ACTIVAR</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="car" size={20} color={COLORS.primary} />
          <Text style={styles.statValue}>{todayTrips}</Text>
          <Text style={styles.statLabel}>Viajes hoy</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cash" size={20} color={COLORS.primary} />
          <Text style={styles.statValue}>${todayEarnings.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Ganancias</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="wallet" size={20} color={COLORS.secondary} />
          <Text style={styles.statValue}>${availableBalance.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Balance</Text>
        </View>
      </View>

      {/* Pending Requests */}
      <Text style={styles.sectionTitle}>SOLICITUDES PENDIENTES</Text>
      {pendingRequests.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="car-outline" size={40} color={COLORS.textLight} />
          <Text style={styles.emptyText}>{isOnline ? 'Esperando solicitudes...' : 'Conéctate para ver solicitudes'}</Text>
        </View>
      ) : (
        pendingRequests.map((req: any) => (
          <View key={req.service_id} style={styles.requestCard}>
            <View style={styles.requestInfo}>
              <View style={styles.requestRow}>
                <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.requestAddress} numberOfLines={1}>{req.pickup_address}</Text>
              </View>
              <View style={styles.dividerLine} />
              <View style={styles.requestRow}>
                <View style={[styles.dot, { backgroundColor: COLORS.accent }]} />
                <Text style={styles.requestAddress} numberOfLines={1}>{req.dropoff_address}</Text>
              </View>
              <View style={styles.requestMeta}>
                <Text style={styles.requestFare}>${req.fare?.toFixed(2) || '0.00'}</Text>
                <Text style={styles.requestType}>{req.vehicle_type}</Text>
              </View>
            </View>
            <View style={styles.requestActions}>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptRequest(req.service_id)}>
                <Ionicons name="checkmark" size={22} color={COLORS.textOnPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectRequest(req.service_id)}>
                <Ionicons name="close" size={22} color={COLORS.accent} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>ACCIONES RAPIDAS</Text>
      <View style={styles.quickActionsRow}>
        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(main)/service-history')}>
          <Ionicons name="time" size={20} color={COLORS.secondary} />
          <Text style={styles.quickActionText}>Historial</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(main)/chat')}>
          <Ionicons name="chatbubbles" size={20} color={COLORS.primary} />
          <Text style={styles.quickActionText}>Chat</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  roleLabel: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: '700', letterSpacing: 2 },
  userName: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontSize: FONT_SIZE.sm, color: '#F59E0B' },
  onlineToggle: { alignItems: 'center', gap: SPACING.xs },
  onlineLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', letterSpacing: 1 },
  mapPlaceholder: { height: 180, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xxl, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md, position: 'relative' },
  statusDot: { width: 12, height: 12, borderRadius: 6, position: 'absolute', top: SPACING.md, right: SPACING.md },
  mapText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: SPACING.sm },
  subscriptionBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: '#F59E0B15', borderWidth: 1, borderColor: '#F59E0B30', borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md },
  subBannerTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: '#F59E0B' },
  subBannerText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  subActivateBtn: { backgroundColor: '#F59E0B', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.lg },
  subActivateText: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: '#000' },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', gap: SPACING.xs },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
  sectionTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1, marginBottom: SPACING.md },
  emptyBox: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xl, alignItems: 'center', gap: SPACING.sm },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textLight },
  requestCard: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm },
  requestInfo: { flex: 1 },
  requestRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dividerLine: { width: 2, height: 16, backgroundColor: COLORS.border, marginLeft: 4, marginVertical: 2 },
  requestAddress: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.text },
  requestMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
  requestFare: { fontSize: FONT_SIZE.lg, fontWeight: 'bold', color: COLORS.primary },
  requestType: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  requestActions: { justifyContent: 'center', gap: SPACING.sm, marginLeft: SPACING.md },
  acceptBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  rejectBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.accent + '20', borderWidth: 1, borderColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  quickActionsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  quickAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, paddingVertical: SPACING.md },
  quickActionText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textSecondary },
});
