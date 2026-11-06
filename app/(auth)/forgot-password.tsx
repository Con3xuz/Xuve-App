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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { Button, Input } from '../../src/components/ui';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../src/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword } = useAuthStore();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('El correo es requerido');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Correo inválido');
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      // Respuesta uniforme del backend: no revela si el email existe.
      setSent(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo enviar el correo');
    } finally {
      setLoading(false);
    }
  };

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
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={sent ? 'mail-open-outline' : 'lock-closed-outline'}
                size={36}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.title}>
              {sent ? 'REVISA TU CORREO' : 'RECUPERAR CONTRASEÑA'}
            </Text>
            <Text style={styles.subtitle}>
              {sent
                ? `Si existe una cuenta asociada a ${email.trim().toLowerCase()}, te enviamos un enlace para restablecer tu contraseña. Revisa también la carpeta de spam.`
                : 'Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.'}
            </Text>
          </View>

          {/* Form / Confirmación */}
          {!sent ? (
            <View style={styles.formContainer}>
              <Input
                label="Email"
                placeholder="tu@email.com"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (error) setError(undefined);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                icon="mail-outline"
                error={error}
              />
              <Button
                title="ENVIAR ENLACE"
                onPress={handleSubmit}
                loading={loading}
                style={styles.submitButton}
              />
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Button
                title="VOLVER A INICIAR SESIÓN"
                onPress={() => router.replace('/(auth)/login')}
              />
              <TouchableOpacity
                style={styles.resendButton}
                onPress={() => setSent(false)}
              >
                <Text style={styles.resendText}>Reenviar a otro correo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer */}
          {!sent && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Recordaste tu contraseña?</Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.linkText}>Inicia sesión</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: SPACING.lg,
    left: SPACING.lg,
    padding: SPACING.xs,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '15',
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.sm,
  },
  formContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
    marginBottom: SPACING.xl,
  },
  submitButton: {
    marginTop: SPACING.sm,
  },
  resendButton: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  resendText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  footerText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  linkText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
