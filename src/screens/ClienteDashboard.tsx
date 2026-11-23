import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/ui';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import api, { exchangeRateApi, prescriptionsApi } from '../api';
import XuveMapView, { MapLocation } from '../components/XuveMapView';
import LocationSearchInput from '../components/LocationSearchInput';
import MaintenanceView from '../components/MaintenanceView';
import { useQuote } from '../hooks/useQuote';

const SERVICE_TABS = [
  { id: 'viajes', label: 'Viajes', icon: 'car' },
  { id: 'salud', label: 'Salud', icon: 'heart' },
  { id: 'terminales', label: 'Terminales', icon: 'bus' },
  { id: 'fletes', label: 'Fletes', icon: 'cube' },
  { id: 'market', label: 'Market', icon: 'storefront' },
  { id: 'rent', label: 'Rent', icon: 'key' },
];

const VEHICLE_OPTIONS = [
  { id: 'carro_particular', label: 'Carro', icon: 'car', time: '3-5 min' },
  { id: 'taxi_linea', label: 'Taxi', icon: 'car-sport', time: '5-8 min' },
  { id: 'mototaxi', label: 'Mototaxi', icon: 'bicycle', time: '2-4 min' },
];

const PAYMENT_OPTIONS = [
  { id: 'efectivo', label: 'Efectivo', icon: 'cash' },
  { id: 'pago_movil', label: 'Pago Móvil', icon: 'phone-portrait' },
  { id: 'wallet', label: 'Wallet Xuve', icon: 'wallet' },
];

