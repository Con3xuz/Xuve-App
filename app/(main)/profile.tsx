import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { Button } from '../../src/components/ui';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../src/constants/theme';
import api from '../../src/lib/api';

const ROLE_INFO: Record<string, { label: string; color: string; icon: string }> = {
  user: { label: 'Usuario', color: COLORS.primary, icon: 'person' },
  socio_conductor: { label: 'Socio Conductor', color: '#4DFF91', icon: 'car' },
  socio_repartidor: { label: 'Socio Repartidor', color: '#3B82F6', icon: 'bicycle' },
  socio_comercial: { label: 'Socio Comercial', color: '#EC4899', icon: 'storefront' },
  medico: { label: 'Medico', color: '#14B8A6', icon: 'medical' },
  rent_owner: { label: 'Rent Owner', color: '#F59E0B', icon: 'key' },
  admin: { label: 'Administrador', color: '#EF4444', icon: 'shield' },
};

const KYC_STATUS: Record<string, { label: string; color: string; icon: string }> = {
  approved: { label: 'Verificado', color: '#4DFF91', icon: 'checkmark-circle' },
  pending: { label: 'En revision', color: '#F59E0B', icon: 'time' },
  rejected: { label: 'Rechazado', color: '#EF4444', icon: 'close-circle' },
  none: { label: 'Sin verificar', color: COLORS.textLight, icon: 'alert-circle' },
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);

  const roleInfo = ROLE_INFO[user?.role || 'user'] || ROLE_INFO.user;
  const kycInfo = KYC_STATUS[user?.kyc_status || 'none'] || KYC_STATUS.none;

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logout(); } catch (e) {}
    // Force navigation - use different methods for different platforms
    if (Platform.OS === 'web') {
      // On web, force a full page reload to reset all state
      try {
        (window as any).location.href = '/';
      } catch (e) {
        router.replace('/');
      }
    } else {
      router.replace('/(auth)/login');
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/auth/profile', {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
      });
      await refreshUser();
      setShowEditModal(false);
      Alert.alert('Listo', 'Perfil actualizado correctamente');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = () => {
    setEditForm({ name: user?.name || '', phone: user?.phone || '' });
    setShowEditModal(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>MI PERFIL</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarHeader}>
            <View style={styles.avatarWrapper}>
              {user?.picture ? (
                <Image source={{ uri: user.picture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarLetter}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.editAvatarBtn} onPress={openEditModal}>
                <Ionicons name="camera" size={14} color={COLORS.textOnPrimary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Usuario'}</Text>
            <View style={[styles.roleChip, { backgroundColor: roleInfo.color + '20' }]}>
              <Ionicons name={roleInfo.icon as any} size={14} color={roleInfo.color} />
              <Text style={[styles.roleChipText, { color: roleInfo.color }]}>{roleInfo.label}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.statVal}>{user?.avg_rating?.toFixed(1) || '5.0'}</Text>
              <Text style={styles.statLbl}>Rating</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statItem}>
              <Ionicons name="time" size={16} color="#00F0FF" />
              <Text style={styles.statVal}>{user?.total_trips || 0}</Text>
              <Text style={styles.statLbl}>Viajes</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statItem}>
              <Ionicons name="wallet" size={16} color="#4DFF91" />
              <Text style={styles.statVal}>${user?.wallet_balance?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.statLbl}>Balance</Text>
            </View>
          </View>
        </View>

        {/* Contact Details */}
        <View style={styles.detailsList}>
          <View style={styles.detailItem}>
            <View style={[styles.detailIcon, { backgroundColor: '#4DFF9120' }]}>
              <Ionicons name="mail" size={18} color="#4DFF91" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{user?.email}</Text>
            </View>
          </View>
          <View style={styles.detailItem}>
            <View style={[styles.detailIcon, { backgroundColor: '#00F0FF20' }]}>
              <Ionicons name="call" size={18} color="#00F0FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Telefono</Text>
              <Text style={styles.detailValue}>{user?.phone || 'No registrado'}</Text>
            </View>
          </View>
          <View style={styles.detailItem}>
            <View style={[styles.detailIcon, { backgroundColor: kycInfo.color + '20' }]}>
              <Ionicons name={kycInfo.icon as any} size={18} color={kycInfo.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Estado KYC</Text>
              <Text style={[styles.detailValue, { color: kycInfo.color }]}>{kycInfo.label}</Text>
            </View>
          </View>
        </View>

        {/* Menu Section 1 */}
        <View style={styles.menuSection}>
          <MenuItem icon="person-outline" label="Editar Perfil" onPress={openEditModal} />
          <MenuItem icon="shield-checkmark-outline" label="Verificacion KYC" onPress={() => router.push('/(main)/kyc')} rightText={kycInfo.label} />
          <MenuItem icon="time-outline" label="Historial de Servicios" onPress={() => router.push('/(main)/service-history')} />
        </View>

        {/* Menu Section 2 */}
        <View style={styles.menuSection}>
          <MenuItem icon="wallet-outline" label="Mi Billetera" onPress={() => router.push('/(main)/wallet')} />
          <MenuItem icon="car-outline" label="Rent-a-Car" onPress={() => router.push('/(main)/rent')} />
          <MenuItem icon="cart-outline" label="Market" onPress={() => router.push('/(main)/market')} />
          <MenuItem icon="chatbubbles-outline" label="Chat" onPress={() => router.push('/(main)/chat')} />
        </View>

        {/* Menu Section 3 */}
        <View style={styles.menuSection}>
          <MenuItem icon="information-circle-outline" label="Acerca de OMNI" onPress={() => Alert.alert('OMNI SuperApp', 'Version 2.0\nMovilidad & Comercio para Venezuela\n\nContacto: soporte@omni.ve')} />
          <MenuItem icon="help-circle-outline" label="Ayuda y Soporte" onPress={() => Alert.alert('Soporte', 'Para soporte contacta:\nWhatsApp: +58 412-000-0000\nEmail: soporte@omni.ve')} />
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          disabled={loggingOut}
          accessibilityRole="button"
          accessibilityLabel="Cerrar Sesion"
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={styles.logoutText}>CERRAR SESION</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.versionText}>OMNI SuperApp v2.0</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={editForm.name}
              onChangeText={(t) => setEditForm(p => ({ ...p, name: t }))}
              placeholder="Tu nombre"
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.inputLabel}>Telefono</Text>
            <TextInput
              style={styles.input}
              value={editForm.phone}
              onChangeText={(t) => setEditForm(p => ({ ...p, phone: t }))}
              placeholder="+58 412-000-0000"
              placeholderTextColor={COLORS.textLight}
              keyboardType="phone-pad"
            />

            <Button
              title={saving ? 'Guardando...' : 'GUARDAR CAMBIOS'}
              onPress={handleSaveProfile}
              loading={saving}
              style={{ marginTop: SPACING.lg }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function MenuItem({ icon, label, onPress, rightText, color = COLORS.text }: { icon: string; label: string; onPress: () => void; rightText?: string; color?: string }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon as any} size={20} color={color} />
        <Text style={[styles.menuItemLabel, { color }]}>{label}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {rightText && <Text style={styles.menuItemRightText}>{rightText}</Text>}
        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  pageTitle: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.text, letterSpacing: 2, marginBottom: SPACING.md },
  profileCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xxl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  avatarHeader: { height: 100, backgroundColor: COLORS.primary + '15', justifyContent: 'flex-end', alignItems: 'center' },
  avatarWrapper: { position: 'absolute', bottom: -36 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: COLORS.surface },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.surface },
  avatarLetter: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.textOnPrimary },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.surface },
  profileInfo: { alignItems: 'center', paddingTop: 44, paddingBottom: SPACING.md },
  profileName: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  roleChip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full },
  roleChipText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: SPACING.md },
  statDiv: { width: 1, backgroundColor: COLORS.border },
  statVal: { fontSize: FONT_SIZE.lg, fontWeight: 'bold', color: COLORS.text, marginTop: 4 },
  statLbl: { fontSize: 10, color: COLORS.textLight, marginTop: 2 },
  detailsList: { gap: SPACING.sm, marginBottom: SPACING.md },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border },
  detailIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  detailLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
  detailValue: { fontSize: FONT_SIZE.md, color: COLORS.text, marginTop: 2 },
  menuSection: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: SPACING.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, minHeight: 52 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  menuItemLabel: { fontSize: FONT_SIZE.md },
  menuItemRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  menuItemRightText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.md, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.xl, borderWidth: 1.5, borderColor: '#EF444440' },
  logoutText: { fontSize: FONT_SIZE.md, fontWeight: '700', color: '#EF4444', letterSpacing: 1 },
  versionText: { textAlign: 'center', fontSize: FONT_SIZE.sm, color: COLORS.textLight, marginTop: SPACING.lg, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: BORDER_RADIUS.xxl, borderTopRightRadius: BORDER_RADIUS.xxl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  inputLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs, marginTop: SPACING.md },
  input: { backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, fontSize: FONT_SIZE.md, color: COLORS.text, minHeight: 48 },
});
