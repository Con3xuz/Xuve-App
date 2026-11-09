import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { Button } from '../../src/components/ui';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../src/constants/theme';
import api from '../../src/api';

const ROLES = [
  { id: 'user', label: 'Cliente', desc: 'Verificacion de identidad', icon: 'person', color: '#14B8A6', steps: ['identity'] },
  { id: 'socio_conductor', label: 'Conductor', desc: 'Taxi o carro particular', icon: 'car', color: '#4DFF91', steps: ['personal', 'license', 'vehicle'] },
  { id: 'socio_repartidor', label: 'Repartidor', desc: 'Moto delivery o bicicleta', icon: 'bicycle', color: '#3B82F6', steps: ['personal', 'license', 'vehicle'] },
  { id: 'socio_comercial', label: 'Comercial', desc: 'Tienda, restaurante, farmacia', icon: 'storefront', color: '#EC4899', steps: ['personal', 'store'] },
  { id: 'medico', label: 'Medico', desc: 'Profesional de la salud', icon: 'medical', color: '#14B8A6', steps: ['personal', 'medical_license'] },
  { id: 'rent_owner', label: 'Rent Owner', desc: 'Propietario vehiculo alquiler', icon: 'key', color: '#F59E0B', steps: ['personal', 'rent'] },
];

const STORE_CATS = [
  { id: 'restaurante', label: 'Restaurante' }, { id: 'farmacia', label: 'Farmacia' },
  { id: 'supermercado', label: 'Supermercado' }, { id: 'ferreteria', label: 'Ferreteria' },
  { id: 'electronica', label: 'Electronica' }, { id: 'ropa', label: 'Ropa/Moda' },
  { id: 'belleza', label: 'Belleza/Spa' }, { id: 'licores', label: 'Licoreria' },
  { id: 'otro', label: 'Otro' },
];

const VEHICLE_TYPES_CONDUCTOR = [
  { id: 'carro_particular', label: 'Carro Particular' }, { id: 'taxi_linea', label: 'Taxi de Linea' }, { id: 'mototaxi', label: 'Mototaxi' },
];
const VEHICLE_TYPES_REPARTIDOR = [
  { id: 'moto_delivery', label: 'Moto Delivery' }, { id: 'bicicleta', label: 'Bicicleta' },
];

