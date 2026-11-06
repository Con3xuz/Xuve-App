import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import api from '../lib/api';

const PURPLE = '#8B5CF6';

export default function ComercialDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'pedidos' | 'productos' | 'tienda'>('pedidos');
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [todayStats, setTodayStats] = useState({ orders: 0, revenue: 0 });
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', category: 'comida', available: true });
  const [storeForm, setStoreForm] = useState({ store_name: '', category: 'restaurante', description: '', address: '', phone: '', opening_hours: '8:00 - 20:00' });

  const fetchData = async () => {
    try {
      try {
        const storeRes = await api.get('/comercial/profile');
        setStore(storeRes.data);
      } catch {
        try { const legacyRes = await api.get('/socio/comercial/profile'); setStore(legacyRes.data); }
        catch { setStore(null); }
      }
      try { const prodRes = await api.get('/socio/comercial/products'); setProducts(prodRes.data || []); } catch {}
      try {
        const [incRes, actRes] = await Promise.all([
          api.get('/comercial/orders/incoming').catch(() => ({ data: { orders: [] } })),
          api.get('/comercial/orders/active').catch(() => ({ data: { orders: [] } })),
        ]);
        setOrders([...(incRes.data.orders || []), ...(actRes.data.orders || [])]);
        try {
          const statsRes = await api.get('/comercial/orders/stats/today');
          setTodayStats({ orders: statsRes.data.total_orders || 0, revenue: statsRes.data.total_revenue || 0 });
        } catch {}
      } catch {}
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const handleCreateStore = async () => {
    if (!storeForm.store_name) { Alert.alert('Error', 'Nombre de tienda requerido'); return; }
    try {
      await api.post('/comercial/register', storeForm);
      Alert.alert('Éxito', '¡Tienda creada!');
      setShowStoreModal(false);
      fetchData();
    } catch (e: any) { Alert.alert('Error', e.response?.data?.detail || 'Error'); }
  };

  const handleAddProduct = async () => {
    if (!productForm.name || !productForm.price) { Alert.alert('Error', 'Nombre y precio requeridos'); return; }
    try {
      await api.post('/socio/comercial/products', { ...productForm, price_usd: parseFloat(productForm.price) });
      Alert.alert('Éxito', '¡Producto agregado!');
      setShowProductModal(false);
      setProductForm({ name: '', description: '', price: '', category: 'comida', available: true });
      fetchData();
    } catch (e: any) { Alert.alert('Error', e.response?.data?.detail || 'Error'); }
  };

  const acceptOrder = async (orderId: string) => {
    try { await api.post(`/comercial/orders/${orderId}/accept`); Alert.alert('Aceptado'); fetchData(); }
    catch (e: any) { Alert.alert('Error', e.response?.data?.detail || 'Error'); }
  };

  const TABS = [
    { id: 'pedidos' as const, label: 'Pedidos', count: orders.length },
    { id: 'productos' as const, label: 'Productos', count: products.length },
    { id: 'tienda' as const, label: 'Mi Tienda', count: 0 },
  ];

  const orderStatusColors: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: '#F59E0B20', text: '#F59E0B', label: 'Pendiente' },
    accepted: { bg: '#3B82F620', text: '#3B82F6', label: 'Aceptado' },
    preparing: { bg: '#F9731620', text: '#F97316', label: 'Preparando' },
    ready: { bg: COLORS.primary + '20', text: COLORS.primary, label: 'Listo' },
    delivering: { bg: COLORS.secondary + '20', text: COLORS.secondary, label: 'En camino' },
    completed: { bg: COLORS.primary + '20', text: COLORS.primary, label: 'Completado' },
    cancelled: { bg: COLORS.accent + '20', text: COLORS.accent, label: 'Cancelado' },
  };

  if (!store && !loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl }}>
        <Ionicons name="storefront-outline" size={64} color={COLORS.textLight} />
        <Text style={{ fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text, marginTop: SPACING.md }}>Crea tu Tienda</Text>
        <Text style={{ fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm }}>Configura tu comercio para empezar a vender</Text>
        <Button title="CREAR MI TIENDA" onPress={() => setShowStoreModal(true)} style={{ marginTop: SPACING.lg, backgroundColor: PURPLE }} />

        <Modal visible={showStoreModal} animationType="slide" transparent onRequestClose={() => setShowStoreModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Crear Tienda</Text>
                  <TouchableOpacity onPress={() => setShowStoreModal(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
                </View>
                <Text style={styles.formLabel}>Nombre *</Text>
                <TextInput style={styles.formInput} placeholder="Mi Tienda" placeholderTextColor={COLORS.textLight}
                  value={storeForm.store_name} onChangeText={(t) => setStoreForm(p => ({ ...p, store_name: t }))} />
                <Text style={styles.formLabel}>Categoría</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {['restaurante', 'farmacia', 'minimarket', 'supermercado', 'panaderia', 'otros'].map(cat => (
                    <TouchableOpacity key={cat} style={[styles.catChip, storeForm.category === cat && { borderColor: PURPLE, backgroundColor: PURPLE + '15' }]}
                      onPress={() => setStoreForm(p => ({ ...p, category: cat }))}>
                      <Text style={[styles.catChipText, storeForm.category === cat && { color: PURPLE }]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={styles.formLabel}>Dirección</Text>
                <TextInput style={styles.formInput} placeholder="Av. Las Américas..." placeholderTextColor={COLORS.textLight}
                  value={storeForm.address} onChangeText={(t) => setStoreForm(p => ({ ...p, address: t }))} />
                <Text style={styles.formLabel}>Teléfono</Text>
                <TextInput style={styles.formInput} placeholder="0412..." placeholderTextColor={COLORS.textLight} keyboardType="phone-pad"
                  value={storeForm.phone} onChangeText={(t) => setStoreForm(p => ({ ...p, phone: t }))} />
                <Text style={styles.formLabel}>Descripción</Text>
                <TextInput style={[styles.formInput, { minHeight: 60, textAlignVertical: 'top' }]} placeholder="Describe tu negocio" multiline placeholderTextColor={COLORS.textLight}
                  value={storeForm.description} onChangeText={(t) => setStoreForm(p => ({ ...p, description: t }))} />
                <Button title="CREAR TIENDA" onPress={handleCreateStore} style={{ marginTop: SPACING.lg, marginBottom: SPACING.xxl, backgroundColor: PURPLE }} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View style={[styles.roleAvatar, { backgroundColor: PURPLE + '20' }]}>
          <Ionicons name="storefront" size={24} color={PURPLE} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.roleLabel, { color: PURPLE }]}>SOCIO COMERCIAL</Text>
          <Text style={styles.userName}>{store?.store_name || store?.name || user?.name}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="bag" size={20} color={PURPLE} />
          <Text style={styles.statValue}>{todayStats.orders}</Text>
          <Text style={styles.statLabel}>Pedidos hoy</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cash" size={20} color={COLORS.primary} />
          <Text style={styles.statValue}>${todayStats.revenue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Ventas hoy</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cube" size={20} color={COLORS.secondary} />
          <Text style={styles.statValue}>{products.length}</Text>
          <Text style={styles.statLabel}>Productos</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab.id} style={[styles.tabBtn, activeTab === tab.id && { backgroundColor: PURPLE, borderColor: PURPLE }]}
            onPress={() => setActiveTab(tab.id)}>
            <Text style={[styles.tabText, activeTab === tab.id && { color: '#fff' }]}>{tab.label}</Text>
            {tab.count > 0 && <Text style={[styles.tabCount, activeTab === tab.id && { color: 'rgba(255,255,255,0.8)' }]}>{tab.count}</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders Tab */}
      {activeTab === 'pedidos' && (
        <>
          {orders.length === 0 ? (
            <View style={styles.emptyBox}><Ionicons name="bag-outline" size={40} color={COLORS.textLight} /><Text style={styles.emptyText}>No hay pedidos</Text></View>
          ) : (
            orders.map((order: any) => {
              const ost = orderStatusColors[order.status] || orderStatusColors.pending;
              return (
                <View key={order.order_id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderClient}>{order.client_name || 'Cliente'}</Text>
                    <View style={[styles.orderStatusBadge, { backgroundColor: ost.bg }]}>
                      <Text style={[styles.orderStatusText, { color: ost.text }]}>{ost.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.orderAddress} numberOfLines={1}>{order.delivery_address || 'Dirección'}</Text>
                  <Text style={styles.orderItems}>{order.items?.length || 0} productos • ${order.total?.toFixed(2) || '0.00'}</Text>
                  {order.status === 'pending' && (
                    <TouchableOpacity style={[styles.acceptOrderBtn, { backgroundColor: PURPLE }]} onPress={() => acceptOrder(order.order_id)}>
                      <Text style={styles.acceptOrderText}>ACEPTAR PEDIDO</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </>
      )}

      {/* Products Tab */}
      {activeTab === 'productos' && (
        <>
          <TouchableOpacity style={[styles.addProductBtn, { borderColor: PURPLE, backgroundColor: PURPLE + '15' }]} onPress={() => router.push('/(main)/product-manager')}>
            <Ionicons name="grid" size={20} color={PURPLE} />
            <Text style={[styles.addProductText, { color: PURPLE }]}>GESTOR DE PRODUCTOS (CSV, Fotos)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addProductBtn, { borderColor: PURPLE }]} onPress={() => setShowProductModal(true)}>
            <Ionicons name="add" size={20} color={PURPLE} />
            <Text style={[styles.addProductText, { color: PURPLE }]}>AGREGAR PRODUCTO</Text>
          </TouchableOpacity>
          {products.map((product: any) => (
            <View key={product.product_id} style={styles.productCard}>
              <View style={styles.productIcon}><Ionicons name="cube" size={20} color={PURPLE + '80'} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productDesc} numberOfLines={1}>{product.description}</Text>
              </View>
              <Text style={styles.productPrice}>${product.price_usd?.toFixed(2)}</Text>
            </View>
          ))}
        </>
      )}

      {/* Store Tab */}
      {activeTab === 'tienda' && store && (
        <View style={styles.storeInfoCard}>
          <View style={styles.storeInfoRow}>
            <Ionicons name="storefront" size={18} color={PURPLE} />
            <View style={{ flex: 1 }}><Text style={styles.storeInfoLabel}>Nombre</Text><Text style={styles.storeInfoValue}>{store.store_name || store.name}</Text></View>
          </View>
          <View style={styles.storeInfoRow}>
            <Ionicons name="grid" size={18} color={PURPLE} />
            <View style={{ flex: 1 }}><Text style={styles.storeInfoLabel}>Categoría</Text><Text style={styles.storeInfoValue}>{store.category}</Text></View>
          </View>
          <View style={styles.storeInfoRow}>
            <Ionicons name="location" size={18} color={PURPLE} />
            <View style={{ flex: 1 }}><Text style={styles.storeInfoLabel}>Dirección</Text><Text style={styles.storeInfoValue}>{store.address || 'No definida'}</Text></View>
          </View>
          <View style={styles.storeInfoRow}>
            <Ionicons name="call" size={18} color={PURPLE} />
            <View style={{ flex: 1 }}><Text style={styles.storeInfoLabel}>Teléfono</Text><Text style={styles.storeInfoValue}>{store.phone || 'No definido'}</Text></View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>ACCIONES RAPIDAS</Text>
      <View style={styles.quickActionsRow}>
        <TouchableOpacity style={[styles.quickAction, { borderColor: PURPLE + '40' }]} onPress={() => router.push('/(main)/product-manager')}>
          <Ionicons name="cube" size={20} color={PURPLE} />
          <Text style={styles.quickActionText}>Gestor</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(main)/service-history')}>
          <Ionicons name="time" size={20} color={PURPLE} />
          <Text style={styles.quickActionText}>Historial</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(main)/chat')}>
          <Ionicons name="chatbubbles" size={20} color={COLORS.primary} />
          <Text style={styles.quickActionText}>Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Add Product Modal */}
      <Modal visible={showProductModal} animationType="slide" transparent onRequestClose={() => setShowProductModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Producto</Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <Text style={styles.formLabel}>Nombre *</Text>
            <TextInput style={styles.formInput} placeholder="Nombre del producto" placeholderTextColor={COLORS.textLight}
              value={productForm.name} onChangeText={(t) => setProductForm(p => ({ ...p, name: t }))} />
            <Text style={styles.formLabel}>Precio ($) *</Text>
            <TextInput style={styles.formInput} placeholder="0.00" placeholderTextColor={COLORS.textLight} keyboardType="numeric"
              value={productForm.price} onChangeText={(t) => setProductForm(p => ({ ...p, price: t }))} />
            <Text style={styles.formLabel}>Descripción</Text>
            <TextInput style={[styles.formInput, { minHeight: 60, textAlignVertical: 'top' }]} placeholder="Descripción..." multiline placeholderTextColor={COLORS.textLight}
              value={productForm.description} onChangeText={(t) => setProductForm(p => ({ ...p, description: t }))} />
            <Button title="AGREGAR PRODUCTO" onPress={handleAddProduct} style={{ marginTop: SPACING.lg, marginBottom: SPACING.xxl, backgroundColor: PURPLE }} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  roleAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  roleLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', letterSpacing: 2 },
  userName: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', gap: SPACING.xs },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
  tabsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: SPACING.sm + 2, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  tabText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textSecondary },
  tabCount: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
  emptyBox: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xl, alignItems: 'center', gap: SPACING.sm },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textLight },
  orderCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  orderClient: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text },
  orderStatusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  orderStatusText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  orderAddress: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  orderItems: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginTop: 4 },
  acceptOrderBtn: { marginTop: SPACING.sm, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.lg, alignItems: 'center' },
  acceptOrderText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.sm, letterSpacing: 0.5 },
  addProductBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.xl, borderWidth: 1.5, borderStyle: 'dashed', marginBottom: SPACING.md },
  addProductText: { fontWeight: '700', fontSize: FONT_SIZE.md, letterSpacing: 0.5 },
  productCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm },
  productIcon: { width: 44, height: 44, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.surfaceHighlight, justifyContent: 'center', alignItems: 'center' },
  productName: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text },
  productDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginTop: 2 },
  productPrice: { fontSize: FONT_SIZE.lg, fontWeight: 'bold', color: COLORS.primary },
  storeInfoCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  storeInfoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  storeInfoLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
  storeInfoValue: { fontSize: FONT_SIZE.md, color: COLORS.text, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: BORDER_RADIUS.xxl, borderTopRightRadius: BORDER_RADIUS.xxl, padding: SPACING.lg, maxHeight: '90%', borderWidth: 1, borderColor: COLORS.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  formLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs, marginTop: SPACING.md },
  formInput: { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, fontSize: FONT_SIZE.md, color: COLORS.text, minHeight: 48 },
  catChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: COLORS.border, marginRight: SPACING.sm },
  catChipText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textTransform: 'capitalize' },
  quickActionsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  quickAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, paddingVertical: SPACING.md },
  quickActionText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textSecondary },
  sectionTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1, marginBottom: SPACING.md },
});
