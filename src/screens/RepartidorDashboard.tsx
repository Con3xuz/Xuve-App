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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import api from '../api';

export default function RepartidorDashboard() {
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [pendingDeliveries, setPendingDeliveries] = useState<any[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [todayDeliveries, setTodayDeliveries] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);

  const availableBalance = (user?.wallet_balance || 0) - (user?.wallet_held || 0);

  const fetchData = async () => {
    try {
      const res = await api.get('/socio/repartidor/profile');
      setIsOnline(res.data.is_online || false);
    } catch { console.log('Repartidor profile not found'); }
    try {
      const subRes = await api.get('/subscription/status');
      setHasSubscription(subRes.data.is_active || false);
    } catch {}
    try {
      const delRes = await api.get('/market/orders/delivery/pending');
      setPendingDeliveries(delRes.data.orders || delRes.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), refreshUser()]);
    setRefreshing(false);
  };

  const toggleOnline = async () => {
    setTogglingOnline(true);
    try {
      if (!isOnline) {
        if (!hasSubscription) {
          try {
            await api.post('/subscription/activate', { role: 'socio_repartidor' });
            setHasSubscription(true);
          } catch (e: any) {
            Alert.alert('SuscripciÃ³n requerida', e.response?.data?.detail || '$1.00 USD/dÃ­a para activarse');
            setTogglingOnline(false);
            return;
          }
        }
        await api.post('/socio/repartidor/go-online?lat=8.5897&lng=-71.1561');
        setIsOnline(true);
        Alert.alert('En lÃ­nea', 'Â¡Recibiendo pedidos de delivery!');
      } else {
        await api.post('/socio/repartidor/go-offline');
        setIsOnline(false);
      }
      await refreshUser();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Error al cambiar estado');
    } finally { setTogglingOnline(false); }
  };

  const acceptDelivery = async (orderId: string) => {
    try {
      await api.post(`/market/orders/${orderId}/accept-delivery`);
      Alert.alert('Aceptado', 'Â¡Delivery aceptado!');
      fetchData();
    } catch (e: any) { Alert.alert('Error', e.response?.data?.detail || 'Error'); }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.secondary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.statusHeader}>
        <View>
          <Text style={[styles.roleLabel, { color: COLORS.secondary }]}>SOCIO REPARTIDOR</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.ratingText}>{user?.avg_rating?.toFixed(1) || '5.0'}</Text>
          </View>
        </View>
        <View style={styles.onlineToggle}>
          <Text style={[styles.onlineLabel, { color: isOnline ? COLORS.secondary : COLORS.accent }]}>
            {isOnline ? 'EN LÃNEA' : 'DESCONECTADO'}
          </Text>
          <Switch value={isOnline} onValueChange={toggleOnline} disabled={togglingOnline}
            trackColor={{ false: COLORS.border, true: COLORS.secondary + '40' }}
            thumbColor={isOnline ? COLORS.secondary : COLORS.textLight} />
        </View>
      </View>

      <View style={[styles.mapPlaceholder, { borderColor: isOnline ? COLORS.secondary + '40' : COLORS.border }]}>
        <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.secondary : COLORS.accent }]} />
        <Ionicons name="bicycle" size={64} color={isOnline ? COLORS.secondary + '50' : COLORS.textLight + '30'} />
        <Text style={styles.mapText}>{isOnline ? 'Buscando deliveries...' : 'ConÃ©ctate para recibir pedidos'}</Text>
      </View>

      {!hasSubscription && (
        <View style={[styles.subscriptionBanner, { backgroundColor: COLORS.secondary + '10', borderColor: COLORS.secondary + '30' }]}>
          <Ionicons name="flash" size={20} color={COLORS.secondary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.subBannerTitle, { color: COLORS.secondary }]}>SuscripciÃ³n Diaria</Text>
            <Text style={styles.subBannerText}>$1.00 USD/dÃ­a para recibir pedidos</Text>
          </View>
          <TouchableOpacity style={[styles.subActivateBtn, { backgroundColor: COLORS.secondary }]} onPress={toggleOnline}>
            <Text style={styles.subActivateText}>ACTIVAR</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="bag-handle" size={20} color={COLORS.secondary} />
          <Text style={styles.statValue}>{todayDeliveries}</Text>
          <Text style={styles.statLabel}>Entregas hoy</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cash" size={20} color={COLORS.secondary} />
          <Text style={styles.statValue}>${todayEarnings.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Ganancias</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="wallet" size={20} color={COLORS.primary} />
          <Text style={styles.statValue}>${availableBalance.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Balance</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>PEDIDOS PENDIENTES</Text>
      {pendingDeliveries.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="bag-handle-outline" size={40} color={COLORS.textLight} />
          <Text style={styles.emptyText}>{isOnline ? 'Esperando pedidos...' : 'ConÃ©ctate para ver pedidos'}</Text>
        </View>
      ) : (
        pendingDeliveries.map((del: any) => (
          <View key={del.order_id || del.delivery_id} style={styles.deliveryCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.deliveryStore}>{del.store_name || 'Tienda'}</Text>
              <Text style={styles.deliveryAddress} numberOfLines={1}>{del.delivery_address || 'DirecciÃ³n'}</Text>
              <Text style={styles.deliveryItems}>{del.items_count || del.items?.length || 0} productos</Text>
            </View>
            <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: COLORS.secondary }]} onPress={() => acceptDelivery(del.order_id)}>
              <Ionicons name="checkmark" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>ACCIONES RAPIDAS</Text>
      <View style={styles.quickActionsRow}>
        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(main)/service-history')}>
          <Ionicons name="time" size={20} color={COLORS.primary} />
          <Text style={styles.quickActionText}>Historial</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(main)/chat')}>
          <Ionicons name="chatbubbles" size={20} color={COLORS.secondary} />
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
  roleLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', letterSpacing: 2 },
  userName: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontSize: FONT_SIZE.sm, color: '#F59E0B' },
  onlineToggle: { alignItems: 'center', gap: SPACING.xs },
  onlineLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', letterSpacing: 1 },
  mapPlaceholder: { height: 180, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xxl, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md, position: 'relative' },
  statusDot: { width: 12, height: 12, borderRadius: 6, position: 'absolute', top: SPACING.md, right: SPACING.md },
  mapText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: SPACING.sm },
  subscriptionBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderWidth: 1, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md },
  subBannerTitle: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  subBannerText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  subActivateBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.lg },
  subActivateText: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: '#000' },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', gap: SPACING.xs },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
  sectionTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1, marginBottom: SPACING.md },
  emptyBox: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xl, alignItems: 'center', gap: SPACING.sm },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textLight },
  deliveryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm, gap: SPACING.md },
  deliveryStore: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text },
  deliveryAddress: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  deliveryItems: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginTop: 4 },
  acceptBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  quickActionsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  quickAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, paddingVertical: SPACING.md },
  quickActionText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textSecondary },
});
