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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import api from '../lib/api';

const TEAL = '#14B8A6';

export default function MedicoDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pharmacies, setPharmacies] = useState<any[]>([]);

  // Form state
  const [rxForm, setRxForm] = useState({
    patientName: '', patientPhone: '', patientCedula: '',
    diagnosis: '', notes: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
    pharmacyId: '',
  });

  const fetchData = async () => {
    try {
      const [rxRes, statsRes, pharmacyRes] = await Promise.all([
        api.get('/prescriptions/my-prescriptions').catch(() => ({ data: { prescriptions: [] } })),
        api.get('/prescriptions/stats').catch(() => ({ data: null })),
        api.get('/market/stores').catch(() => ({ data: { stores: [] } })),
      ]);
      setPrescriptions(rxRes.data.prescriptions || []);
      setStats(statsRes.data);
      const farmacias = (pharmacyRes.data.stores || pharmacyRes.data || []).filter(
        (s: any) => s.category === 'farmacia' || s.name?.toLowerCase().includes('farmacia')
      );
      setPharmacies(farmacias);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const addMedication = () => {
    setRxForm(prev => ({ ...prev, medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '' }] }));
  };

  const updateMedication = (index: number, field: string, value: string) => {
    const meds = [...rxForm.medications];
    (meds[index] as any)[field] = value;
    setRxForm(prev => ({ ...prev, medications: meds }));
  };

  const removeMedication = (index: number) => {
    if (rxForm.medications.length <= 1) return;
    setRxForm(prev => ({ ...prev, medications: prev.medications.filter((_, i) => i !== index) }));
  };

  const handleCreatePrescription = async () => {
    if (!rxForm.patientName || !rxForm.medications[0]?.name) {
      Alert.alert('Error', 'Nombre del paciente y al menos un medicamento son requeridos');
      return;
    }
    try {
      await api.post('/prescriptions', {
        patient_name: rxForm.patientName,
        patient_phone: rxForm.patientPhone,
        patient_cedula: rxForm.patientCedula,
        diagnosis: rxForm.diagnosis,
        notes: rxForm.notes,
        medications: rxForm.medications.filter(m => m.name),
        pharmacy_id: rxForm.pharmacyId || undefined,
      });
      Alert.alert('Éxito', 'Receta creada y enviada');
      setShowCreateModal(false);
      setRxForm({ patientName: '', patientPhone: '', patientCedula: '', diagnosis: '', notes: '', medications: [{ name: '', dosage: '', frequency: '', duration: '' }], pharmacyId: '' });
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Error al crear receta');
    }
  };

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    created: { bg: '#3B82F620', text: '#3B82F6', label: 'Enviada' },
    sent: { bg: '#F59E0B20', text: '#F59E0B', label: 'En farmacia' },
    preparing: { bg: '#F9731620', text: '#F97316', label: 'Preparando' },
    dispensed: { bg: COLORS.primary + '20', text: COLORS.primary, label: 'Despachada' },
    cancelled: { bg: COLORS.accent + '20', text: COLORS.accent, label: 'Cancelada' },
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TEAL} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={[styles.roleAvatar, { backgroundColor: TEAL + '20' }]}>
          <Ionicons name="medical" size={24} color={TEAL} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.roleLabel, { color: TEAL }]}>MÉDICO</Text>
          <Text style={styles.userName}>{user?.name || 'Doctor'}</Text>
        </View>
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsRow}>
          {[
            { label: 'Total', value: stats.total_prescriptions || 0, icon: 'document-text', color: '#3B82F6' },
            { label: 'Hoy', value: stats.today || 0, icon: 'time', color: TEAL },
            { label: 'Pendientes', value: stats.pending || 0, icon: 'send', color: '#F59E0B' },
            { label: 'Despachadas', value: stats.dispensed || 0, icon: 'checkmark-circle', color: COLORS.primary },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Ionicons name={s.icon as any} size={16} color={s.color} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* New Prescription Button */}
      <TouchableOpacity style={[styles.createBtn, { backgroundColor: TEAL }]} onPress={() => setShowCreateModal(true)}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.createBtnText}>NUEVA RECETA MÉDICA</Text>
      </TouchableOpacity>

      {/* Prescriptions */}
      <Text style={styles.sectionTitle}>RECETAS EMITIDAS</Text>
      {prescriptions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="clipboard-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.emptyText}>No has emitido recetas</Text>
          <Text style={styles.emptySubtext}>Crea tu primera receta digital</Text>
        </View>
      ) : (
        prescriptions.map((rx: any) => {
          const st = statusColors[rx.status] || statusColors.created;
          return (
            <View key={rx.prescription_id} style={styles.rxCard}>
              <View style={styles.rxHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="person" size={14} color={TEAL} />
                    <Text style={styles.rxPatient}>{rx.patient_name}</Text>
                  </View>
                  <Text style={styles.rxDiagnosis}>{rx.diagnosis}</Text>
                </View>
                <View style={[styles.rxStatusBadge, { backgroundColor: st.bg }]}>
                  <Text style={[styles.rxStatusText, { color: st.text }]}>{st.label}</Text>
                </View>
              </View>
              {rx.medications?.map((med: any, i: number) => (
                <View key={i} style={styles.rxMed}>
                  <Ionicons name="medical" size={12} color={TEAL} />
                  <Text style={styles.rxMedName}>{med.name}</Text>
                  <Text style={styles.rxMedInfo}>{[med.dosage, med.frequency].filter(Boolean).join(' - ')}</Text>
                </View>
              ))}
              <Text style={styles.rxDate}>
                {new Date(rx.created_at).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
          );
        })
      )}

      {/* Create Prescription Modal */}
      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>ACCIONES RAPIDAS</Text>
      <View style={styles.quickActionsRow}>
        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(main)/service-history')}>
          <Ionicons name="time" size={20} color={TEAL} />
          <Text style={styles.quickActionText}>Historial</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(main)/chat')}>
          <Ionicons name="chatbubbles" size={20} color={COLORS.primary} />
          <Text style={styles.quickActionText}>Chat</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showCreateModal} animationType="slide" transparent onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Ionicons name="medical" size={20} color={TEAL} />
                  <Text style={styles.modalTitle}>Nueva Receta</Text>
                </View>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.formLabel}>Paciente *</Text>
              <TextInput style={styles.formInput} placeholder="Nombre del paciente" placeholderTextColor={COLORS.textLight}
                value={rxForm.patientName} onChangeText={(t) => setRxForm(p => ({ ...p, patientName: t }))} />

              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Teléfono</Text>
                  <TextInput style={styles.formInput} placeholder="0412..." placeholderTextColor={COLORS.textLight} keyboardType="phone-pad"
                    value={rxForm.patientPhone} onChangeText={(t) => setRxForm(p => ({ ...p, patientPhone: t }))} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Cédula</Text>
                  <TextInput style={styles.formInput} placeholder="V-12345678" placeholderTextColor={COLORS.textLight}
                    value={rxForm.patientCedula} onChangeText={(t) => setRxForm(p => ({ ...p, patientCedula: t }))} />
                </View>
              </View>

              <Text style={styles.formLabel}>Diagnóstico</Text>
              <TextInput style={styles.formInput} placeholder="Diagnóstico del paciente" placeholderTextColor={COLORS.textLight}
                value={rxForm.diagnosis} onChangeText={(t) => setRxForm(p => ({ ...p, diagnosis: t }))} />

              {/* Medications */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md }}>
                <Text style={[styles.formLabel, { marginTop: 0, marginBottom: 0 }]}>Medicamentos *</Text>
                <TouchableOpacity onPress={addMedication}>
                  <Ionicons name="add-circle" size={28} color={TEAL} />
                </TouchableOpacity>
              </View>
              {rxForm.medications.map((med, i) => (
                <View key={i} style={styles.medCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: FONT_SIZE.xs, color: TEAL, fontWeight: '600' }}>Medicamento {i + 1}</Text>
                    {rxForm.medications.length > 1 && (
                      <TouchableOpacity onPress={() => removeMedication(i)}>
                        <Ionicons name="trash" size={16} color={COLORS.accent} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TextInput style={styles.medInput} placeholder="Nombre del medicamento *" placeholderTextColor={COLORS.textLight}
                    value={med.name} onChangeText={(t) => updateMedication(i, 'name', t)} />
                  <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
                    <TextInput style={[styles.medInput, { flex: 1 }]} placeholder="Dosis" placeholderTextColor={COLORS.textLight}
                      value={med.dosage} onChangeText={(t) => updateMedication(i, 'dosage', t)} />
                    <TextInput style={[styles.medInput, { flex: 1 }]} placeholder="Frecuencia" placeholderTextColor={COLORS.textLight}
                      value={med.frequency} onChangeText={(t) => updateMedication(i, 'frequency', t)} />
                  </View>
                  <TextInput style={styles.medInput} placeholder="Duración (ej: 7 días)" placeholderTextColor={COLORS.textLight}
                    value={med.duration} onChangeText={(t) => updateMedication(i, 'duration', t)} />
                </View>
              ))}

              {pharmacies.length > 0 && (
                <>
                  <Text style={styles.formLabel}>Enviar a Farmacia</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.sm }}>
                    {pharmacies.map((ph: any) => (
                      <TouchableOpacity key={ph.store_id}
                        style={[styles.pharmacyChip, rxForm.pharmacyId === ph.store_id && { borderColor: TEAL, backgroundColor: TEAL + '15' }]}
                        onPress={() => setRxForm(p => ({ ...p, pharmacyId: ph.store_id }))}>
                        <Ionicons name="medical" size={14} color={rxForm.pharmacyId === ph.store_id ? TEAL : COLORS.textSecondary} />
                        <Text style={[styles.pharmacyChipText, rxForm.pharmacyId === ph.store_id && { color: TEAL }]}>{ph.name || ph.store_name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <Text style={styles.formLabel}>Notas adicionales</Text>
              <TextInput style={[styles.formInput, { minHeight: 60, textAlignVertical: 'top' }]} placeholder="Indicaciones especiales..."
                placeholderTextColor={COLORS.textLight} multiline
                value={rxForm.notes} onChangeText={(t) => setRxForm(p => ({ ...p, notes: t }))} />

              <Button title="CREAR RECETA" onPress={handleCreatePrescription} style={{ marginTop: SPACING.lg, marginBottom: SPACING.xxl, backgroundColor: TEAL }} />
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
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.lg },
  roleAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  roleLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', letterSpacing: 2 },
  userName: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.sm + 2, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', gap: 2 },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textLight },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.md + 2, borderRadius: BORDER_RADIUS.xl, marginBottom: SPACING.lg },
  createBtnText: { fontSize: FONT_SIZE.md, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  sectionTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1, marginBottom: SPACING.md },
  emptyBox: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xxl, alignItems: 'center', gap: SPACING.sm },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.text, fontWeight: '500' },
  emptySubtext: { fontSize: FONT_SIZE.sm, color: COLORS.textLight },
  rxCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm },
  rxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  rxPatient: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text },
  rxDiagnosis: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  rxStatusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  rxStatusText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  rxMed: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm, borderRadius: BORDER_RADIUS.md, backgroundColor: 'rgba(20,184,166,0.08)', marginBottom: 4 },
  rxMedName: { fontSize: FONT_SIZE.sm, fontWeight: '500', color: COLORS.text },
  rxMedInfo: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
  rxDate: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginTop: SPACING.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: BORDER_RADIUS.xxl, borderTopRightRadius: BORDER_RADIUS.xxl, padding: SPACING.lg, maxHeight: '90%', borderWidth: 1, borderColor: COLORS.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  formLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs, marginTop: SPACING.md },
  formInput: { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, fontSize: FONT_SIZE.md, color: COLORS.text, minHeight: 48 },
  medCard: { backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, marginTop: SPACING.sm, gap: SPACING.xs },
  medInput: { backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, fontSize: FONT_SIZE.sm, color: COLORS.text, minHeight: 40 },
  pharmacyChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: COLORS.border, marginRight: SPACING.sm },
  pharmacyChipText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  quickActionsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  quickAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, paddingVertical: SPACING.md },
  quickActionText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textSecondary },
});
