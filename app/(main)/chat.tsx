import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../src/constants/theme';
import api from '../../src/lib/api';

interface ActiveService {
  service_id: string;
  service_type: string;
  status: string;
  driver_id?: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat?: number;
  dropoff_lng?: number;
  created_at: string;
}

export default function ChatHubScreen() {
  const router = useRouter();
  const [services, setServices] = useState<ActiveService[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveServices = async () => {
    try {
      const response = await api.get('/services/active');
      setServices(response.data || []);
    } catch (error) {
      console.error('Error cargando chats activos:', error);
      Alert.alert('Error', 'No se pudieron cargar los chats activos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveServices();
  }, []);

  const handleOpenChat = (service: ActiveService) => {
    const query = `?serviceType=${encodeURIComponent(service.service_type)}${service.driver_id ? `&providerId=${encodeURIComponent(service.driver_id)}` : ''}`;
    router.push(`/chat/${service.service_id}${query}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats de Servicios</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchActiveServices}>
          <Ionicons name="refresh" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando chats activos...</Text>
        </View>
      ) : services.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>Sin chats activos</Text>
          <Text style={styles.emptySubtitle}>Solicita un servicio para iniciar una conversación con tu proveedor.</Text>
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.service_id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handleOpenChat(item)}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Servicio #{item.service_id.slice(-8)}</Text>
                <Text style={styles.cardStatus}>{item.status}</Text>
              </View>
              <Text style={styles.cardText}>Tipo: {item.service_type}</Text>
              <Text style={styles.cardText}>Origen: {item.pickup_lat?.toFixed(4)}, {item.pickup_lng?.toFixed(4)}</Text>
              {item.dropoff_lat && (
                <Text style={styles.cardText}>Destino: {item.dropoff_lat.toFixed(4)}, {item.dropoff_lng?.toFixed(4)}</Text>
              )}
              <Text style={styles.cardFooter}>Creado: {new Date(item.created_at).toLocaleString('es-VE')}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  refreshBtn: {
    padding: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  emptyTitle: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptySubtitle: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: '85%',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  cardStatus: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  cardText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  cardFooter: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
  },
});
