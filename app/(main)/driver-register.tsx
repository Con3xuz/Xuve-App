import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { Button } from '../../src/components/ui';
import api from '../../src/api';

const VEHICLE_TYPES = [
  { id: 'moto', label: 'Moto', icon: 'bicycle', toll: '$0.50' },
  { id: 'taxi', label: 'Taxi', icon: 'car', toll: '$1.00' },
  { id: 'bus', label: 'Bus', icon: 'bus', toll: '$1.00' },
  { id: 'encava', label: 'Encava', icon: 'bus', toll: '$1.00' },
  { id: 'flete', label: 'Flete', icon: 'cube', toll: '$1.00' },
  { id: 'cisterna', label: 'Cisterna', icon: 'water', toll: '$1.00' },
];

const REQUIRED_DOCS = [
  { id: 'vehiclePhotoFront', label: 'Foto Frontal', icon: 'camera' },
  { id: 'vehiclePhotoBack', label: 'Foto Trasera', icon: 'camera' },
  { id: 'vehiclePhotoLeft', label: 'Foto Lateral Izq', icon: 'camera' },
  { id: 'vehiclePhotoRight', label: 'Foto Lateral Der', icon: 'camera' },
  { id: 'circulationCard', label: 'Carnet de CirculaciÃ³n', icon: 'document-text' },
  { id: 'insurancePolicy', label: 'PÃ³liza de Seguro', icon: 'shield-checkmark' },
  { id: 'driverLicense', label: 'Licencia de Conducir', icon: 'card' },
  { id: 'driverPhoto', label: 'Foto del Conductor', icon: 'person' },
];

