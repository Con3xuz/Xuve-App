import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle = [styles.button, styles[`button_${size}` as keyof typeof styles] as ViewStyle];

    switch (variant) {
      case 'secondary':
        return [...baseStyle, styles.buttonSecondary, isDisabled && styles.buttonDisabled];
      case 'outline':
        return [...baseStyle, styles.buttonOutline, isDisabled && styles.buttonOutlineDisabled];
      case 'ghost':
        return [...baseStyle, styles.buttonGhost];
      case 'danger':
        return [...baseStyle, styles.buttonDanger, isDisabled && styles.buttonDisabled];
      default:
        return [...baseStyle, styles.buttonPrimary, isDisabled && styles.buttonDisabled];
    }
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyle = [styles.text, styles[`text_${size}` as keyof typeof styles] as TextStyle];

    switch (variant) {
      case 'outline':
        return [...baseStyle, styles.textOutline, isDisabled && styles.textDisabledOutline];
      case 'ghost':
        return [...baseStyle, styles.textGhost];
      case 'danger':
        return [...baseStyle, styles.textDanger];
      default:
        return [...baseStyle, styles.textPrimary];
    }
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.primary : COLORS.textOnPrimary} />
      ) : (
        <>
          {icon}
          <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  button_sm: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minHeight: 36,
  },
  button_md: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    minHeight: 48,
  },
  button_lg: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    minHeight: 56,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: COLORS.secondary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDanger: {
    backgroundColor: COLORS.accent,
  },
  buttonDisabled: {
    backgroundColor: COLORS.border,
    opacity: 0.5,
  },
  buttonOutlineDisabled: {
    borderColor: COLORS.border,
    opacity: 0.5,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  text_sm: {
    fontSize: FONT_SIZE.sm,
  },
  text_md: {
    fontSize: FONT_SIZE.md,
  },
  text_lg: {
    fontSize: FONT_SIZE.lg,
  },
  textPrimary: {
    color: COLORS.textOnPrimary,
  },
  textOutline: {
    color: COLORS.primary,
  },
  textGhost: {
    color: COLORS.text,
  },
  textDanger: {
    color: '#fff',
  },
  textDisabledOutline: {
    color: COLORS.textLight,
  },
});
