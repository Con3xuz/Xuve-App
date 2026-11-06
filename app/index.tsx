import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { COLORS, SPACING, FONT_SIZE, XUVE_LOGO_URL } from '../src/constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Scale in
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (isAuthenticated && user) {
          router.replace('/(main)/home');
        } else {
          router.replace('/(auth)/login');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, user]);

  return (
    <View style={styles.container}>
      {/* Background glow effect */}
      <Animated.View style={[styles.glowCircle, { opacity: pulseAnim }]} />

      <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
        {/* Logo with neon border */}
        <View style={styles.logoWrapper}>
          <View style={styles.logoGlow} />
          <View style={styles.logoBorder}>
            <Image
              source={{ uri: XUVE_LOGO_URL }}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
        </View>

        <Text style={styles.title}>XUVE</Text>
        <Text style={styles.subtitle}>SuperApp</Text>
        <Text style={styles.tagline}>Movilidad & Comercio para Venezuela</Text>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  glowCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primary,
    opacity: 0.15,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: SPACING.lg,
  },
  logoGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 80,
    backgroundColor: COLORS.primary,
    opacity: 0.15,
  },
  logoBorder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.primary + '60',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    fontWeight: '600',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    letterSpacing: 1,
  },
  footer: {
    position: 'absolute',
    bottom: SPACING.xxl * 2,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
});