export default function ClienteDashboard() {
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('viajes');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('carro_particular');
  const [selectedPayment, setSelectedPayment] = useState<string>('efectivo');
  const [mapTarget, setMapTarget] = useState<'origin' | 'destination'>('origin');
  const [origin, setOrigin] = useState<MapLocation | null>(null);
  const [destination, setDestination] = useState<MapLocation | null>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loadingRx, setLoadingRx] = useState(false);
  const [requestingRide, setRequestingRide] = useState(false);

  // Cotización en tiempo real vía proxy cuando hay origen y destino
  const { quote, loading: quoteLoading } = useQuote(origin, destination);

  const selectedFare = quote?.fares?.find((f) => f.vehicle_type === selectedVehicle);
  const currentFareAmount = selectedFare?.estimated_fare || (selectedVehicle === 'mototaxi' ? 2.50 : selectedVehicle === 'taxi_linea' ? 4.50 : 3.50);

  const walletBalance = user?.wallet_balance || 0;
  const walletHeld = user?.wallet_held || 0;
  const availableBalance = walletBalance - walletHeld;

  const fetchExchangeRate = async () => {
    try {
      const data = await exchangeRateApi.getExchangeRate();
      setExchangeRate(data.usd_to_bs);
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
    }
  };

  const fetchPrescriptions = async () => {
    setLoadingRx(true);
    try {
      const res = await prescriptionsApi.getPatientPrescriptions();
      setPrescriptions(res.prescriptions || []);
    } catch (err) {
      console.log('No prescriptions yet');
    } finally {
      setLoadingRx(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), fetchExchangeRate()]);
    setRefreshing(false);
  };

  useEffect(() => { fetchExchangeRate(); }, []);
  useEffect(() => { if (activeTab === 'salud') fetchPrescriptions(); }, [activeTab]);

  const handleMapPress = (loc: MapLocation) => {
    if (mapTarget === 'origin') {
      setOrigin(loc);
      if (!destination) {
        setMapTarget('destination');
      }
    } else {
      setDestination(loc);
    }
  };

  const handleRequestRide = async () => {
    if (!origin) { Alert.alert('Atención', 'Selecciona el punto de recogida (origen) tocando el mapa o en el buscador.'); return; }
    if (!destination) { Alert.alert('Atención', 'Selecciona el destino tocando el mapa o en el buscador.'); return; }
    if (!selectedVehicle) { Alert.alert('Atención', 'Selecciona un tipo de vehículo.'); return; }
    if (!selectedPayment) { Alert.alert('Atención', 'Selecciona un método de pago.'); return; }

    setRequestingRide(true);
    try {
      const res = await api.post('/services/request', {
        service_type: 'ride',
        pickup_lat: origin.latitude,
        pickup_lng: origin.longitude,
        pickup_address: origin.name || 'Origen seleccionado',
        dropoff_lat: destination.latitude,
        dropoff_lng: destination.longitude,
        dropoff_address: destination.name || 'Destino seleccionado',
        vehicle_preference: selectedVehicle,
        estimated_fare: currentFareAmount,
        notes: `Pago: ${selectedPayment}`,
      });
      const created = res.data;
      router.push({
        pathname: '/(main)/active-ride',
        params: { serviceId: created.service_id || 'demo' },
      });
    } catch (e: any) {
      router.push('/(main)/active-ride');
    } finally {
      setRequestingRide(false);
    }
  };

  const renderViajesTab = () => (
    <View style={styles.tabContent}>
      {/* Location Search Inputs */}
      <View style={styles.locationContainer}>
        <View style={{ zIndex: 200 }}>
          <LocationSearchInput
            placeholder="¿Dónde te recogemos? (Origen)"
            value={origin}
            onLocationSelect={(loc) => {
              setOrigin(loc);
              if (loc && !destination) setMapTarget('destination');
            }}
            dotColor={COLORS.primary}
            iconColor={COLORS.primary}
          />
        </View>
        <View style={styles.locationDivider} />
        <View style={{ zIndex: 100 }}>
          <LocationSearchInput
            placeholder="¿A dónde vas? (Destino)"
            value={destination}
            onLocationSelect={setDestination}
            dotColor={COLORS.accent}
            iconColor={COLORS.accent}
          />
        </View>
      </View>

      {/* Map Interactive Toolbar: Fijar Origen / Fijar Destino */}
      <View style={styles.mapToolbar}>
        <TouchableOpacity
          style={[styles.mapTargetBtn, mapTarget === 'origin' && styles.mapTargetBtnActiveOrigin]}
          onPress={() => setMapTarget('origin')}
        >
          <Ionicons name="location" size={14} color={mapTarget === 'origin' ? '#000' : '#4DFF91'} />
          <Text style={[styles.mapTargetText, mapTarget === 'origin' && styles.mapTargetTextActive]}>
            Fijar Origen
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mapTargetBtn, mapTarget === 'destination' && styles.mapTargetBtnActiveDest]}
          onPress={() => setMapTarget('destination')}
        >
          <Ionicons name="flag" size={14} color={mapTarget === 'destination' ? '#fff' : '#FF4444'} />
          <Text style={[styles.mapTargetText, mapTarget === 'destination' && styles.mapTargetTextActive]}>
            Fijar Destino
          </Text>
        </TouchableOpacity>

        {(origin || destination) && (
          <TouchableOpacity
            style={styles.mapClearBtn}
            onPress={() => {
              setOrigin(null);
              setDestination(null);
              setMapTarget('origin');
            }}
          >
            <Ionicons name="close-circle-outline" size={16} color={COLORS.textLight} />
            <Text style={styles.mapClearText}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Interactive Map */}
      <XuveMapView
        origin={origin}
        destination={destination}
        routeCoordinates={quote?.polyline}
        distanceText={quote?.distance_text}
        durationText={quote?.duration_text}
        onMapPress={handleMapPress}
        onOriginChange={setOrigin}
        onDestinationChange={setDestination}
        onUserLocate={(loc) => {
          setOrigin(loc);
          if (!destination) setMapTarget('destination');
        }}
        showUserLocation
        style={styles.mapView}
      />
      <Text style={styles.sectionLabel}>SELECCIONA TU VEHÍCULO</Text>
      <View style={styles.optionsRow}>
        {VEHICLE_OPTIONS.map((v) => {
          const fareObj = quote?.fares?.find((f) => f.vehicle_type === v.id);
          const priceText = fareObj ? `$${fareObj.estimated_fare.toFixed(2)}` : null;
          return (
            <TouchableOpacity
              key={v.id}
              style={[styles.optionCard, selectedVehicle === v.id && styles.optionCardActive]}
              onPress={() => setSelectedVehicle(v.id)}
            >
              <Ionicons
                name={v.icon as any}
                size={24}
                color={selectedVehicle === v.id ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.optionLabel, selectedVehicle === v.id && styles.optionLabelActive]}>
                {v.label}
              </Text>
              <Text style={styles.optionTime}>
                {quote?.duration_text || v.time}
              </Text>
              {priceText && (
                <Text style={styles.optionPrice}>{priceText}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.sectionLabel}>¿CÓMO VAS A PAGAR?</Text>
      <View style={styles.optionsRow}>
        {PAYMENT_OPTIONS.map((p) => (
          <TouchableOpacity key={p.id} style={[styles.optionCard, selectedPayment === p.id && styles.optionCardCyan]} onPress={() => setSelectedPayment(p.id)}>
            <Ionicons name={p.icon as any} size={24} color={selectedPayment === p.id ? COLORS.secondary : COLORS.textSecondary} />
            <Text style={[styles.optionLabel, selectedPayment === p.id && { color: COLORS.secondary }]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.requestButton, (!origin || !destination) && { opacity: 0.7 }]}
        onPress={handleRequestRide}
        disabled={requestingRide}
      >
        <Ionicons name="navigate" size={20} color={COLORS.textOnPrimary} />
        <Text style={styles.requestButtonText}>
          {origin && destination
            ? `SOLICITAR VIAJE • $${currentFareAmount.toFixed(2)}`
            : 'SOLICITAR VIAJE'}
        </Text>
      </TouchableOpacity>
      {/* Quick Actions */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity style={styles.quickActionLink} onPress={() => router.push('/(main)/service-history')}>
          <Ionicons name="time" size={18} color={COLORS.secondary} />
          <Text style={styles.quickActionText}>Historial</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionLink} onPress={() => router.push('/(main)/chat')}>
          <Ionicons name="chatbubbles" size={18} color={COLORS.primary} />
          <Text style={styles.quickActionText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionLink} onPress={() => router.push('/(main)/driver-register')}>
          <Ionicons name="person-add" size={18} color={COLORS.warning} />
          <Text style={styles.quickActionText}>Ser Socio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSaludTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Salud</Text>
      <Text style={styles.tabSubtitle}>Recetas médicas y medicamentos a domicilio</Text>
      {loadingRx ? (
        <View style={styles.emptyContainer}><Text style={styles.emptyText}>Cargando...</Text></View>
      ) : prescriptions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart" size={48} color={COLORS.textLight} />
          <Text style={styles.emptyText}>No tienes recetas</Text>
          <Text style={styles.emptySubtext}>Cuando un médico te envíe una receta, aparecerá aquí</Text>
        </View>
      ) : (
        prescriptions.map((rx: any) => (
          <Card key={rx.prescription_id} style={styles.rxCard} variant="outlined">
            <View style={styles.rxHeader}>
              <View>
                <Text style={styles.rxDoctor}>{rx.doctor_name}</Text>
                <Text style={styles.rxSpecialty}>{rx.doctor_specialty}</Text>
              </View>
              <View style={[styles.rxStatusBadge, { backgroundColor: COLORS.info + '20' }]}>
                <Text style={[styles.rxStatusText, { color: COLORS.info }]}>{rx.status}</Text>
              </View>
            </View>
            {rx.medications?.map((med: any, i: number) => (
              <View key={i} style={styles.rxMed}>
                <Text style={styles.rxMedName}>{med.name}</Text>
                <Text style={styles.rxMedInfo}>{[med.dosage, med.frequency, med.duration].filter(Boolean).join(' | ')}</Text>
              </View>
            ))}
          </Card>
        ))
      )}
    </View>
  );

  const renderTerminalesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Viajes Interurbanos</Text>
      <Text style={styles.tabSubtitle}>Viaja entre ciudades desde terminales</Text>
      <TouchableOpacity style={styles.serviceLink}>
        <View style={[styles.serviceLinkIcon, { backgroundColor: '#8B5CF630' }]}><Ionicons name="bus" size={24} color="#8B5CF6" /></View>
        <View style={styles.serviceLinkContent}><Text style={styles.serviceLinkTitle}>Buscar Rutas</Text><Text style={styles.serviceLinkDesc}>Encuentra viajes entre ciudades</Text></View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
      </TouchableOpacity>
    </View>
  );

  const renderFletesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Carga y Fletes</Text>
      <Text style={styles.tabSubtitle}>Mudanzas, cisternas y transporte de carga</Text>
      <TouchableOpacity style={styles.serviceLink}>
        <View style={[styles.serviceLinkIcon, { backgroundColor: '#FF8C0030' }]}><Ionicons name="cube" size={24} color="#FF8C00" /></View>
        <View style={styles.serviceLinkContent}><Text style={styles.serviceLinkTitle}>Solicitar Flete</Text><Text style={styles.serviceLinkDesc}>Camiones, mudanzas, cisternas</Text></View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
      </TouchableOpacity>
      <View style={[styles.serviceLink, { opacity: 0.6 }]}>
        <View style={[styles.serviceLinkIcon, { backgroundColor: COLORS.warning + '30' }]}><Ionicons name="flash" size={24} color={COLORS.warning} /></View>
        <View style={styles.serviceLinkContent}><Text style={styles.serviceLinkTitle}>Envíos Express</Text><Text style={styles.serviceLinkDesc}>Paquetería rápida mismo día</Text></View>
        <View style={styles.comingSoonBadge}><Text style={styles.comingSoonText}>Pronto</Text></View>
      </View>
    </View>
  );

  const renderMarketTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Xuve Market</Text>
      <Text style={styles.tabSubtitle}>Compra en comercios locales con delivery</Text>
      <TouchableOpacity style={styles.serviceLink} onPress={() => router.push('/(main)/market')}>
        <View style={[styles.serviceLinkIcon, { backgroundColor: COLORS.primary + '30' }]}><Ionicons name="storefront" size={24} color={COLORS.primary} /></View>
        <View style={styles.serviceLinkContent}><Text style={styles.serviceLinkTitle}>Explorar Tiendas</Text><Text style={styles.serviceLinkDesc}>Restaurantes, farmacias, minimarkets</Text></View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.serviceLink} onPress={() => router.push('/(main)/cart')}>
        <View style={[styles.serviceLinkIcon, { backgroundColor: COLORS.secondary + '30' }]}><Ionicons name="bag-handle" size={24} color={COLORS.secondary} /></View>
        <View style={styles.serviceLinkContent}><Text style={styles.serviceLinkTitle}>Mi Carrito</Text><Text style={styles.serviceLinkDesc}>Ver productos agregados</Text></View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
      </TouchableOpacity>
    </View>
  );

  const renderRentTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Rent-a-Car</Text>
      <Text style={styles.tabSubtitle}>Alquila vehículos por horas o días</Text>
      <TouchableOpacity style={styles.serviceLink} onPress={() => router.push('/(main)/rent')}>
        <View style={[styles.serviceLinkIcon, { backgroundColor: COLORS.warning + '30' }]}><Ionicons name="key" size={24} color={COLORS.warning} /></View>
        <View style={styles.serviceLinkContent}><Text style={styles.serviceLinkTitle}>Ver Vehículos</Text><Text style={styles.serviceLinkDesc}>Carros, motos, camionetas</Text></View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
      </TouchableOpacity>
      <View style={styles.promoBanner}><Text style={styles.promoTitle}>Promoción Especial</Text><Text style={styles.promoDesc}>10% de descuento en alquileres de fin de semana</Text></View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'viajes':
        return renderViajesTab();
      case 'salud':
        return (
          <MaintenanceView
            inline
            moduleName="Xuve Salud"
            description="Consultas médicas y recetas digitales en optimización. Nos encontramos enfocados en el servicio de transporte."
            actionLabel="Volver a Viajes"
            onAction={() => setActiveTab('viajes')}
          />
        );
      case 'terminales':
        return (
          <MaintenanceView
            inline
            moduleName="Terminales e Interurbano"
            description="Rutas interurbanas y compra de pasajes en mantenimiento temporal."
            actionLabel="Volver a Viajes"
            onAction={() => setActiveTab('viajes')}
          />
        );
      case 'fletes':
        return (
          <MaintenanceView
            inline
            moduleName="Xuve Fletes y Cargas"
            description="Transporte de encomiendas pesadas y mudanzas en mantenimiento temporal."
            actionLabel="Volver a Viajes"
            onAction={() => setActiveTab('viajes')}
          />
        );
      case 'market':
        return (
          <MaintenanceView
            inline
            moduleName="Xuve Market & Delivery"
            description="Comercios aliados y catálogo de delivery en optimización."
            actionLabel="Volver a Viajes"
            onAction={() => setActiveTab('viajes')}
          />
        );
      case 'rent':
        return (
          <MaintenanceView
            inline
            moduleName="Rent-a-Car"
            description="Alquiler de vehículos particulares en mantenimiento temporal."
            actionLabel="Volver a Viajes"
            onAction={() => setActiveTab('viajes')}
          />
        );
      default:
        return renderViajesTab();
    }
  };

  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeLabel}>BIENVENIDO</Text>
            <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Usuario'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.walletBadge} onPress={() => router.push('/(main)/wallet')}>
              <Ionicons name="wallet" size={14} color={COLORS.primary} />
              <Text style={styles.walletBadgeText}>${availableBalance.toFixed(2)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(main)/notifications')}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(main)/profile')}>
              <Ionicons name="menu" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScrollView} contentContainerStyle={styles.tabsContainer}>
          {SERVICE_TABS.map((tab) => (
            <TouchableOpacity key={tab.id} style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]} onPress={() => setActiveTab(tab.id)}>
              <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.id ? COLORS.textOnPrimary : COLORS.textSecondary} />
              <Text style={[styles.tabButtonText, activeTab === tab.id && styles.tabButtonTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: 'rgba(0,0,0,0.7)', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.sm },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  welcomeLabel: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: '700', letterSpacing: 2 },
  userName: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  walletBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.xs + 2, borderRadius: BORDER_RADIUS.full, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: COLORS.primary + '30' },
  walletBadgeText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.primary },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  tabsScrollView: { flexGrow: 0 },
  tabsContainer: { gap: SPACING.xs, paddingVertical: SPACING.xs },
  tabButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.lg, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: COLORS.border },
  tabButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabButtonText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textSecondary },
  tabButtonTextActive: { color: COLORS.textOnPrimary },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: SPACING.xxl },
  tabContent: { padding: SPACING.md },
  tabTitle: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.xs },
  tabSubtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  locationContainer: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md, zIndex: 200, overflow: 'visible' },
  locationDivider: { height: 1, backgroundColor: COLORS.border, marginLeft: 28, marginVertical: SPACING.xs },
  mapToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  mapTargetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapTargetBtnActiveOrigin: {
    backgroundColor: '#4DFF91',
    borderColor: '#4DFF91',
  },
  mapTargetBtnActiveDest: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  mapTargetText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  mapTargetTextActive: {
    color: '#000',
  },
  mapClearBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  mapClearText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
  },
  mapView: { height: 260, borderRadius: BORDER_RADIUS.xl, marginBottom: SPACING.md },
  sectionLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1, marginBottom: SPACING.sm },
  optionsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  optionCard: { flex: 1, alignItems: 'center', paddingVertical: SPACING.md, paddingHorizontal: SPACING.sm, borderRadius: BORDER_RADIUS.xl, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: COLORS.border, gap: SPACING.xs },
  optionCardActive: { backgroundColor: COLORS.primary + '15', borderWidth: 2, borderColor: COLORS.primary },
  optionCardCyan: { backgroundColor: COLORS.secondary + '15', borderWidth: 2, borderColor: COLORS.secondary },
  optionLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  optionLabelActive: { color: COLORS.primary },
  optionTime: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
  optionPrice: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.primary, marginTop: 2 },
  requestButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.primary, paddingVertical: SPACING.md + 2, borderRadius: BORDER_RADIUS.xl, ...SHADOWS.neon },
  requestButtonText: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textOnPrimary, letterSpacing: 1 },
  serviceLink: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: BORDER_RADIUS.xl, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm, gap: SPACING.md },
  serviceLinkIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  serviceLinkContent: { flex: 1 },
  serviceLinkTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text },
  serviceLinkDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  comingSoonBadge: { paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.warning + '20' },
  comingSoonText: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.warning },
  rxCard: { marginBottom: SPACING.sm },
  rxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  rxDoctor: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text },
  rxSpecialty: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  rxStatusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  rxStatusText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  rxMed: { backgroundColor: COLORS.secondary + '10', borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, marginTop: SPACING.xs },
  rxMedName: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.secondary },
  rxMedInfo: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
  promoBanner: { padding: SPACING.md, borderRadius: BORDER_RADIUS.xl, backgroundColor: COLORS.warning + '15', borderWidth: 1, borderColor: COLORS.warning + '30', marginTop: SPACING.sm },
  promoTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.warning },
  promoDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  emptyContainer: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyText: { fontSize: FONT_SIZE.lg, color: COLORS.textSecondary, marginTop: SPACING.md },
  emptySubtext: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, marginTop: SPACING.xs, textAlign: 'center' },
  quickActionsRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  quickActionLink: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.xl, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  quickActionText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textSecondary },
});
