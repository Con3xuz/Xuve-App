import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { Button, Input } from '../../src/components/ui';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, OMNI_LOGO_URL } from '../../src/constants/theme';

const ROLES = [
  { id: 'user', label: 'Cliente', icon: 'person', desc: 'Solicita servicios' },
  { id: 'socio_conductor', label: 'Conductor', icon: 'car', desc: 'Conduce y gana' },
  { id: 'socio_repartidor', label: 'Repartidor', icon: 'bicycle', desc: 'Entrega pedidos' },
  { id: 'socio_comercial', label: 'Comercio', icon: 'storefront', desc: 'Vende productos' },
  { id: 'medico', label: 'Médico', icon: 'medical', desc: 'Recetas digitales' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();

  const [step, setStep] = useState(1); // 1: social/role, 2: form
  const [selectedRole, setSelectedRole] = useState('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleGoogleSignIn = () => {
    Alert.alert(
      'Google Sign-In',
      'Se requiere configurar el Google Client ID para activar esta función.\n\nContacta al administrador para obtener las credenciales OAuth.',
      [{ text: 'Entendido' }]
    );
  };

  const handleAppleSignIn = () => {
    Alert.alert(
      'Apple Sign-In',
      'Se requiere configurar el Apple Developer ID para activar esta función.\n\nDisponible solo en dispositivos iOS.',
      [{ text: 'Entendido' }]
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'El nombre es requerido';
    if (!email.trim()) {
      newErrors.email = 'El correo es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Correo inválido';
    }
    if (!phone.trim()) newErrors.phone = 'El teléfono es requerido';
    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 8) {
      newErrors.password = 'Mínimo 6 caracteres';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role: selectedRole,
      });
      const { user } = useAuthStore.getState();
      if (user?.kyc_status === 'pending') {
        router.replace('/(main)/kyc');
      } else {
        router.replace('/(main)/home');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo registrar');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      {/* Social Sign-In */}
      <View style={styles.socialSection}>
        <Text style={styles.sectionTitle}>Registro rápido</Text>

        {/* Google Button */}
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
          <View style={styles.socialIconWrapper}>
            <Text style={styles.googleG}>G</Text>
          </View>
          <Text style={styles.socialButtonText}>Continuar con Google</Text>
        </TouchableOpacity>

        {/* Apple Button */}
        <TouchableOpacity style={styles.appleButton} onPress={handleAppleSignIn}>
          <Ionicons name="logo-apple" size={22} color="#fff" />
          <Text style={styles.appleButtonText}>Continuar con Apple</Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>o regístrate con email</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Role Selection */}
      <Text style={styles.sectionTitle}>¿Cómo usarás OMNI?</Text>
      <View style={styles.rolesGrid}>
        {ROLES.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={[
              styles.roleCard,
              selectedRole === role.id && styles.roleCardActive,
            ]}
            onPress={() => setSelectedRole(role.id)}
          >
            <Ionicons
              name={role.icon as any}
              size={24}
              color={selectedRole === role.id ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={[styles.roleLabel, selectedRole === role.id && styles.roleLabelActive]}>
              {role.label}
            </Text>
            <Text style={styles.roleDesc}>{role.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="CONTINUAR"
        onPress={() => setStep(2)}
        style={styles.continueButton}
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      {/* Back to step 1 */}
      <TouchableOpacity style={styles.backToStep} onPress={() => setStep(1)}>
        <Ionicons name="arrow-back" size={20} color={COLORS.textSecondary} />
        <Text style={styles.backText}>Cambiar rol</Text>
      </TouchableOpacity>

      {/* Selected role badge */}
      <View style={styles.selectedRoleBadge}>
        <Ionicons
          name={ROLES.find(r => r.id === selectedRole)?.icon as any}
          size={16}
          color={COLORS.primary}
        />
        <Text style={styles.selectedRoleText}>
          {ROLES.find(r => r.id === selectedRole)?.label}
        </Text>
      </View>

      <View style={styles.formContainer}>
        <Input
          label="Nombre completo"
          placeholder="Juan Pérez"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          icon="person-outline"
          error={errors.name}
        />
        <Input
          label="Correo electrónico"
          placeholder="tu@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          icon="mail-outline"
          error={errors.email}
        />
        <Input
          label="Teléfono"
          placeholder="+58 412 123 4567"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          icon="call-outline"
          error={errors.phone}
        />
        <Input
          label="Contraseña"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          icon="lock-closed-outline"
          error={errors.password}
        />
        <Input
          label="Confirmar contraseña"
          placeholder="Repite la contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          icon="lock-closed-outline"
          error={errors.confirmPassword}
        />
        <Button
          title="CREAR CUENTA"
          onPress={handleRegister}
          loading={loading}
          style={styles.registerButton}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>CREAR CUENTA</Text>
            <Text style={styles.subtitle}>
              {step === 1 ? 'Elige cómo quieres registrarte' : 'Completa tu información'}
            </Text>
            {/* Step indicator */}
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, styles.stepDotActive]} />
              <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
              <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
            </View>
          </View>

          {step === 1 ? renderStep1() : renderStep2()}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.linkText}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: SPACING.lg },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md, height: 44 },
  backButtonText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  header: { marginBottom: SPACING.lg },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.text, letterSpacing: 2 },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginTop: SPACING.xs },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md, gap: 0 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.border },
  stepDotActive: { backgroundColor: COLORS.primary },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.border, maxWidth: 80 },
  stepLineActive: { backgroundColor: COLORS.primary },
  stepContainer: {},

  // Social
  socialSection: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.md, letterSpacing: 0.5 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
    minHeight: 52,
  },
  socialIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleG: { fontSize: 18, fontWeight: 'bold', color: '#4285F4' },
  socialButtonText: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: '#333' },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    backgroundColor: '#000',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 52,
  },
  appleButtonText: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: '#fff' },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { paddingHorizontal: SPACING.md, fontSize: FONT_SIZE.sm, color: COLORS.textLight },

  // Roles
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  roleCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  roleCardActive: { borderColor: COLORS.primary, borderWidth: 2, backgroundColor: COLORS.primary + '10' },
  roleLabel: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text },
  roleLabelActive: { color: COLORS.primary },
  roleDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, textAlign: 'center' },
  continueButton: { marginTop: SPACING.sm },

  // Step 2
  backToStep: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  backText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  selectedRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    marginBottom: SPACING.md,
  },
  selectedRoleText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.primary },
  formContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
    marginBottom: SPACING.lg,
  },
  registerButton: { marginTop: SPACING.sm },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.xs, paddingBottom: SPACING.xl },
  footerText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  linkText: { fontSize: FONT_SIZE.md, color: COLORS.primary, fontWeight: '600' },
});
