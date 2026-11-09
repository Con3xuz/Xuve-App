import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { Button } from '../../src/components/ui';
import api from '../../src/api';

const DEPOSIT_MULTIPLIER = 2;

const CONDITION_COLORS: Record<string, { bg: string; text: string }> = {
  excelente: { bg: COLORS.primary + '20', text: COLORS.primary },
  bueno: { bg: COLORS.secondary + '20', text: COLORS.secondary },
  regular: { bg: '#F59E0B20', text: '#F59E0B' },
};

interface Car {
  car_id: string;
  owner_id: string;
  owner_name: string;
  owner_phone: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  plate_number: string;
  condition: string;
  daily_price: number;
  description: string;
  location: string;
  photos: string[];
  rating: number;
  status: string;
}

interface Rental {
  rental_id: string;
  car_brand: string;
  car_model: string;
  plate_number: string;
  status: string;
  deposit_amount?: number;
  owner_name?: string;
  owner_phone?: string;
  owner_id?: string;
}

export default function RentCarScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'available' | 'my-cars' | 'my-rentals'>('available');
  const [availableCars, setAvailableCars] = useState<Car[]>([]);
  const [myCars, setMyCars] = useState<Car[]>([]);
  const [myRentals, setMyRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [processingHold, setProcessingHold] = useState(false);

  // Publish form
  const [publishForm, setPublishForm] = useState({
    brand: '', model: '', year: '', color: '', plateNumber: '',
    condition: 'excelente', dailyPrice: '', description: '', location: '',
  });

  const userBalance = user?.wallet_balance || 0;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [availableRes, myCarsRes, rentalsRes] = await Promise.all([
        api.get('/rent/available').catch(() => ({ data: [] })),
        api.get('/rent/my-cars').catch(() => ({ data: [] })),
        api.get('/rent/my-rentals').catch(() => ({ data: [] })),
      ]);
      setAvailableCars(availableRes.data || []);
      setMyCars(myCarsRes.data || []);
      setMyRentals(rentalsRes.data || []);
    } catch (error) {
      console.log('Rent API error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handlePublishCar = async () => {
    if (!publishForm.brand || !publishForm.model || !publishForm.dailyPrice || !publishForm.plateNumber) {
      Alert.alert('Error', 'Completa todos los campos obligatorios');
      return;
    }
    try {
      await api.post('/rent/publish', publishForm);
      Alert.alert('Ã‰xito', 'Â¡Auto publicado exitosamente!');
      setShowPublishModal(false);
      setPublishForm({ brand: '', model: '', year: '', color: '', plateNumber: '', condition: 'excelente', dailyPrice: '', description: '', location: '' });
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al publicar');
    }
  };

  const handleRentRequest = async () => {
    if (!selectedCar) return;
    const depositAmount = selectedCar.daily_price * DEPOSIT_MULTIPLIER;

    if (userBalance < depositAmount) {
      Alert.alert('Saldo insuficiente', `Necesitas $${depositAmount.toFixed(2)} para el depÃ³sito de garantÃ­a.`);
      return;
    }

    setProcessingHold(true);
    try {
      const holdResponse = await api.post('/wallet/hold', {
        amount_usd: depositAmount,
        reason: 'rent_deposit',
        reference_id: `rent_${selectedCar.car_id}_${Date.now()}`,
      });

      await api.post('/rent/request', {
        car_id: selectedCar.car_id,
        hold_id: holdResponse.data.hold?.hold_id,
      });

      Alert.alert('Ã‰xito', `Â¡Solicitud enviada! Se han retenido $${depositAmount.toFixed(2)} como garantÃ­a.`);
      setShowRentModal(false);
      setSelectedCar(null);
      await refreshUser();
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al solicitar');
    } finally {
      setProcessingHold(false);
    }
  };

  const TABS = [
    { id: 'available' as const, label: 'Disponibles', count: availableCars.length },
    { id: 'my-cars' as const, label: 'Mis Autos', count: myCars.length },
    { id: 'my-rentals' as const, label: 'Mis Alquileres', count: myRentals.length },
  ];

  const renderAvailableCars = () => (
    <>
      {availableCars.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyText}>No hay autos disponibles</Text>
        </View>
      ) : (
        availableCars.map((car) => {
          const condStyle = CONDITION_COLORS[car.condition] || CONDITION_COLORS.excelente;
          return (
            <View key={car.car_id} style={styles.carCard}>
              {/* Car Image */}
              <View style={styles.carImagePlaceholder}>
                <Ionicons name="car-sport" size={48} color={COLORS.primary + '40'} />
                <View style={styles.conditionBadge}>
                  <Text style={[styles.conditionText, { color: condStyle.text, backgroundColor: condStyle.bg }]}>
                    {car.condition}
                  </Text>
                </View>
                <View style={styles.priceBadge}>
                  <Text style={styles.priceText}>${car.daily_price}/dÃ­a</Text>
                </View>
              </View>

              <View style={styles.carInfo}>
                <View style={styles.carInfoHeader}>
                  <View>
                    <Text style={styles.carTitle}>{car.brand} {car.model}</Text>
                    <Text style={styles.carMeta}>{car.year} â€¢ {car.color}</Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>{car.rating}</Text>
                  </View>
                </View>

                {/* Plate Number */}
                <View style={styles.plateContainer}>
                  <Text style={styles.plateLabel}>PLACA</Text>
                  <Text style={styles.plateNumber}>{car.plate_number}</Text>
                </View>

                <Text style={styles.carDescription} numberOfLines={2}>{car.description}</Text>

                <View style={styles.carMetaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="location" size={14} color={COLORS.textLight} />
                    <Text style={styles.metaText}>{car.location}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="person" size={14} color={COLORS.textLight} />
                    <Text style={styles.metaText}>{car.owner_name}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.rentButton}
                  onPress={() => { setSelectedCar(car); setShowRentModal(true); }}
                >
                  <Ionicons name="key" size={18} color={COLORS.textOnPrimary} />
                  <Text style={styles.rentButtonText}>SOLICITAR ALQUILER</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </>
  );

  const renderMyCars = () => (
    <>
      {myCars.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyText}>No has publicado ningÃºn auto</Text>
          <Button title="PUBLICAR MI AUTO" onPress={() => setShowPublishModal(true)} style={{ marginTop: SPACING.md }} />
        </View>
      ) : (
        myCars.map((car) => (
          <View key={car.car_id} style={styles.simpleCard}>
            <Ionicons name="car" size={20} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.simpleCardTitle}>{car.brand} {car.model}</Text>
              <Text style={styles.simpleCardSub}>{car.plate_number} â€¢ ${car.daily_price}/dÃ­a</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: car.status === 'available' ? COLORS.primary + '20' : COLORS.warning + '20' }]}>
              <Text style={[styles.statusText, { color: car.status === 'available' ? COLORS.primary : COLORS.warning }]}>
                {car.status === 'available' ? 'Disponible' : car.status}
              </Text>
            </View>
          </View>
        ))
      )}
    </>
  );

  const renderMyRentals = () => (
    <>
      {myRentals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyText}>No tienes alquileres activos</Text>
        </View>
      ) : (
        myRentals.map((rental) => (
          <View key={rental.rental_id} style={styles.simpleCard}>
            <Ionicons name="car" size={20} color={COLORS.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.simpleCardTitle}>{rental.car_brand} {rental.car_model}</Text>
              <Text style={styles.simpleCardSub}>{rental.plate_number || 'Placa no disponible'}</Text>
              {rental.deposit_amount && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Ionicons name="shield" size={12} color="#F59E0B" />
                  <Text style={{ fontSize: FONT_SIZE.xs, color: '#F59E0B' }}>
                    DepÃ³sito: ${rental.deposit_amount.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.statusBadge, {
              backgroundColor: rental.status === 'active' ? COLORS.primary + '20' :
                rental.status === 'pending' ? COLORS.warning + '20' : COLORS.textLight + '20'
            }]}>
              <Text style={[styles.statusText, {
                color: rental.status === 'active' ? COLORS.primary :
                  rental.status === 'pending' ? COLORS.warning : COLORS.textLight
              }]}>
                {rental.status === 'active' ? 'Activo' : rental.status === 'pending' ? 'Pendiente' : rental.status}
              </Text>
            </View>
          </View>
        ))
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textSecondary} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>XUVE RENT</Text>
            <Text style={styles.subtitle}>Alquiler de vehÃ­culos P2P</Text>
          </View>
          <TouchableOpacity style={styles.publishBtn} onPress={() => setShowPublishModal(true)}>
            <Ionicons name="add" size={18} color={COLORS.textOnPrimary} />
            <Text style={styles.publishBtnText}>PUBLICAR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.tabCount, activeTab === tab.id && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, activeTab === tab.id && styles.tabCountTextActive]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            {activeTab === 'available' && renderAvailableCars()}
            {activeTab === 'my-cars' && renderMyCars()}
            {activeTab === 'my-rentals' && renderMyRentals()}
          </>
        )}
      </ScrollView>

      {/* Publish Modal */}
      <Modal visible={showPublishModal} animationType="slide" transparent onRequestClose={() => setShowPublishModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Ionicons name="car" size={20} color={COLORS.primary} />
                  <Text style={styles.modalTitle}>Publicar Auto</Text>
                </View>
                <TouchableOpacity onPress={() => setShowPublishModal(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formHalf}>
                  <Text style={styles.formLabel}>Marca *</Text>
                  <TextInput style={styles.formInput} placeholder="Toyota" placeholderTextColor={COLORS.textLight}
                    value={publishForm.brand} onChangeText={(t) => setPublishForm(p => ({ ...p, brand: t }))} />
                </View>
                <View style={styles.formHalf}>
                  <Text style={styles.formLabel}>Modelo *</Text>
                  <TextInput style={styles.formInput} placeholder="Corolla" placeholderTextColor={COLORS.textLight}
                    value={publishForm.model} onChangeText={(t) => setPublishForm(p => ({ ...p, model: t }))} />
                </View>
              </View>
              <View style={styles.formRow}>
                <View style={styles.formHalf}>
                  <Text style={styles.formLabel}>AÃ±o</Text>
                  <TextInput style={styles.formInput} placeholder="2020" placeholderTextColor={COLORS.textLight} keyboardType="numeric"
                    value={publishForm.year} onChangeText={(t) => setPublishForm(p => ({ ...p, year: t }))} />
                </View>
                <View style={styles.formHalf}>
                  <Text style={styles.formLabel}>Color</Text>
                  <TextInput style={styles.formInput} placeholder="Blanco" placeholderTextColor={COLORS.textLight}
                    value={publishForm.color} onChangeText={(t) => setPublishForm(p => ({ ...p, color: t }))} />
                </View>
              </View>

              <Text style={styles.formLabel}>PLACA *</Text>
              <TextInput style={[styles.formInput, styles.plateInput]} placeholder="ABC-123" placeholderTextColor={COLORS.textLight}
                value={publishForm.plateNumber} onChangeText={(t) => setPublishForm(p => ({ ...p, plateNumber: t.toUpperCase() }))}
                autoCapitalize="characters" />

              <Text style={styles.formLabel}>Estado del VehÃ­culo</Text>
              <View style={styles.conditionRow}>
                {(['excelente', 'bueno', 'regular'] as const).map((cond) => (
                  <TouchableOpacity
                    key={cond}
                    style={[styles.conditionBtn, publishForm.condition === cond && {
                      backgroundColor: (CONDITION_COLORS[cond]?.bg || COLORS.border),
                      borderColor: (CONDITION_COLORS[cond]?.text || COLORS.textLight),
                    }]}
                    onPress={() => setPublishForm(p => ({ ...p, condition: cond }))}
                  >
                    <Text style={[styles.conditionBtnText, publishForm.condition === cond && {
                      color: (CONDITION_COLORS[cond]?.text || COLORS.textLight),
                    }]}>{cond}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Precio Diario ($) *</Text>
              <TextInput style={styles.formInput} placeholder="25.00" placeholderTextColor={COLORS.textLight} keyboardType="numeric"
                value={publishForm.dailyPrice} onChangeText={(t) => setPublishForm(p => ({ ...p, dailyPrice: t }))} />

              <Text style={styles.formLabel}>UbicaciÃ³n</Text>
              <TextInput style={styles.formInput} placeholder="MÃ©rida Centro" placeholderTextColor={COLORS.textLight}
                value={publishForm.location} onChangeText={(t) => setPublishForm(p => ({ ...p, location: t }))} />

              <Text style={styles.formLabel}>DescripciÃ³n</Text>
              <TextInput style={[styles.formInput, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="Describe las condiciones..."
                placeholderTextColor={COLORS.textLight} multiline
                value={publishForm.description} onChangeText={(t) => setPublishForm(p => ({ ...p, description: t }))} />

              <Button title="PUBLICAR AUTO" onPress={handlePublishCar} style={{ marginTop: SPACING.lg, marginBottom: SPACING.xxl }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Rent Request Modal */}
      <Modal visible={showRentModal} animationType="slide" transparent onRequestClose={() => setShowRentModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Solicitar Alquiler</Text>
                <TouchableOpacity onPress={() => setShowRentModal(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              {selectedCar && (
                <>
                  <View style={styles.rentCarCard}>
                    <Text style={styles.rentCarTitle}>{selectedCar.brand} {selectedCar.model}</Text>
                    <View style={styles.rentPlateContainer}>
                      <Text style={styles.rentPlateNumber}>{selectedCar.plate_number}</Text>
                    </View>
                  </View>

                  {/* Owner info */}
                  <View style={styles.ownerCard}>
                    <Text style={styles.ownerLabel}>DueÃ±o del VehÃ­culo</Text>
                    <View style={styles.ownerRow}>
                      <View style={styles.ownerAvatar}>
                        <Ionicons name="person" size={24} color={COLORS.primary} />
                      </View>
                      <View>
                        <Text style={styles.ownerName}>{selectedCar.owner_name}</Text>
                        <Text style={styles.ownerPhone}>{selectedCar.owner_phone}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Price */}
                  <View style={styles.priceCard}>
                    <Text style={styles.priceLabelText}>Precio por dÃ­a</Text>
                    <Text style={styles.priceAmount}>${selectedCar.daily_price}</Text>
                  </View>

                  {/* Deposit */}
                  <View style={styles.depositCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm }}>
                      <Ionicons name="shield" size={18} color="#F59E0B" />
                      <Text style={styles.depositTitle}>DepÃ³sito de GarantÃ­a</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.depositLabel}>{DEPOSIT_MULTIPLIER} dÃ­as como garantÃ­a</Text>
                      <Text style={styles.depositAmount}>${(selectedCar.daily_price * DEPOSIT_MULTIPLIER).toFixed(2)}</Text>
                    </View>
                    <Text style={styles.depositNote}>Se retendrÃ¡ de tu billetera hasta devolver el vehÃ­culo</Text>
                  </View>

                  {/* Balance */}
                  <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Tu saldo disponible</Text>
                    <Text style={[styles.balanceAmount, {
                      color: userBalance >= (selectedCar.daily_price * DEPOSIT_MULTIPLIER) ? COLORS.primary : COLORS.accent
                    }]}>
                      ${userBalance.toFixed(2)}
                    </Text>
                  </View>

                  {userBalance < (selectedCar.daily_price * DEPOSIT_MULTIPLIER) && (
                    <View style={styles.insufficientBanner}>
                      <Ionicons name="warning" size={16} color={COLORS.accent} />
                      <Text style={styles.insufficientText}>Saldo insuficiente. Recarga tu billetera.</Text>
                    </View>
                  )}

                  <Button
                    title={processingHold ? 'Procesando garantÃ­a...' : 'CONFIRMAR SOLICITUD'}
                    onPress={handleRentRequest}
                    loading={processingHold}
                    disabled={userBalance < (selectedCar.daily_price * DEPOSIT_MULTIPLIER)}
                    style={{ marginTop: SPACING.lg, marginBottom: SPACING.xxl }}
                  />
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.sm },
  backText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.text, letterSpacing: 2 },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  publishBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.lg },
  publishBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.textOnPrimary, letterSpacing: 0.5 },
  // Tabs
  tabsScroll: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabsContainer: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.sm },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  tabBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.textOnPrimary },
  tabCount: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.primary + '20' },
  tabCountActive: { backgroundColor: 'rgba(0,0,0,0.2)' },
  tabCountText: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.primary },
  tabCountTextActive: { color: COLORS.textOnPrimary },
  // Content
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  loadingContainer: { paddingVertical: SPACING.xxl * 2, alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingVertical: SPACING.xxl * 2 },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginTop: SPACING.md },
  // Car Card
  carCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xxl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  carImagePlaceholder: { height: 160, backgroundColor: COLORS.surfaceHighlight, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  conditionBadge: { position: 'absolute', top: SPACING.sm, left: SPACING.sm },
  conditionText: { paddingHorizontal: SPACING.sm + 2, paddingVertical: 4, borderRadius: BORDER_RADIUS.full, fontSize: FONT_SIZE.xs, fontWeight: '600', overflow: 'hidden', textTransform: 'capitalize' },
  priceBadge: { position: 'absolute', top: SPACING.sm, right: SPACING.sm, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: SPACING.sm + 2, paddingVertical: 4, borderRadius: BORDER_RADIUS.full },
  priceText: { fontSize: FONT_SIZE.sm, fontWeight: 'bold', color: COLORS.primary },
  carInfo: { padding: SPACING.md },
  carInfoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  carTitle: { fontSize: FONT_SIZE.lg, fontWeight: 'bold', color: COLORS.text },
  carMeta: { fontSize: FONT_SIZE.sm, color: COLORS.textLight },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: FONT_SIZE.sm, fontWeight: '500', color: '#F59E0B' },
  plateContainer: { backgroundColor: COLORS.surfaceHighlight, padding: SPACING.sm + 2, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', marginBottom: SPACING.sm },
  plateLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginBottom: 2 },
  plateNumber: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 3 },
  carDescription: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  carMetaRow: { flexDirection: 'row', gap: SPACING.lg, marginBottom: SPACING.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FONT_SIZE.sm, color: COLORS.textLight },
  rentButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg },
  rentButtonText: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.textOnPrimary, letterSpacing: 1 },
  // Simple cards
  simpleCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  simpleCardTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text },
  simpleCardSub: { fontSize: FONT_SIZE.sm, color: COLORS.textLight },
  statusBadge: { paddingHorizontal: SPACING.sm + 2, paddingVertical: 4, borderRadius: BORDER_RADIUS.full },
  statusText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: BORDER_RADIUS.xxl, borderTopRightRadius: BORDER_RADIUS.xxl, padding: SPACING.lg, maxHeight: '90%', borderWidth: 1, borderColor: COLORS.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text, letterSpacing: 1 },
  // Form
  formRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  formHalf: { flex: 1 },
  formLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs, marginTop: SPACING.sm },
  formInput: { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, fontSize: FONT_SIZE.md, color: COLORS.text, minHeight: 48 },
  plateInput: { textAlign: 'center', fontSize: FONT_SIZE.xl, fontWeight: 'bold', letterSpacing: 3, minHeight: 56 },
  conditionRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  conditionBtn: { flex: 1, paddingVertical: SPACING.sm + 2, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  conditionBtnText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textTransform: 'capitalize' },
  // Rent modal
  rentCarCard: { backgroundColor: COLORS.surfaceHighlight, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.md },
  rentCarTitle: { fontSize: FONT_SIZE.lg, fontWeight: 'bold', color: COLORS.text },
  rentPlateContainer: { backgroundColor: COLORS.background, padding: SPACING.sm + 2, borderRadius: BORDER_RADIUS.lg, marginTop: SPACING.sm },
  rentPlateNumber: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 3, textAlign: 'center' },
  ownerCard: { backgroundColor: COLORS.surfaceHighlight, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md },
  ownerLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  ownerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  ownerName: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text },
  ownerPhone: { fontSize: FONT_SIZE.sm, color: COLORS.textLight },
  priceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderRadius: BORDER_RADIUS.xl, backgroundColor: COLORS.primary + '10', borderWidth: 1, borderColor: COLORS.primary + '30', marginBottom: SPACING.sm },
  priceLabelText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  priceAmount: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.primary },
  depositCard: { padding: SPACING.md, borderRadius: BORDER_RADIUS.xl, backgroundColor: '#F59E0B10', borderWidth: 1, borderColor: '#F59E0B30', marginBottom: SPACING.sm },
  depositTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: '#F59E0B' },
  depositLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  depositAmount: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: '#F59E0B' },
  depositNote: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginTop: SPACING.xs },
  balanceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.sm + 2, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.surfaceHighlight },
  balanceLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  balanceAmount: { fontSize: FONT_SIZE.md, fontWeight: 'bold' },
  insufficientBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.sm + 2, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.accent + '10', borderWidth: 1, borderColor: COLORS.accent + '30', marginTop: SPACING.sm },
  insufficientText: { fontSize: FONT_SIZE.sm, color: COLORS.accent },
});
