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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { Button } from '../../src/components/ui';
import api from '../../src/api';

export default function ServiceHistoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchServices = async () => {
    try {
      const res = await api.get('/services/history');
      setServices(res.data || []);
    } catch (error) {
      console.log('No service history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchServices(); setRefreshing(false); };

  const filteredServices = filter === 'all' ? services : services.filter(s => s.status === filter);

  const openRatingModal = (service: any) => {
    setSelectedService(service);
    setRating(0);
    setComment('');
    setShowRatingModal(true);
  };

  const submitRating = async () => {
    if (rating === 0) { Alert.alert('Error', 'Selecciona una calificaciÃ³n'); return; }
    setSubmitting(true);
    try {
      await api.post(`/services/${selectedService.service_id}/rate`, { rating, comment });
      Alert.alert('Gracias', 'Â¡CalificaciÃ³n enviada!');
      setShowRatingModal(false);
      fetchServices();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Error al enviar');
    } finally {
      setSubmitting(false);
    }
  };

  const FILTERS = [
    { id: 'all', label: 'Todos' },
    { id: 'completed', label: 'Completados' },
    { id: 'cancelled', label: 'Cancelados' },
    { id: 'in_progress', label: 'En progreso' },
  ];

  const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    completed: { bg: COLORS.primary + '20', text: COLORS.primary, label: 'Completado' },
    in_progress: { bg: COLORS.secondary + '20', text: COLORS.secondary, label: 'En progreso' },
    pending: { bg: '#F59E0B20', text: '#F59E0B', label: 'Pendiente' },
    accepted: { bg: '#3B82F620', text: '#3B82F6', label: 'Aceptado' },
    cancelled: { bg: COLORS.accent + '20', text: COLORS.accent, label: 'Cancelado' },
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HISTORIAL</Text>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContent}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f.id} style={[styles.filterChip, filter === f.id && styles.filterChipActive]} onPress={() => setFilter(f.id)}>
            <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>{f.label}</Text>
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
          <View style={styles.emptyContainer}><Text style={styles.emptyText}>Cargando...</Text></View>
        ) : filteredServices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No hay servicios</Text>
            <Text style={styles.emptySubtext}>Tu historial de viajes aparecerÃ¡ aquÃ­</Text>
          </View>
        ) : (
          filteredServices.map((service: any) => {
            const st = STATUS_COLORS[service.status] || STATUS_COLORS.pending;
            return (
              <View key={service.service_id} style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceTypeRow}>
                    <Ionicons name={service.service_type === 'delivery' ? 'bag-handle' : 'car'} size={16} color={COLORS.primary} />
                    <Text style={styles.serviceType}>{service.service_type === 'delivery' ? 'Delivery' : 'Viaje'}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.statusText, { color: st.text }]}>{st.label}</Text>
                  </View>
                </View>

                {/* Addresses */}
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
                  <Text style={styles.serviceFare}>${service.fare?.toFixed(2) || '0.00'}</Text>
                </View>

                {/* Rating */}
                {service.status === 'completed' && !service.rated && (
                  <TouchableOpacity style={styles.rateBtn} onPress={() => openRatingModal(service)}>
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <Text style={styles.rateBtnText}>CALIFICAR</Text>
                  </TouchableOpacity>
                )}
                {service.rated && (
                  <View style={styles.ratedRow}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Ionicons key={s} name="star" size={14} color={s <= (service.rating || 0) ? '#F59E0B' : COLORS.border} />
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Rating Modal */}
      <Modal visible={showRatingModal} animationType="slide" transparent onRequestClose={() => setShowRatingModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Calificar Servicio</Text>
              <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Stars */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <TouchableOpacity key={s} onPress={() => setRating(s)} style={styles.starBtn}>
                  <Ionicons name="star" size={40} color={s <= rating ? '#F59E0B' : COLORS.border} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingLabel}>
              {rating === 0 ? 'Toca una estrella' : rating <= 2 ? 'PodrÃ­a mejorar' : rating <= 4 ? 'Â¡Buen servicio!' : 'Â¡Excelente!'}
            </Text>

            <Text style={styles.formLabel}>Comentario (opcional)</Text>
            <TextInput style={[styles.formInput, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="Â¿CÃ³mo fue tu experiencia?"
              placeholderTextColor={COLORS.textLight} multiline value={comment} onChangeText={setComment} />

            <Button title="ENVIAR CALIFICACIÃ“N" onPress={submitRating} loading={submitting} style={{ marginTop: SPACING.lg, marginBottom: SPACING.xxl }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: 'bold', color: COLORS.text, letterSpacing: 2 },
  filtersScroll: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filtersContent: { padding: SPACING.sm, paddingHorizontal: SPACING.md, gap: SPACING.sm },
  filterChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontWeight: '600' },
  filterTextActive: { color: COLORS.textOnPrimary },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', paddingVertical: SPACING.xxl * 2 },
  emptyText: { fontSize: FONT_SIZE.lg, color: COLORS.textSecondary, marginTop: SPACING.md },
  emptySubtext: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, marginTop: SPACING.xs },
  serviceCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  serviceTypeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  serviceType: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  statusText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  addressContainer: { marginBottom: SPACING.sm },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  addressLine: { width: 2, height: 12, backgroundColor: COLORS.border, marginLeft: 4, marginVertical: 2 },
  addressText: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.text },
  serviceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  serviceDate: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  serviceFare: { fontSize: FONT_SIZE.lg, fontWeight: 'bold', color: COLORS.primary },
  rateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.sm, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.lg, backgroundColor: '#F59E0B15', borderWidth: 1, borderColor: '#F59E0B30' },
  rateBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: '#F59E0B', letterSpacing: 0.5 },
  ratedRow: { flexDirection: 'row', gap: 2, marginTop: SPACING.sm, justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: BORDER_RADIUS.xxl, borderTopRightRadius: BORDER_RADIUS.xxl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  starBtn: { padding: SPACING.xs },
  ratingLabel: { textAlign: 'center', fontSize: FONT_SIZE.lg, color: '#F59E0B', fontWeight: '500', marginBottom: SPACING.md },
  formLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs, marginTop: SPACING.md },
  formInput: { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, fontSize: FONT_SIZE.md, color: COLORS.text, minHeight: 48 },
});