export default function DriverRegisterScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [personalData, setPersonalData] = useState({
    fullName: user?.name || '', cedula: '', phone: user?.phone || '',
    email: user?.email || '', address: '', birthDate: '',
  });

  const [vehicleData, setVehicleData] = useState({
    vehicleType: 'taxi', isOwner: true, plateNumber: '',
    vehicleBrand: '', vehicleModel: '', vehicleColor: '', vehicleYear: '',
    ownerCedula: '', ownerName: '', ownerPhone: '',
  });

  const [documents, setDocuments] = useState<Record<string, string | null>>({});

  const isStep1Valid = personalData.fullName && personalData.cedula && personalData.phone && personalData.address;
  const isStep2Valid = vehicleData.plateNumber && vehicleData.vehicleBrand && vehicleData.vehicleModel;

  const simulateUpload = (docId: string) => {
    setDocuments(prev => ({ ...prev, [docId]: `uploaded_${docId}_${Date.now()}` }));
    Alert.alert('Documento cargado', 'Documento subido correctamente');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/socio/register', {
        personal: personalData,
        vehicle: vehicleData,
        documents,
      });
      Alert.alert('Â¡Solicitud Enviada!', 'Tu registro como socio estÃ¡ en revisiÃ³n. Te notificaremos cuando sea aprobado.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  const uploadedCount = Object.values(documents).filter(Boolean).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>REGISTRO DE SOCIO</Text>
          <Text style={styles.headerSub}>Paso {step} de 3</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        {[1, 2, 3].map(s => (
          <View key={s} style={[styles.progressStep, s <= step && styles.progressStepActive]} />
        ))}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step 1: Datos Personales */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Datos Personales</Text>
            <Text style={styles.stepDesc}>InformaciÃ³n bÃ¡sica del conductor</Text>

            <Text style={styles.formLabel}>Nombre completo *</Text>
            <TextInput style={styles.formInput} value={personalData.fullName} onChangeText={t => setPersonalData(p => ({ ...p, fullName: t }))} placeholder="Juan PÃ©rez" placeholderTextColor={COLORS.textLight} />

            <Text style={styles.formLabel}>CÃ©dula *</Text>
            <TextInput style={styles.formInput} value={personalData.cedula} onChangeText={t => setPersonalData(p => ({ ...p, cedula: t }))} placeholder="V-12345678" placeholderTextColor={COLORS.textLight} />

            <Text style={styles.formLabel}>TelÃ©fono *</Text>
            <TextInput style={styles.formInput} value={personalData.phone} onChangeText={t => setPersonalData(p => ({ ...p, phone: t }))} placeholder="0412-555-1234" keyboardType="phone-pad" placeholderTextColor={COLORS.textLight} />

            <Text style={styles.formLabel}>DirecciÃ³n *</Text>
            <TextInput style={styles.formInput} value={personalData.address} onChangeText={t => setPersonalData(p => ({ ...p, address: t }))} placeholder="Av. Las AmÃ©ricas..." placeholderTextColor={COLORS.textLight} />

            <Text style={styles.formLabel}>Fecha de nacimiento</Text>
            <TextInput style={styles.formInput} value={personalData.birthDate} onChangeText={t => setPersonalData(p => ({ ...p, birthDate: t }))} placeholder="DD/MM/AAAA" placeholderTextColor={COLORS.textLight} />

            <Button title="SIGUIENTE" onPress={() => setStep(2)} disabled={!isStep1Valid} style={styles.nextBtn} />
          </View>
        )}

        {/* Step 2: Datos del VehÃ­culo */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Datos del VehÃ­culo</Text>
            <Text style={styles.stepDesc}>InformaciÃ³n de tu vehÃ­culo</Text>

            <Text style={styles.formLabel}>Tipo de vehÃ­culo</Text>
            <View style={styles.vehicleGrid}>
              {VEHICLE_TYPES.map(v => (
                <TouchableOpacity key={v.id} style={[styles.vehicleCard, vehicleData.vehicleType === v.id && styles.vehicleCardActive]}
                  onPress={() => setVehicleData(p => ({ ...p, vehicleType: v.id }))}>
                  <Ionicons name={v.icon as any} size={24} color={vehicleData.vehicleType === v.id ? COLORS.primary : COLORS.textSecondary} />
                  <Text style={[styles.vehicleLabel, vehicleData.vehicleType === v.id && { color: COLORS.primary }]}>{v.label}</Text>
                  <Text style={styles.vehicleToll}>{v.toll}/dÃ­a</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.ownerToggle}>
              <Text style={styles.formLabel}>Â¿Eres el dueÃ±o del vehÃ­culo?</Text>
              <Switch value={vehicleData.isOwner} onValueChange={v => setVehicleData(p => ({ ...p, isOwner: v }))}
                trackColor={{ false: COLORS.border, true: COLORS.primary + '40' }} thumbColor={vehicleData.isOwner ? COLORS.primary : COLORS.textLight} />
            </View>

            <Text style={styles.formLabel}>Placa *</Text>
            <TextInput style={[styles.formInput, styles.plateInput]} value={vehicleData.plateNumber}
              onChangeText={t => setVehicleData(p => ({ ...p, plateNumber: t.toUpperCase() }))} placeholder="ABC-123" autoCapitalize="characters" placeholderTextColor={COLORS.textLight} />

            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Marca *</Text>
                <TextInput style={styles.formInput} value={vehicleData.vehicleBrand} onChangeText={t => setVehicleData(p => ({ ...p, vehicleBrand: t }))} placeholder="Toyota" placeholderTextColor={COLORS.textLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Modelo *</Text>
                <TextInput style={styles.formInput} value={vehicleData.vehicleModel} onChangeText={t => setVehicleData(p => ({ ...p, vehicleModel: t }))} placeholder="Corolla" placeholderTextColor={COLORS.textLight} />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Color</Text>
                <TextInput style={styles.formInput} value={vehicleData.vehicleColor} onChangeText={t => setVehicleData(p => ({ ...p, vehicleColor: t }))} placeholder="Blanco" placeholderTextColor={COLORS.textLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>AÃ±o</Text>
                <TextInput style={styles.formInput} value={vehicleData.vehicleYear} onChangeText={t => setVehicleData(p => ({ ...p, vehicleYear: t }))} placeholder="2020" keyboardType="numeric" placeholderTextColor={COLORS.textLight} />
              </View>
            </View>

            {!vehicleData.isOwner && (
              <View style={styles.avanceSection}>
                <Text style={styles.avanceTitle}>Datos del DueÃ±o (Avance)</Text>
                <Text style={styles.formLabel}>CÃ©dula del dueÃ±o</Text>
                <TextInput style={styles.formInput} value={vehicleData.ownerCedula} onChangeText={t => setVehicleData(p => ({ ...p, ownerCedula: t }))} placeholder="V-12345678" placeholderTextColor={COLORS.textLight} />
                <Text style={styles.formLabel}>Nombre del dueÃ±o</Text>
                <TextInput style={styles.formInput} value={vehicleData.ownerName} onChangeText={t => setVehicleData(p => ({ ...p, ownerName: t }))} placeholder="Nombre completo" placeholderTextColor={COLORS.textLight} />
                <Text style={styles.formLabel}>TelÃ©fono del dueÃ±o</Text>
                <TextInput style={styles.formInput} value={vehicleData.ownerPhone} onChangeText={t => setVehicleData(p => ({ ...p, ownerPhone: t }))} placeholder="0412..." keyboardType="phone-pad" placeholderTextColor={COLORS.textLight} />
              </View>
            )}

            <Button title="SIGUIENTE" onPress={() => setStep(3)} disabled={!isStep2Valid} style={styles.nextBtn} />
          </View>
        )}

        {/* Step 3: Documentos */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>DocumentaciÃ³n</Text>
            <Text style={styles.stepDesc}>{uploadedCount}/{REQUIRED_DOCS.length} documentos subidos</Text>

            {/* Progress */}
            <View style={styles.docProgress}>
              <View style={[styles.docProgressBar, { width: `${(uploadedCount / REQUIRED_DOCS.length) * 100}%` }]} />
            </View>

            {REQUIRED_DOCS.map(doc => (
              <TouchableOpacity key={doc.id} style={[styles.docItem, documents[doc.id] && styles.docItemDone]} onPress={() => simulateUpload(doc.id)}>
                <View style={[styles.docIcon, documents[doc.id] ? { backgroundColor: COLORS.primary + '20' } : { backgroundColor: COLORS.surfaceHighlight }]}>
                  <Ionicons name={documents[doc.id] ? 'checkmark-circle' : doc.icon as any} size={22} color={documents[doc.id] ? COLORS.primary : COLORS.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docLabel}>{doc.label}</Text>
                  <Text style={styles.docStatus}>{documents[doc.id] ? 'Cargado' : 'Pendiente'}</Text>
                </View>
                <Ionicons name={documents[doc.id] ? 'checkmark' : 'cloud-upload'} size={20} color={documents[doc.id] ? COLORS.primary : COLORS.textLight} />
              </TouchableOpacity>
            ))}

            <Button title="ENVIAR SOLICITUD" onPress={handleSubmit} loading={loading} style={styles.submitBtn} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: 'bold', color: COLORS.text, letterSpacing: 1 },
  headerSub: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  progressBar: { flexDirection: 'row', gap: SPACING.xs, padding: SPACING.md, paddingTop: SPACING.sm },
  progressStep: { flex: 1, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  progressStepActive: { backgroundColor: COLORS.primary },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  stepTitle: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.xs },
  stepDesc: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  formLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs, marginTop: SPACING.md },
  formInput: { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, fontSize: FONT_SIZE.md, color: COLORS.text, minHeight: 48 },
  plateInput: { textAlign: 'center', fontSize: FONT_SIZE.xl, fontWeight: 'bold', letterSpacing: 3 },
  formRow: { flexDirection: 'row', gap: SPACING.sm },
  nextBtn: { marginTop: SPACING.xl },
  submitBtn: { marginTop: SPACING.xl },
  vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  vehicleCard: { width: '30%', flexGrow: 1, flexBasis: '30%', padding: SPACING.md, borderRadius: BORDER_RADIUS.xl, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', gap: SPACING.xs },
  vehicleCardActive: { borderColor: COLORS.primary, borderWidth: 2, backgroundColor: COLORS.primary + '10' },
  vehicleLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  vehicleToll: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
  ownerToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md },
  avanceSection: { marginTop: SPACING.md, padding: SPACING.md, borderRadius: BORDER_RADIUS.xl, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: '#F59E0B30' },
  avanceTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: '#F59E0B' },
  docProgress: { height: 6, backgroundColor: COLORS.surface, borderRadius: 3, marginBottom: SPACING.md, overflow: 'hidden' },
  docProgressBar: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  docItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  docItemDone: { borderColor: COLORS.primary + '30' },
  docIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  docLabel: { fontSize: FONT_SIZE.md, color: COLORS.text },
  docStatus: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginTop: 2 },
});
