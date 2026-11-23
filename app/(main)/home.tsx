import React, { Suspense, useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import ClienteDashboard from '../../src/screens/ClienteDashboard';
import MaintenanceView from '../../src/components/MaintenanceView';

// --- Lazy imports: solo para roles especializados de socios/proveedores ---
const ConductorDashboard  = React.lazy(() => import('../../src/screens/ConductorDashboard'));
const RepartidorDashboard = React.lazy(() => import('../../src/screens/RepartidorDashboard'));
const MedicoDashboard     = React.lazy(() => import('../../src/screens/MedicoDashboard'));
const ComercialDashboard  = React.lazy(() => import('../../src/screens/ComercialDashboard'));
const RentOwnerDashboard  = React.lazy(() => import('../../src/screens/RentOwnerDashboard'));

// --- Skeleton animado on-brand (cyberpunk dark) ---
function DashboardSkeleton() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.75, duration: 850, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3,  duration: 850, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <View style={sk.container}>
      {/* Header: avatar + nombre/balance + 2 iconos */}
      <Animated.View style={[sk.header, { opacity }]}>
        <View style={sk.avatar} />
        <View style={sk.headerInfo}>
          <View style={sk.nameLine} />
          <View style={sk.balanceLine} />
        </View>
        <View style={sk.iconBtn} />
        <View style={sk.iconBtn} />
      </Animated.View>

      {/* Service tabs */}
      <Animated.View style={[sk.tabRow, { opacity }]}>
        {[68, 52, 72, 56, 60, 48].map((w, i) => (
          <View key={i} style={[sk.tab, { width: w }]} />
        ))}
      </Animated.View>

      {/* Bloque de mapa */}
      <Animated.View style={[sk.mapBlock, { opacity }]} />

      {/* 3 cards de contenido */}
      <Animated.View style={[sk.card, { opacity }]} />
      <Animated.View style={[sk.card, { opacity, width: '80%' }]} />
      <Animated.View style={[sk.card, { opacity, width: '65%' }]} />
    </View>
  );
}

// Flag para enfocar la app exclusivamente en el ecosistema Uber (viajes + conductores)
const FOCUS_UBER_MODE = true;

// --- Selector de dashboard por rol ---
function RoleDashboard({ role }: { role: string }) {
  if (FOCUS_UBER_MODE) {
    if (role === 'socio_conductor') {
      return <ConductorDashboard />;
    }
    if (role === 'socio_repartidor' || role === 'medico' || role === 'socio_comercial' || role === 'rent_owner') {
      const roleTitles: Record<string, string> = {
        socio_repartidor: 'Panel de Repartidor',
        medico: 'Panel Médico',
        socio_comercial: 'Panel Comercial',
        rent_owner: 'Panel de Rent-a-Car',
      };
      return (
        <MaintenanceView
          moduleName={roleTitles[role] || 'Módulo Especializado'}
          description="Este módulo se encuentra en pausa operativa mientras priorizamos el servicio de transporte y conductores Xuve."
          showBackButton={false}
        />
      );
    }
    return <ClienteDashboard />;
  }

  switch (role) {
    case 'socio_conductor':  return <ConductorDashboard />;
    case 'socio_repartidor': return <RepartidorDashboard />;
    case 'medico':           return <MedicoDashboard />;
    case 'socio_comercial':  return <ComercialDashboard />;
    case 'rent_owner':       return <RentOwnerDashboard />;
    default:                 return <ClienteDashboard />;  // user + admin
  }
}

export default function HomeScreen() {
  const userRole = useAuthStore((s) => s.user?.role ?? 'user');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Suspense fallback={<DashboardSkeleton />}>
        <RoleDashboard role={userRole} />
      </Suspense>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

const sk = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
  },
  headerInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  nameLine: {
    height: 14,
    width: 130,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
  },
  balanceLine: {
    height: 11,
    width: 85,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceHighlight,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  tab: {
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
  },
  mapBlock: {
    height: 190,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surface,
  },
  card: {
    height: 72,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
});
