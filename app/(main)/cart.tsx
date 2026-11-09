import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { Button } from '../../src/components/ui';
import api from '../../src/api';
import { getCart, clearCartGlobal } from './market';

export default function CartScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();
  const [cart, setCartItems] = useState(getCart());
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const refreshCart = () => {
    setCartItems([...getCart()]);
  };

  useEffect(() => { refreshCart(); }, []);

  const cartTotal = cart.reduce((sum, i) => sum + (i.price_usd * i.quantity), 0);
  const deliveryFee = 2.0;
  const total = cartTotal + deliveryFee;
  const balance = user?.wallet_balance || 0;

  const updateQuantity = (productId: string, newQty: number) => {
    const globalCart = getCart();
    const item = globalCart.find(i => i.product_id === productId);
    if (item) {
      if (newQty <= 0) {
        const idx = globalCart.indexOf(item);
        globalCart.splice(idx, 1);
      } else {
        item.quantity = newQty;
      }
    }
    refreshCart();
  };

  const removeItem = (productId: string) => {
    const globalCart = getCart();
    const idx = globalCart.findIndex(i => i.product_id === productId);
    if (idx !== -1) globalCart.splice(idx, 1);
    refreshCart();
  };

  const handleCheckout = async () => {
    if (!deliveryAddress.trim()) {
      Alert.alert('Error', 'Ingresa tu dirección de entrega');
      return;
    }
    if (balance < total) {
      Alert.alert('Saldo insuficiente', `Necesitas $${(total - balance).toFixed(2)} más. Recarga tu wallet.`);
      return;
    }
    const storeId = cart[0]?.store_id;
    if (!storeId) {
      Alert.alert('Error', 'Carrito vacío');
      return;
    }
    setLoading(true);
    try {
      await api.post('/market/orders', {
        store_id: storeId,
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        delivery_address: deliveryAddress,
        delivery_lat: 8.5897,
        delivery_lng: -71.1561,
      });
      Alert.alert('¡Éxito!', 'Pedido realizado con éxito');
      clearCartGlobal();
      refreshCart();
      await refreshUser();
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-handle-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>Carrito vacío</Text>
          <Text style={styles.emptySubtext}>Agrega productos desde Xuve Market</Text>
          <Button title="IR AL MARKET" onPress={() => router.back()} style={{ marginTop: SPACING.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textSecondary} />
          <Text style={styles.backText}>Seguir comprando</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={styles.title}>TU CARRITO</Text>
          <TouchableOpacity onPress={() => { clearCartGlobal(); refreshCart(); }}>
            <Text style={styles.clearText}>Vaciar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        {cart.map((item) => (
          <View key={item.product_id} style={styles.cartItem}>
            <View style={styles.cartItemImage}>
              <Ionicons name="cube" size={24} color={COLORS.primary + '60'} />
            </View>
            <View style={styles.cartItemInfo}>
              <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.cartItemPrice}>${item.price_usd.toFixed(2)} c/u</Text>
            </View>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateQuantity(item.product_id, item.quantity - 1)}
              >
                <Ionicons name="remove" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateQuantity(item.product_id, item.quantity + 1)}
              >
                <Ionicons name="add" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.product_id)}>
              <Ionicons name="trash" size={18} color={COLORS.accent} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Delivery Address */}
        <View style={styles.addressSection}>
          <View style={styles.addressLabel}>
            <Ionicons name="location" size={16} color={COLORS.textSecondary} />
            <Text style={styles.addressLabelText}>Dirección de entrega</Text>
          </View>
          <TextInput
            style={styles.addressInput}
            placeholder="Av. Las Américas, Centro Comercial..."
            placeholderTextColor={COLORS.textLight}
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
          />
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</Text>
            <Text style={styles.summaryValue}>${cartTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>

          {/* Balance check */}
          <View style={[styles.balanceCheck, { borderColor: balance >= total ? COLORS.primary + '30' : COLORS.accent + '30', backgroundColor: balance >= total ? COLORS.primary + '10' : COLORS.accent + '10' }]}>
            <View style={styles.balanceRow}>
              <Text style={styles.summaryLabel}>Tu saldo:</Text>
              <Text style={[styles.summaryValue, { color: balance >= total ? COLORS.primary : COLORS.accent }]}>
                ${balance.toFixed(2)}
              </Text>
            </View>
            {balance < total && (
              <Text style={styles.insufficientText}>Necesitas ${(total - balance).toFixed(2)} más</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Checkout */}
      <View style={styles.checkoutBar}>
        <Button
          title={`PAGAR $${total.toFixed(2)}`}
          onPress={handleCheckout}
          loading={loading}
          disabled={balance < total || !deliveryAddress.trim()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text, marginTop: SPACING.md },
  emptySubtext: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginTop: SPACING.xs },
  header: { padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.sm },
  backText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.text, letterSpacing: 2 },
  clearText: { fontSize: FONT_SIZE.sm, color: COLORS.accent },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  cartItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  cartItemImage: { width: 48, height: 48, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.surfaceHighlight, justifyContent: 'center', alignItems: 'center' },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: FONT_SIZE.md, fontWeight: '500', color: COLORS.text },
  cartItemPrice: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.surfaceHighlight, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text, width: 24, textAlign: 'center' },
  removeBtn: { padding: SPACING.sm },
  addressSection: { marginVertical: SPACING.md },
  addressLabel: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.sm },
  addressLabelText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  addressInput: { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, fontSize: FONT_SIZE.md, color: COLORS.text, minHeight: 48 },
  summaryCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  summaryTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  summaryLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  summaryValue: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontWeight: '500' },
  summaryTotal: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm, marginTop: SPACING.xs },
  totalLabel: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text },
  totalValue: { fontSize: FONT_SIZE.lg, fontWeight: 'bold', color: COLORS.primary },
  balanceCheck: { marginTop: SPACING.md, padding: SPACING.sm, borderRadius: BORDER_RADIUS.lg, borderWidth: 1 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  insufficientText: { fontSize: FONT_SIZE.xs, color: COLORS.accent, marginTop: SPACING.xs },
  checkoutBar: { padding: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.background },
});
