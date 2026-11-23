import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';

interface MaintenanceViewProps {
  moduleName?: string;
  title?: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  inline?: boolean;
  showButton?: boolean;
  showBackButton?: boolean;
  buttonText?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function MaintenanceView({
  moduleName = 'Este Módulo',
  title,
  description,
  icon = 'construct-outline',
  inline = false,
  showButton = true,
  showBackButton,
  buttonText,
  actionLabel,
  onAction,
}: MaintenanceViewProps) {
  const router = useRouter();

  // Compatibilidad con props alias
  const displayButton = showBackButton !== undefined ? showBackButton : showButton;
  const effectiveButtonText = actionLabel || buttonText || 'Ir a Pedir Transporte';

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      router.replace('/(main)/home');
    }
  };

  const content = (
    <View style={[styles.card, inline ? styles.cardInline : styles.cardFull]}>
      {/* Icon Badge */}
      <View style={styles.iconWrapper}>
        <View style={styles.iconGlow} />
        <Ionicons name={icon} size={44} color={COLORS.warning} />
      </View>

      {/* Status Badge */}
      <View style={styles.badge}>
        <View style={styles.pulseDot} />
        <Text style={styles.badgeText}>EN MANTENIMIENTO</Text>
      </View>

      {/* Headings */}
      <Text style={styles.title}>{title || moduleName}</Text>
      <Text style={styles.subtitle}>Próximamente disponible</Text>

      {/* Description */}
      <Text style={styles.description}>
        {description ||
          `Estamos concentrando el 100% de la infraestructura y flota en el servicio de Transporte Urbano (Xuve Ride). ${moduleName} se activará en la próxima fase.`}
      </Text>

      {/* Action Button */}
      {displayButton && (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleAction}
          activeOpacity={0.8}
        >
          <Ionicons name="car-outline" size={20} color={COLORS.textOnPrimary} />
          <Text style={styles.actionBtnText}>{effectiveButtonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (inline) {
    return <View style={styles.inlineContainer}>{content}</View>;
  }

  return (
    <SafeAreaView style={styles.fullContainer} edges={['top', 'bottom']}>
      {/* Header with back button */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace('/(main)/home')}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>XUVE</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.centeredWrapper}>{content}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inlineContainer: {
    padding: SPACING.md,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  centeredWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    padding: SPACING.xl,
  },
  cardFull: {
    width: '100%',
    maxWidth: 420,
    shadowColor: COLORS.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  cardInline: {
    width: '100%',
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    marginBottom: SPACING.sm,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.warning,
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.warning,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    width: '100%',
    ...SHADOWS.neon,
  },
  actionBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.textOnPrimary,
    letterSpacing: 0.5,
  },
});