export default function KYCScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<string | null>(user?.role || null);
  const [currentStep, setCurrentStep] = useState(0); // 0 = role selection
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    cedula_number: '', address: '',
    license_number: '', license_grade: '',
    plate_number: '', brand: '', model: '', year: '', color: '', vehicle_type: '',
    store_name: '', store_category: '', store_address: '', rif_type: 'J', rif_number: '',
    mpps_number: '', specialty: '', institution: '',
    condition_notes: '',
  });

  const updateField = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }));

  const roleConfig = ROLES.find(r => r.id === selectedRole);
  const steps = roleConfig?.steps || [];
  const totalSteps = steps.length + 1;

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setCurrentStep(1);
  };

  const handleNext = () => currentStep < totalSteps - 1 && setCurrentStep(p => p + 1);
  const handleBack = () => {
    if (currentStep === 1) {
      setSelectedRole(null);
      setCurrentStep(0);
    } else if (currentStep > 1) {
      setCurrentStep(p => p - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const kycData: any = {
        requested_role: selectedRole,
        sub_role: form.vehicle_type || form.store_category || null,
        personal_data: {
          cedula_number: form.cedula_number,
          cedula_front_url: 'pending',
          selfie_url: 'pending',
          address: form.address,
        },
      };

      if (steps.includes('license')) {
        kycData.driver_license = {
          license_number: form.license_number,
          license_grade: form.license_grade,
          license_url: 'pending',
        };
      }
      if (steps.includes('vehicle')) {
        kycData.vehicle_light = {
          plate_number: form.plate_number,
          brand: form.brand,
          model: form.model,
          year: parseInt(form.year) || 2020,
          color: form.color,
          vehicle_type: form.vehicle_type,
          circulation_card_url: 'pending',
          rcv_url: 'pending',
          vehicle_photo_front_url: 'pending',
        };
      }
      if (steps.includes('store')) {
        kycData.store_data = {
          store_name: form.store_name,
          store_category: form.store_category,
          rif_type: form.rif_type,
          rif_number: form.rif_number,
          rif_url: 'pending',
          store_address: form.store_address,
          store_photo_exterior_url: 'pending',
        };
      }
      if (steps.includes('medical_license')) {
        kycData.medical_license_data = {
          mpps_number: form.mpps_number,
          specialty: form.specialty,
          institution: form.institution,
          titulo_url: 'pending',
          mpps_url: 'pending',
        };
      }
      if (steps.includes('rent')) {
        kycData.rent_owner_data = {
          vehicle_plate: form.plate_number,
          vehicle_brand: form.brand,
          vehicle_model: form.model,
          vehicle_year: parseInt(form.year) || 2020,
          vehicle_color: form.color,
          title_property_url: 'pending',
          rcv_url: 'pending',
          condition_notes: form.condition_notes,
        };
      }
      if (steps.includes('identity')) {
        kycData.personal_data = {
          cedula_number: form.cedula_number,
          cedula_front_url: 'pending',
          selfie_url: 'pending',
        };
      }

      await api.post('/kyc/submit', kycData);
      Alert.alert('Solicitud Enviada', 'Tu solicitud KYC ha sido enviada. Sera revisada por un administrador.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Error al enviar solicitud');
    } finally {
      setLoading(false);
    }
  };

  const isLastStep = currentStep === totalSteps - 1;

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>En que quieres convertirte?</Text>
          <Text style={styles.stepDesc}>Selecciona el rol para verificar tu cuenta</Text>
          {ROLES.map(role => (
            <TouchableOpacity key={role.id} style={[styles.roleCard, selectedRole === role.id && { borderColor: role.color }]} onPress={() => handleRoleSelect(role.id)}>
              <View style={[styles.roleIcon, { backgroundColor: role.color + '20' }]}>
                <Ionicons name={role.icon as any} size={24} color={role.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.roleLabel}>{role.label}</Text>
                <Text style={styles.roleDesc}>{role.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    const stepName = steps[currentStep - 1];

    if (stepName === 'identity') {
      return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Verificacion de Identidad</Text>
          <Text style={styles.stepDesc}>Para tu seguridad necesitamos verificar tu identidad</Text>
          <FormField label="Numero de Cedula *" placeholder="V-12345678" value={form.cedula_number} onChange={v => updateField('cedula_number', v)} />
          <InfoBox text="Las fotos de cedula y selfie se solicitaran despues de la aprobacion inicial" />
        </View>
      );
    }

    if (stepName === 'personal') {
      return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Datos Personales</Text>
          <FormField label="Numero de Cedula *" placeholder="V-12345678" value={form.cedula_number} onChange={v => updateField('cedula_number', v)} />
          <FormField label="Direccion" placeholder="Av. Las Americas, Merida" value={form.address} onChange={v => updateField('address', v)} />
          <InfoBox text="Las fotos de cedula y selfie se solicitaran despues de la aprobacion inicial" />
        </View>
      );
    }

    if (stepName === 'license') {
      return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Licencia de Conducir</Text>
          <Text style={styles.fieldLabel}>Grado de Licencia *</Text>
          <View style={styles.chipRow}>
            {['2da', '3ra', '5ta'].map(g => (
              <TouchableOpacity key={g} style={[styles.chip, form.license_grade === g && styles.chipActive]} onPress={() => updateField('license_grade', g)}>
                <Text style={[styles.chipText, form.license_grade === g && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FormField label="Numero de Licencia *" placeholder="12345678" value={form.license_number} onChange={v => updateField('license_number', v)} />
        </View>
      );
    }

    if (stepName === 'vehicle') {
      const subtypes = selectedRole === 'socio_conductor' ? VEHICLE_TYPES_CONDUCTOR : VEHICLE_TYPES_REPARTIDOR;
      return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Datos del Vehiculo</Text>
          <Text style={styles.fieldLabel}>Tipo de Vehiculo *</Text>
          <View style={styles.chipRow}>
            {subtypes.map(t => (
              <TouchableOpacity key={t.id} style={[styles.chip, form.vehicle_type === t.id && styles.chipActive]} onPress={() => updateField('vehicle_type', t.id)}>
                <Text style={[styles.chipText, form.vehicle_type === t.id && styles.chipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.formRow}>
            <FormField label="Placa *" placeholder="ABC-123" value={form.plate_number} onChange={v => updateField('plate_number', v)} style={{ flex: 1 }} />
            <FormField label="Ano *" placeholder="2020" value={form.year} onChange={v => updateField('year', v)} keyboard="numeric" style={{ flex: 1 }} />
          </View>
          <View style={styles.formRow}>
            <FormField label="Marca *" placeholder="Toyota" value={form.brand} onChange={v => updateField('brand', v)} style={{ flex: 1 }} />
            <FormField label="Modelo *" placeholder="Corolla" value={form.model} onChange={v => updateField('model', v)} style={{ flex: 1 }} />
          </View>
          <FormField label="Color *" placeholder="Blanco" value={form.color} onChange={v => updateField('color', v)} />
        </View>
      );
    }

    if (stepName === 'store') {
      return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Datos del Comercio</Text>
          <FormField label="Nombre del Comercio *" placeholder="Arepas La Abuela" value={form.store_name} onChange={v => updateField('store_name', v)} />
          <Text style={styles.fieldLabel}>Categoria *</Text>
          <View style={styles.chipGrid}>
            {STORE_CATS.map(c => (
              <TouchableOpacity key={c.id} style={[styles.chip, { minWidth: '30%' }, form.store_category === c.id && { borderColor: '#EC4899', backgroundColor: '#EC489920' }]} onPress={() => updateField('store_category', c.id)}>
                <Text style={[styles.chipText, form.store_category === c.id && { color: '#EC4899' }]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.formRow}>
            <View style={{ width: 80 }}>
              <Text style={styles.fieldLabel}>RIF *</Text>
              <View style={styles.chipRow}>
                {['J', 'V'].map(t => (
                  <TouchableOpacity key={t} style={[styles.chip, form.rif_type === t && styles.chipActive]} onPress={() => updateField('rif_type', t)}>
                    <Text style={[styles.chipText, form.rif_type === t && styles.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <FormField label="Numero RIF *" placeholder="12345678-9" value={form.rif_number} onChange={v => updateField('rif_number', v)} style={{ flex: 1 }} />
          </View>
          <FormField label="Direccion del Local *" placeholder="C.C. Alto Prado, Local 23" value={form.store_address} onChange={v => updateField('store_address', v)} />
        </View>
      );
    }

    if (stepName === 'medical_license') {
      return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Credenciales Medicas</Text>
          <FormField label="Numero MPPS *" placeholder="MPPS-12345" value={form.mpps_number} onChange={v => updateField('mpps_number', v)} />
          <FormField label="Especialidad *" placeholder="Medicina General, Pediatria..." value={form.specialty} onChange={v => updateField('specialty', v)} />
          <FormField label="Institucion" placeholder="Hospital, clinica..." value={form.institution} onChange={v => updateField('institution', v)} />
        </View>
      );
    }

    if (stepName === 'rent') {
      return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Vehiculo para Alquiler</Text>
          <View style={styles.formRow}>
            <FormField label="Placa *" placeholder="ABC-123" value={form.plate_number} onChange={v => updateField('plate_number', v)} style={{ flex: 1 }} />
            <FormField label="Ano *" placeholder="2020" value={form.year} onChange={v => updateField('year', v)} keyboard="numeric" style={{ flex: 1 }} />
          </View>
          <View style={styles.formRow}>
            <FormField label="Marca *" placeholder="Chevrolet" value={form.brand} onChange={v => updateField('brand', v)} style={{ flex: 1 }} />
            <FormField label="Modelo *" placeholder="Aveo" value={form.model} onChange={v => updateField('model', v)} style={{ flex: 1 }} />
          </View>
          <FormField label="Color *" placeholder="Gris Plata" value={form.color} onChange={v => updateField('color', v)} />
          <FormField label="Notas sobre el estado" placeholder="A/C funcional, recien pintado..." value={form.condition_notes} onChange={v => updateField('condition_notes', v)} multiline />
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>VERIFICACION KYC</Text>
          {roleConfig && <Text style={[styles.headerSub, { color: roleConfig.color }]}>{roleConfig.label}</Text>}
        </View>
        <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
      </View>

      {/* Progress */}
      {selectedRole && (
        <View style={styles.progressRow}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View key={i} style={[styles.progressBar, { backgroundColor: i <= currentStep ? COLORS.primary : COLORS.border }]} />
          ))}
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Actions */}
      {selectedRole && (
        <View style={styles.footer}>
          {isLastStep ? (
            <Button title={loading ? 'Enviando...' : 'ENVIAR SOLICITUD'} onPress={handleSubmit} loading={loading} style={{ flex: 1 }} />
          ) : (
            <Button title="SIGUIENTE" onPress={handleNext} style={{ flex: 1 }} />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function FormField({
  label,
  placeholder,
  value,
  onChange,
  keyboard,
  multiline,
  style,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  keyboard?: any;
  multiline?: boolean;
  style?: any;
}) {
  return (
    <View style={style}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        keyboardType={keyboard || 'default'}
        multiline={multiline}
      />
    </View>
  );
}

function InfoBox({ text }: { text: string }) {
  return (
    <View style={styles.infoBox}>
      <Ionicons name="information-circle" size={18} color="#F59E0B" />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: 'bold', color: COLORS.text, letterSpacing: 1 },
  headerSub: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  progressRow: { flexDirection: 'row', gap: 4, paddingHorizontal: SPACING.md, marginBottom: SPACING.md },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  stepContent: { gap: SPACING.md },
  stepTitle: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  stepDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  roleCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, borderWidth: 1.5, borderColor: COLORS.border },
  roleIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  roleLabel: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text },
  roleDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  fieldLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: 4 },
  input: { backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, fontSize: FONT_SIZE.md, color: COLORS.text, minHeight: 48 },
  formRow: { flexDirection: 'row', gap: SPACING.sm },
  chipRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  chipGrid: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '20' },
  chipText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.primary, fontWeight: '600' },
  infoBox: { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, backgroundColor: '#F59E0B10', borderWidth: 1, borderColor: '#F59E0B30' },
  infoText: { flex: 1, fontSize: FONT_SIZE.xs, color: '#F59E0B99' },
  footer: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.background },
});
