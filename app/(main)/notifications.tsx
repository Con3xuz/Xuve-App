import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../src/constants/theme';
import api from '../../src/api';

interface Notification {
  notification_id: string;
  type: string;
  title?: string;
  message: string;
  read: boolean;
  created_at: string;
}

const NOTIFICATION_ICONS: Record<string, { icon: string; color: string }> = {
  kyc_approved: { icon: 'checkmark-circle', color: COLORS.success },
  kyc_rejected: { icon: 'close-circle', color: COLORS.error },
  kyc_pending: { icon: 'time', color: COLORS.warning },
  new_prescription: { icon: 'medical', color: COLORS.roleDoctor },
  prescription_received: { icon: 'document-text', color: COLORS.secondary },
  order_update: { icon: 'bag', color: COLORS.roleCommerce },
  service_update: { icon: 'car', color: COLORS.roleDriver },
  default: { icon: 'notifications', color: COLORS.primary },
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.post(`/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n => n.notification_id === notificationId ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>NOTIFICACIONES</Text>
          {unreadCount > 0 && <Text style={styles.unreadText}>{unreadCount} sin leer</Text>}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Marcar todas</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.emptyContainer}><Text style={styles.emptyText}>Cargando...</Text></View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>Sin notificaciones</Text>
            <Text style={styles.emptySubtext}>Tus avisos aparecerÃ¡n aquÃ­</Text>
          </View>
        ) : (
          <View style={styles.notifList}>
            {notifications.map((notification) => {
              const config = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.default;
              return (
                <TouchableOpacity
                  key={notification.notification_id}
                  style={[styles.notifItem, !notification.read && styles.notifUnread]}
                  onPress={() => markAsRead(notification.notification_id)}
                >
                  <View style={[styles.notifIcon, { backgroundColor: config.color + '20' }]}>
                    <Ionicons name={config.icon as any} size={22} color={config.color} />
                  </View>
                  <View style={styles.notifContent}>
                    {notification.title && <Text style={styles.notifTitle}>{notification.title}</Text>}
                    <Text style={styles.notifMessage} numberOfLines={2}>{notification.message}</Text>
                    <Text style={styles.notifTime}>
                      {new Date(notification.created_at).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  {!notification.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.text, letterSpacing: 2 },
  unreadText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, marginTop: 2 },
  markAllText: { fontSize: FONT_SIZE.md, color: COLORS.primary, fontWeight: '500' },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingTop: 0 },
  notifList: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  notifItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  notifUnread: { backgroundColor: COLORS.primary + '08' },
  notifIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text },
  notifMessage: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginTop: 2 },
  notifTime: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginTop: SPACING.xs },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, marginLeft: SPACING.sm },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxl * 2 },
  emptyText: { fontSize: FONT_SIZE.lg, color: COLORS.textSecondary, marginTop: SPACING.md },
  emptySubtext: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, marginTop: SPACING.xs },
});
