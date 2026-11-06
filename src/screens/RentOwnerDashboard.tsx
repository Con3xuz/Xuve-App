import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import api from '../lib/api';

const AMBER = '#F59E0B';

export default function RentOwnerDashboard() {
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'vehiculos' | 'solicitudes' | 'activos'>('vehiculos');
  const [myCars, setMyCars] = useState<any[]>([]);
  const [rentalRequests, setRentalRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [todayStats, setTodayStats] = useState({ vehicles: 0, activeRentals: 0, earnings: 0, pending: 0 });

  const [carForm, setCarForm] = useState({
    brand: '', model: '', year: '', color: '', plate_number: '',
    daily_rate: '', deposit_amount: '', location: '', description: '',
  });

  const fetchData = async () => {
    try {
      const carsRes = await api.get('/rent/owner/vehicles');
      setMyCars(carsRes.data || []);

      const requestsRes = await api.get('/rent/owner/requests');
      const requests = requestsRes.data || [];
      setRentalRequests(requests);

      const activeRentals = requests.filter((r: any) => r.status === 'active' || r.status === 'accepted').length;
      const pending = requests.filter((r: any) => r.status === 'pending').length;
      const earnings = requests
        .filter((r: any) => r.status === 'completed')
        .reduce((sum: number, r: any) => sum + (r.total_amount || r.daily_rate || 0), 0);

      setTodayStats({
        vehicles: (carsRes.data || []).length,
        activeRentals,
        earnings,
        pending,
      });
    } catch (error) {
      console.log('Error fetching rent owner data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), refreshUser()]);
    setRefreshing(false);
  };

  const handleAddCar = async () => {
    if (!carForm.brand || !carForm.model || !carForm.daily_rate) {
      Alert.alert('Error', 'Marca, modelo y tarifa diaria son requeridos');
      return;
    }
    try {
      await api.post('/rent/owner/vehicles', {
        brand: carForm.brand,
        model: carForm.model,
        year: parseInt(carForm.year) || 2024,
        color: carForm.color,
        plate_number: carForm.plate_number,
        daily_rate: parseFloat(carForm.daily_rate),
        deposit_amount: parseFloat(carForm.deposit_amount) || 0,
        location: carForm.location,
        description: carForm.description,
        image_url: '',
      });
      Alert.alert('Publicado', 'Vehiculo publicado exitosamente');
      setShowAddCarModal(false);
      setCarForm({ brand: '', model: '', year: '', color: '', plate_number: '', daily_rate: '', deposit_amount: '', location: '', description: '' });
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Error al publicar vehiculo');
    }
  };

  const handleRequestAction = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      await api.post(`/rent/owner/requests/${requestId}/${action}`);
      Alert.alert('Listo', action === 'accept' ? 'Solicitud aceptada' : 'Solicitud rechazada');
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Error al procesar solicitud');
    }
  };

  const toggleCarAvailability = async (carId: string, available: boolean) => {
    try {
      await api.patch(`/rent/owner/vehicles/${carId}`, { available });
      Alert.alert('Listo', available ? 'Vehiculo disponible' : 'Vehiculo pausado');
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', 'Error al actualizar disponibilidad');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Pendiente', bg: '#F59E0B20', text: '#F59E0B' };
      case 'accepted': return { label: 'Aceptada', bg: COLORS.primary + '20', text: COLORS.primary };
      case 'active': return { label: 'En curso', bg: '#3B82F620', text: '#3B82F6' };
      case 'completed': return { label: 'Completada', bg: COLORS.primary + '20', text: COLORS.primary };
      case 'rejected': return { label: 'Rechazada', bg: COLORS.accent + '20', text: COLORS.accent };
      default: return { label: status, bg: COLORS.border, text: COLORS.textSecondary };
    }
  };

  const TABS = [
    { id: 'vehiculos' as const, label: 'Mis Autos', icon: 'car' as const, count: myCars.length },
    { id: 'solicitudes' as const, label: 'Solicitudes', icon: 'key' as const, count: todayStats.pending },
    { id: 'activos' as const, label: 'En Alquiler', icon: 'time' as const, count: todayStats.activeRentals },
  ];

  const pendingRequests = rentalRequests.filter(r => r.status === 'pending');
  const activeRentals = rentalRequests.filter(r => r.status === 'active' || r.status === 'accepted');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AMBER} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={[styles.roleAvatar, { backgroundColor: AMBER + '20' }]}>
          <Ionicons name="key" size={24} color={AMBER} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.roleLabel, { color: AMBER }]}>RENT OWNER</Text>
          <Text style={styles.userName}>{user?.name || 'Propietario'}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddCarModal(true)}>
          <Ionicons name="add" size={20} color={COLORS.textOnPrimary} />
          <Text style={styles.addBtnText}>Publicar</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: AMBER + '30' }]}>
          <Ionicons name="car" size={18} color={AMBER} />
          <Text style={styles.statValue}>{todayStats.vehicles}</Text>
          <Text style={styles.statLabel}>Vehiculos</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#3B82F630' }]}>
          <Ionicons name="key" size={18} color="#3B82F6" />
          <Text style={styles.statValue}>{todayStats.activeRentals}</Text>
          <Text style={styles.statLabel}>En Alquiler</Text>
        </View>
        <View style={[styles.statCard, { borderColor: COLORS.primary + '30' }]}>
          <Ionicons name="cash" size={18} color={COLORS.primary} />
          <Text style={styles.statValue}>${todayStats.earnings.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Ganancias</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabBtn, activeTab === tab.id && { backgroundColor: AMBER, borderColor: AMBER }]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons name={tab.icon} size={16} color={activeTab === tab.id ? '#000' : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === tab.id && { color: '#000' }]}>{tab.label}</Text>
            {tab.count > 0 && (
              <View style={[styles.tabBadge, activeTab === tab.id && { backgroundColor: COLORS.accent }]}>
                <Text style={styles.tabBadgeText}>{tab.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Vehicles Tab */}
      {activeTab === 'vehiculos' && (
        <>
          {myCars.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="car-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No tienes vehiculos publicados</Text>
              <TouchableOpacity style={[styles.emptyAction, { borderColor: AMBER }]} onPress={() => setShowAddCarModal(true)}>
                <Text style={[styles.emptyActionText, { color: AMBER }]}>Publicar mi primer auto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            myCars.map((car: any) => (
              <View key={car.vehicle_id} style={styles.carCard}>
                <View style={styles.carImagePlaceholder}>
                  <Ionicons name="car" size={32} color={COLORS.textLight} />
                </View>
                <View style={styles.carInfo}>
                  <View style={styles.carHeader}>
                    <Text style={styles.carTitle}>{car.brand} {car.model}</Text>
                    <View style={[styles.availBadge, { backgroundColor: car.available ? COLORS.primary + '20' : COLORS.accent + '20' }]}>
                      <Text style={[styles.availBadgeText, { color: car.available ? COLORS.primary : COLORS.accent }]}>
                        {car.available ? 'Disponible' : 'Pausado'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.carPlate}>{car.plate_number} {car.year ? `• ${car.year}` : ''}</Text>
                  <Text style={styles.carRate}>${car.daily_rate || car.daily_price}/dia</Text>
                  {(car.deposit_amount || 0) > 0 && (
                    <Text style={styles.carDeposit}>Deposito: ${car.deposit_amount}</Text>
                  )}
                </View>
                <View style={styles.carActions}>
                  <TouchableOpacity
                    style={[styles.carActionBtn, { borderColor: car.available ? COLORS.accent + '40' : COLORS.primary + '40' }]}
                    onPress={() => toggleCarAvailability(car.vehicle_id, !car.available)}
                  >
                    <Ionicons
                      name={car.available ? 'pause-circle' : 'play-circle'}
                      size={20}
                      color={car.available ? COLORS.accent : COLORS.primary}
                    />
                    <Text style={[styles.carActionText, { color: car.available ? COLORS.accent : COLORS.primary }]}>
                      {car.available ? 'Pausar' : 'Activar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </>
      )}

      {/* Requests Tab */}
      {activeTab === 'solicitudes' && (
        <>
          {pendingRequests.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="key-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No hay solicitudes pendientes</Text>
            </View>
          ) : (
            pendingRequests.map((request: any) => {
              const car = myCars.find(c => c.vehicle_id === request.vehicle_id);
              return (
                <View key={request.request_id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={styles.requestAvatar}>
                      <Ionicons name="person" size={24} color={AMBER} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.requestName}>{request.renter_name || 'Usuario'}</Text>
                      <Text style={styles.requestCar}>{car ? `${car.brand} ${car.model}` : 'Vehiculo'}</Text>
                    </View>
                  </View>
                  <View style={styles.requestDetails}>
                    <View style={styles.requestDetailRow}>
                      <Text style={styles.requestDetailLabel}>Fechas</Text>
                      <Text style={styles.requestDetailValue}>
                        {request.start_date ? new Date(request.start_date).toLocaleDateString('es-VE') : 'N/A'} - {request.end_date ? new Date(request.end_date).toLocaleDateString('es-VE') : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.requestDetailRow}>
                      <Text style={styles.requestDetailLabel}>Total</Text>
                      <Text style={[styles.requestDetailValue, { color: COLORS.primary }]}>${(request.total_amount || request.daily_rate || 0).toFixed(2)}</Text>
                    </View>
                    {(request.deposit_amount || 0) > 0 && (
                      <View style={styles.requestDetailRow}>
                        <Text style={styles.requestDetailLabel}>Deposito (Hold)</Text>
                        <Text style={[styles.requestDetailValue, { color: AMBER }]}>${request.deposit_amount}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity style={[styles.requestActionBtn, { backgroundColor: COLORS.primary }]} onPress={() => handleRequestAction(request.request_id, 'accept')}>
                      <Ionicons name="checkmark" size={18} color={COLORS.textOnPrimary} />
                      <Text style={[styles.requestActionText, { color: COLORS.textOnPrimary }]}>Aceptar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.requestActionBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.accent }]} onPress={() => handleRequestAction(request.request_id, 'reject')}>
                      <Ionicons name="close" size={18} color={COLORS.accent} />
                      <Text style={[styles.requestActionText, { color: COLORS.accent }]}>Rechazar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </>
      )}

      {/* Active Rentals Tab */}
      {activeTab === 'activos' && (
        <>
          {activeRentals.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="time-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No hay alquileres activos</Text>
            </View>
          ) : (
            activeRentals.map((rental: any) => {
              const car = myCars.find(c => c.vehicle_id === rental.vehicle_id);
              const st = getStatusConfig(rental.status);
              return (
                <View key={rental.request_id} style={[styles.activeCard, { borderColor: '#3B82F640' }]}>
                  <View style={styles.activeHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                      <Ionicons name="car" size={24} color="#3B82F6" />
                      <View>
                        <Text style={styles.activeCarName}>{car?.brand} {car?.model}</Text>
                        <Text style={styles.activeCarPlate}>{car?.plate_number}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: st.text }]}>{st.label}</Text>
                    </View>
                  </View>
                  <View style={[styles.activeDetails, { backgroundColor: '#3B82F610' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs }}>
                      <Ionicons name="person" size={16} color="#3B82F6" />
                      <Text style={styles.activeRenter}>{rental.renter_name || 'Usuario'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.activeDate}>
                        Inicio: {rental.start_date ? new Date(rental.start_date).toLocaleDateString('es-VE') : 'N/A'}
                      </Text>
                      <Text style={styles.activeDate}>
                        Fin: {rental.end_date ? new Date(rental.end_date).toLocaleDateString('es-VE') : 'N/A'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.activeFooter}>
                    <View>
                      <Text style={styles.activeIncomeLabel}>Ingreso</Text>
                      <Text style={styles.activeIncomeValue}>${(rental.total_amount || rental.daily_rate || 0).toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() => router.push({ pathname: '/(main)/chat', params: { serviceId: rental.request_id } })}
                    >
                      <Ionicons name="chatbubble" size={16} color="#3B82F6" />
                      <Text style={styles.contactBtnText}>Contactar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </>
      )}

      {/* Add Car Modal */}
      <Modal visible={showAddCarModal} animationType="slide" transparent onRequestClose={() => setShowAddCarModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Ionicons name="car" size={20} color={AMBER} />
                  <Text style={styles.modalTitle}>Publicar Vehiculo</Text>
                </View>
                <TouchableOpacity onPress={() => setShowAddCarModal(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Marca *</Text>
                  <TextInput style={styles.formInput} placeholder="Toyota" placeholderTextColor={COLORS.textLight}
                    value={carForm.brand} onChangeText={t => setCarForm(p => ({ ...p, brand: t }))} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Modelo *</Text>
                  <TextInput style={styles.formInput} placeholder="Corolla" placeholderTextColor={COLORS.textLight}
                    value={carForm.model} onChangeText={t => setCarForm(p => ({ ...p, model: t }))} />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Ano</Text>
                  <TextInput style={styles.formInput} placeholder="2020" placeholderTextColor={COLORS.textLight} keyboardType="numeric"
                    value={carForm.year} onChangeText={t => setCarForm(p => ({ ...p, year: t }))} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Color</Text>
                  <TextInput style={styles.formInput} placeholder="Blanco" placeholderTextColor={COLORS.textLight}
                    value={carForm.color} onChangeText={t => setCarForm(p => ({ ...p, color: t }))} />
                </View>
              </View>

              <Text style={styles.formLabel}>Placa</Text>
              <TextInput style={styles.formInput} placeholder="ABC-123" placeholderTextColor={COLORS.textLight} autoCapitalize="characters"
                value={carForm.plate_number} onChangeText={t => setCarForm(p => ({ ...p, plate_number: t.toUpperCase() }))} />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Tarifa Diaria (USD) *</Text>
                  <TextInput style={styles.formInput} placeholder="25" placeholderTextColor={COLORS.textLight} keyboardType="numeric"
                    value={carForm.daily_rate} onChangeText={t => setCarForm(p => ({ ...p, daily_rate: t }))} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Deposito (USD)</Text>
                  <TextInput style={styles.formInput} placeholder="100" placeholderTextColor={COLORS.textLight} keyboardType="numeric"
                    value={carForm.deposit_amount} onChangeText={t => setCarForm(p => ({ ...p, deposit_amount: t }))} />
                </View>
              </View>

              <Text style={styles.formLabel}>Ubicacion</Text>
              <TextInput style={styles.formInput} placeholder="Merida, Centro" placeholderTextColor={COLORS.textLight}
                value={carForm.location} onChangeText={t => setCarForm(p => ({ ...p, location: t }))} />

              <Text style={styles.formLabel}>Descripcion</Text>
              <TextInput style={[styles.formInput, { minHeight: 70, textAlignVertical: 'top' }]} placeholder="Detalles del vehiculo..." placeholderTextColor={COLORS.textLight} multiline
                value={carForm.description} onChangeText={t => setCarForm(p => ({ ...p, description: t }))} />

              {/* Deposit Notice */}
              <View style={styles.depositNotice}>
                <Ionicons name="alert-circle" size={18} color={AMBER} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.depositNoticeTitle}>Sistema de Deposito</Text>
                  <Text style={styles.depositNoticeText}>
                    El deposito se congelara de la billetera del cliente al confirmar la reserva. Se liberara al finalizar el alquiler sin problemas.
                  </Text>
                </View>
              </View>

              <Button title="PUBLICAR VEHICULO" onPress={handleAddCar} style={{ marginTop: SPACING.lg, marginBottom: SPACING.xxl, backgroundColor: AMBER }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  roleAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  roleLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', letterSpacing: 2 },
  userName: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F59E0B', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.lg },
  addBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.textOnPrimary },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, borderWidth: 1, alignItems: 'center', gap: SPACING.xs },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
  tabsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: SPACING.sm + 2, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, position: 'relative' },
  tabText: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.textSecondary },
  tabBadge: { position: 'absolute', top: -6, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  emptyBox: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xxl, alignItems: 'center', gap: SPACING.sm },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textLight },
  emptyAction: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.lg, borderWidth: 1.5, marginTop: SPACING.sm },
  emptyActionText: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  // Car Card
  carCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm, overflow: 'hidden' },
  carImagePlaceholder: { height: 80, backgroundColor: COLORS.surfaceHighlight, justifyContent: 'center', alignItems: 'center' },
  carInfo: { padding: SPACING.md },
  carHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  carTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text },
  availBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  availBadgeText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  carPlate: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  carRate: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: '#F59E0B', marginTop: 4 },
  carDeposit: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginTop: 2 },
  carActions: { borderTopWidth: 1, borderTopColor: COLORS.border, padding: SPACING.sm },
  carActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.lg, borderWidth: 1 },
  carActionText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  // Request Card
  requestCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm },
  requestHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  requestAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F59E0B20', justifyContent: 'center', alignItems: 'center' },
  requestName: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text },
  requestCar: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  requestDetails: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  requestDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  requestDetailLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
  requestDetailValue: { fontSize: FONT_SIZE.sm, color: COLORS.text },
  requestActions: { flexDirection: 'row', gap: SPACING.sm },
  requestActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm + 2, borderRadius: BORDER_RADIUS.lg },
  requestActionText: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  // Active Rental Card
  activeCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.sm },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  activeCarName: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text },
  activeCarPlate: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  statusBadgeText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  activeDetails: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  activeRenter: { fontSize: FONT_SIZE.sm, color: COLORS.text },
  activeDate: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
  activeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeIncomeLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
  activeIncomeValue: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.primary },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: '#3B82F640' },
  contactBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: '#3B82F6' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: BORDER_RADIUS.xxl, borderTopRightRadius: BORDER_RADIUS.xxl, padding: SPACING.lg, maxHeight: '90%', borderWidth: 1, borderColor: COLORS.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  formLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs, marginTop: SPACING.md },
  formInput: { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, fontSize: FONT_SIZE.md, color: COLORS.text, minHeight: 48 },
  formRow: { flexDirection: 'row', gap: SPACING.sm },
  depositNotice: { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, backgroundColor: '#F59E0B10', borderWidth: 1, borderColor: '#F59E0B30', marginTop: SPACING.md },
  depositNoticeTitle: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: '#F59E0B', marginBottom: 2 },
  depositNoticeText: { fontSize: FONT_SIZE.xs, color: '#F59E0B99' },
});
