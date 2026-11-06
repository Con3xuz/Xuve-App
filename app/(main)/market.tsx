import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../src/constants/theme';
import api from '../../src/lib/api';

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: 'grid' },
  { id: 'comida', label: 'Comida', icon: 'restaurant' },
  { id: 'farmacia', label: 'Farmacia', icon: 'medical' },
  { id: 'supermercado', label: 'Super', icon: 'cart' },
];

interface Store {
  store_id: string;
  name: string;
  store_name?: string;
  address: string;
  category: string;
  rating: number;
  image_url?: string;
}

interface Product {
  product_id: string;
  name: string;
  description: string;
  price_usd: number;
  category: string;
  store_id: string;
  image_url?: string;
}

interface CartItem extends Product {
  quantity: number;
}

// Simple cart state (in-memory for now)
let globalCart: CartItem[] = [];

export const getCart = () => globalCart;
export const addToCartGlobal = (product: Product) => {
  const existing = globalCart.find(i => i.product_id === product.product_id);
  if (existing) {
    existing.quantity += 1;
  } else {
    globalCart.push({ ...product, quantity: 1 });
  }
};
export const clearCartGlobal = () => { globalCart = []; };

export default function MarketScreen() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const fetchData = async () => {
    try {
      const [storesRes, productsRes] = await Promise.all([
        api.get('/market/stores'),
        api.get('/market/products'),
      ]);
      setStores(storesRes.data.stores || storesRes.data || []);
      setProducts(productsRes.data.products || productsRes.data || []);
    } catch (error) {
      console.log('Market API not ready, using fallback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const filteredStores = activeCategory === 'all'
    ? stores
    : stores.filter(s => s.category === activeCategory);

  const filteredProducts = products.filter(p => {
    const matchesStore = !selectedStore || p.store_id === selectedStore.store_id;
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStore && matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product: Product) => {
    addToCartGlobal(product);
    setCartCount(getCart().reduce((sum, i) => sum + i.quantity, 0));
    Alert.alert('Agregado', `${product.name} agregado al carrito`);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'comida': return '#F97316';
      case 'farmacia': return '#3B82F6';
      case 'supermercado': return COLORS.primary;
      default: return COLORS.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={COLORS.textSecondary} />
              <Text style={styles.backText}>Volver</Text>
            </TouchableOpacity>
            <Text style={styles.title}>OMNI MARKET</Text>
          </View>
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/(main)/cart')}>
            <Ionicons name="cart" size={22} color={COLORS.primary} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, activeCategory === cat.id && styles.categoryChipActive]}
              onPress={() => { setActiveCategory(cat.id); setSelectedStore(null); }}
            >
              <Ionicons
                name={cat.icon as any}
                size={16}
                color={activeCategory === cat.id ? COLORS.textOnPrimary : COLORS.textSecondary}
              />
              <Text style={[styles.categoryText, activeCategory === cat.id && styles.categoryTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            {/* Stores */}
            {!selectedStore && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tiendas</Text>
                {filteredStores.length === 0 ? (
                  <Text style={styles.emptyText}>No hay tiendas disponibles</Text>
                ) : (
                  filteredStores.map((store) => (
                    <TouchableOpacity
                      key={store.store_id}
                      style={styles.storeCard}
                      onPress={() => setSelectedStore(store)}
                    >
                      <View style={styles.storeImagePlaceholder}>
                        <Ionicons name="storefront" size={32} color={COLORS.primary + '60'} />
                      </View>
                      <View style={styles.storeInfo}>
                        <Text style={styles.storeName}>{store.name || store.store_name}</Text>
                        <Text style={styles.storeAddress} numberOfLines={1}>{store.address}</Text>
                        <View style={styles.storeMetaRow}>
                          <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={12} color="#F59E0B" />
                            <Text style={styles.ratingText}>{store.rating || '4.5'}</Text>
                          </View>
                          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(store.category) + '20' }]}>
                            <Text style={[styles.categoryBadgeText, { color: getCategoryColor(store.category) }]}>
                              {store.category}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {/* Selected Store */}
            {selectedStore && (
              <View style={styles.selectedStoreHeader}>
                <TouchableOpacity onPress={() => setSelectedStore(null)} style={styles.backToStores}>
                  <Ionicons name="arrow-back" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.backToStoresText}>Ver todas las tiendas</Text>
                </TouchableOpacity>
                <View style={styles.selectedStoreCard}>
                  <View style={[styles.storeImagePlaceholder, { width: 48, height: 48 }]}>
                    <Ionicons name="storefront" size={24} color={COLORS.primary + '60'} />
                  </View>
                  <View>
                    <Text style={styles.storeName}>{selectedStore.name || selectedStore.store_name}</Text>
                    <Text style={styles.storeAddress}>{selectedStore.address}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Products */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {selectedStore ? 'Productos' : 'Productos Destacados'}
              </Text>
              <View style={styles.productsGrid}>
                {filteredProducts.slice(0, selectedStore ? 100 : 8).map((product) => (
                  <View key={product.product_id} style={styles.productCard}>
                    <View style={styles.productImagePlaceholder}>
                      <Ionicons name="cube" size={32} color={COLORS.primary + '40'} />
                      <TouchableOpacity
                        style={styles.addToCartBtn}
                        onPress={() => handleAddToCart(product)}
                      >
                        <Ionicons name="add" size={20} color={COLORS.textOnPrimary} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                      <Text style={styles.productDesc} numberOfLines={1}>{product.description}</Text>
                      <Text style={styles.productPrice}>${product.price_usd.toFixed(2)}</Text>
                    </View>
                  </View>
                ))}
              </View>
              {filteredProducts.length === 0 && (
                <Text style={styles.emptyText}>No hay productos disponibles</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.floatingCartBtn}
          onPress={() => router.push('/(main)/cart')}
        >
          <Ionicons name="cart" size={20} color={COLORS.textOnPrimary} />
          <Text style={styles.floatingCartText}>Ver Carrito ({cartCount})</Text>
          <Text style={styles.floatingCartTotal}>
            ${getCart().reduce((sum, i) => sum + (i.price_usd * i.quantity), 0).toFixed(2)}
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: 'rgba(0,0,0,0.9)', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.xs },
  backText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.text, letterSpacing: 2 },
  cartBtn: { position: 'relative', width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  cartBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: COLORS.primary, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { fontSize: 10, fontWeight: 'bold', color: COLORS.textOnPrimary },
  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md, minHeight: 44, marginBottom: SPACING.sm },
  searchInput: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.text, paddingVertical: SPACING.sm },
  categoriesScroll: { flexGrow: 0 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: COLORS.border, marginRight: SPACING.sm },
  categoryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textSecondary },
  categoryTextActive: { color: COLORS.textOnPrimary },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  loadingContainer: { paddingVertical: SPACING.xxl * 2, alignItems: 'center' },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.md, letterSpacing: 0.5 },
  emptyText: { textAlign: 'center', color: COLORS.textLight, paddingVertical: SPACING.xl },
  // Stores
  storeCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  storeImagePlaceholder: { width: 64, height: 64, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.surfaceHighlight, justifyContent: 'center', alignItems: 'center' },
  storeInfo: { flex: 1 },
  storeName: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text },
  storeAddress: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginTop: 2 },
  storeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xs },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  categoryBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  categoryBadgeText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  // Selected Store
  selectedStoreHeader: { marginBottom: SPACING.md },
  backToStores: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.sm },
  backToStoresText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  selectedStoreCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  // Products
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  productCard: { width: '48%', flexGrow: 1, flexBasis: '47%', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  productImagePlaceholder: { height: 120, backgroundColor: COLORS.surfaceHighlight, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  addToCartBtn: { position: 'absolute', bottom: 8, right: 8, width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  productInfo: { padding: SPACING.sm },
  productName: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  productDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginTop: 2 },
  productPrice: { fontSize: FONT_SIZE.md, fontWeight: 'bold', color: COLORS.primary, marginTop: SPACING.xs },
  // Floating Cart
  floatingCartBtn: { position: 'absolute', bottom: SPACING.md, left: SPACING.md, right: SPACING.md, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.xl, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, ...SHADOWS.neon },
  floatingCartText: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.textOnPrimary },
  floatingCartTotal: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.textOnPrimary, opacity: 0.8 },
});
