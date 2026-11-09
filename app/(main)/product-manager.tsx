import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
  Image,
  Platform,
  KeyboardAvoidingView,
  Linking,
  FlatList,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../src/constants/theme';
import api from '../../src/api';

const PURPLE = '#8B5CF6';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.md * 3) / 2;

// ==================== MAIN COMPONENT ====================
export default function ProductManagerScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });

  // Modals
  const [showImportModal, setShowImportModal] = useState(false);
  const [showProductFormModal, setShowProductFormModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const params: any = { page, limit: 50 };
      if (search) params.search = search;
      const res = await api.get('/store/products', { params });
      setProducts(res.data.products || []);
      setPagination(res.data.pagination || { total: 0, total_pages: 1 });
    } catch (e: any) {
      console.log('Error fetching products:', e.message);
    }
  }, [page, search]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/store/products/stats');
      setStats(res.data);
    } catch (e: any) {
      console.log('Error fetching stats:', e.message);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchProducts(), fetchStats()]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchStats()]);
    setRefreshing(false);
  };

  // Delete product
  const handleDelete = (productId: string, productName: string) => {
    Alert.alert(
      'Eliminar Producto',
      `Â¿Eliminar "${productName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/store/products/${productId}`);
              Alert.alert('Eliminado', 'Producto eliminado correctamente');
              fetchProducts();
              fetchStats();
            } catch { Alert.alert('Error', 'No se pudo eliminar'); }
          }
        }
      ]
    );
  };

  // Toggle availability
  const handleToggle = async (product: any) => {
    try {
      await api.put(`/store/products/${product.product_id}`, {
        is_available: !product.is_available
      });
      fetchProducts();
    } catch { Alert.alert('Error', 'No se pudo actualizar'); }
  };

  // Bulk actions
  const handleBulkAction = (action: string) => {
    if (selectedIds.length === 0) {
      Alert.alert('Aviso', 'Selecciona al menos un producto');
      return;
    }
    const count = selectedIds.length;
    const actionText = action === 'activate' ? 'activar' : action === 'deactivate' ? 'desactivar' : 'eliminar';

    Alert.alert(
      'AcciÃ³n Masiva',
      `Â¿${actionText.charAt(0).toUpperCase() + actionText.slice(1)} ${count} productos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              if (action === 'delete') {
                await api.post('/store/products/bulk/delete', { product_ids: selectedIds });
              } else {
                await api.post('/store/products/bulk/update-availability', {
                  product_ids: selectedIds,
                  is_available: action === 'activate'
                });
              }
              Alert.alert('Ã‰xito', `${count} productos ${actionText === 'eliminar' ? 'eliminados' : (action === 'activate' ? 'activados' : 'desactivados')}`);
              setSelectedIds([]);
              setSelectMode(false);
              fetchProducts();
              fetchStats();
            } catch { Alert.alert('Error', 'Error en la acciÃ³n masiva'); }
          }
        }
      ]
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      const url = `${backendUrl}/api/store/products/import/template`;
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await Linking.openURL(url);
      }
    } catch {
      Alert.alert('Error', 'No se pudo descargar la plantilla');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestor de Productos</Text>
        <View style={styles.headerActions}>
          {selectMode ? (
            <TouchableOpacity onPress={() => { setSelectMode(false); setSelectedIds([]); }}>
              <Text style={{ color: COLORS.accent, fontWeight: '600', fontSize: FONT_SIZE.sm }}>Cancelar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setSelectMode(true)}>
              <Ionicons name="checkbox-outline" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        {stats && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
            <View style={styles.statsRow}>
              <StatCard icon="cube" color="#3B82F6" value={stats.total_products} label="Total" />
              <StatCard icon="checkmark-circle" color={COLORS.primary} value={stats.active_products} label="Activos" />
              <StatCard icon="alert-circle" color={COLORS.accent} value={stats.out_of_stock} label="Sin Stock" />
              <StatCard icon="image" color="#F59E0B" value={stats.without_images} label="Sin Imagen" />
            </View>
          </ScrollView>
        )}

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={COLORS.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar productos..."
              placeholderTextColor={COLORS.textLight}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              onSubmitEditing={() => { setPage(1); fetchProducts(); }}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => { setSearch(''); setPage(1); }}>
                <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: PURPLE + '20', borderColor: PURPLE }]} onPress={() => setShowImportModal(true)}>
            <Ionicons name="document-text" size={18} color={PURPLE} />
            <Text style={[styles.actionBtnText, { color: PURPLE }]}>Importar CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary }]}
            onPress={() => { setEditingProduct(null); setShowProductFormModal(true); }}>
            <Ionicons name="add" size={18} color={COLORS.primary} />
            <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Agregar</Text>
          </TouchableOpacity>
        </View>

        {/* Bulk Actions */}
        {selectMode && selectedIds.length > 0 && (
          <View style={styles.bulkBar}>
            <Text style={styles.bulkText}>{selectedIds.length} seleccionados</Text>
            <View style={styles.bulkActions}>
              <TouchableOpacity style={[styles.bulkBtn, { backgroundColor: COLORS.primary + '20' }]} onPress={() => handleBulkAction('activate')}>
                <Ionicons name="eye" size={16} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.bulkBtn, { backgroundColor: '#F59E0B20' }]} onPress={() => handleBulkAction('deactivate')}>
                <Ionicons name="eye-off" size={16} color="#F59E0B" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.bulkBtn, { backgroundColor: COLORS.accent + '20' }]} onPress={() => handleBulkAction('delete')}>
                <Ionicons name="trash" size={16} color={COLORS.accent} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Products Grid */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={PURPLE} />
            <Text style={styles.loadingText}>Cargando productos...</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="cube-outline" size={56} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>No tienes productos</Text>
            <Text style={styles.emptyDesc}>Agrega productos manualmente o importa desde Excel/CSV</Text>
            <View style={styles.emptyActions}>
              <TouchableOpacity style={[styles.emptyBtn, { borderColor: PURPLE }]} onPress={() => setShowImportModal(true)}>
                <Ionicons name="document-text" size={16} color={PURPLE} />
                <Text style={[styles.emptyBtnText, { color: PURPLE }]}>Importar Excel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.emptyBtn, { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' }]}
                onPress={() => { setEditingProduct(null); setShowProductFormModal(true); }}>
                <Ionicons name="add" size={16} color={COLORS.primary} />
                <Text style={[styles.emptyBtnText, { color: COLORS.primary }]}>Crear Producto</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {products.map(product => (
              <ProductCard
                key={product.product_id}
                product={product}
                selectMode={selectMode}
                selected={selectedIds.includes(product.product_id)}
                onSelect={() => toggleSelect(product.product_id)}
                onEdit={() => { setEditingProduct(product); setShowProductFormModal(true); }}
                onDelete={() => handleDelete(product.product_id, product.name)}
                onToggle={() => handleToggle(product)}
                onManageImages={() => { setSelectedProduct(product); setShowImageModal(true); }}
              />
            ))}
          </View>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <View style={styles.paginationRow}>
            <TouchableOpacity
              style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
              disabled={page === 1}
              onPress={() => setPage(p => Math.max(1, p - 1))}
            >
              <Ionicons name="chevron-back" size={18} color={page === 1 ? COLORS.textLight : COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.pageText}>
              PÃ¡g {page} de {pagination.total_pages} ({pagination.total} prod.)
            </Text>
            <TouchableOpacity
              style={[styles.pageBtn, page === pagination.total_pages && styles.pageBtnDisabled]}
              disabled={page === pagination.total_pages}
              onPress={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
            >
              <Ionicons name="chevron-forward" size={18} color={page === pagination.total_pages ? COLORS.textLight : COLORS.text} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <ImportModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportDone={() => { fetchProducts(); fetchStats(); }}
        onDownloadTemplate={handleDownloadTemplate}
      />

      <ProductFormModal
        visible={showProductFormModal}
        onClose={() => { setShowProductFormModal(false); setEditingProduct(null); }}
        product={editingProduct}
        onSaved={() => { fetchProducts(); fetchStats(); setShowProductFormModal(false); setEditingProduct(null); }}
      />

      <ImageManagerModal
        visible={showImageModal}
        onClose={() => { setShowImageModal(false); setSelectedProduct(null); }}
        product={selectedProduct}
        onUpdated={() => { fetchProducts(); }}
      />
    </View>
  );
}

// ==================== STAT CARD ====================
const StatCard = ({ icon, color, value, label }: { icon: string; color: string; value: number; label: string }) => (
  <View style={[styles.statCard, { borderColor: color + '30' }]}>
    <Ionicons name={icon as any} size={20} color={color} />
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ==================== PRODUCT CARD ====================
const ProductCard = ({ product, selectMode, selected, onSelect, onEdit, onDelete, onToggle, onManageImages }: any) => (
  <View style={[styles.productCard, selected && { borderColor: PURPLE, borderWidth: 2 }]}>
    {/* Image area */}
    <TouchableOpacity style={styles.productImageArea} onPress={onManageImages} activeOpacity={0.8}>
      {product.primary_image_url ? (
        <Image
          source={{ uri: product.primary_image_url.startsWith('/') ? `${process.env.EXPO_PUBLIC_BACKEND_URL}${product.primary_image_url}` : product.primary_image_url }}
          style={styles.productImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.productNoImage}>
          <Ionicons name="image-outline" size={32} color={COLORS.textLight} />
        </View>
      )}
      {/* Availability badge */}
      <View style={[styles.statusBadge, { backgroundColor: product.is_available ? COLORS.primary + 'CC' : '#666CC' }]}>
        <Text style={styles.statusBadgeText}>{product.is_available ? 'Activo' : 'Inactivo'}</Text>
      </View>
      {/* Image count */}
      {product.images_count > 0 && (
        <View style={styles.imageCountBadge}>
          <Ionicons name="image" size={10} color="#fff" />
          <Text style={styles.imageCountText}>{product.images_count}</Text>
        </View>
      )}
      {/* Select checkbox */}
      {selectMode && (
        <TouchableOpacity style={styles.selectCheckbox} onPress={onSelect}>
          <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={22} color={selected ? PURPLE : '#fff'} />
        </TouchableOpacity>
      )}
      {/* No image hint */}
      {!product.has_images && (
        <View style={styles.addPhotoHint}>
          <Ionicons name="camera" size={12} color="#000" />
          <Text style={styles.addPhotoHintText}>Foto</Text>
        </View>
      )}
    </TouchableOpacity>

    {/* Info */}
    <View style={styles.productInfo}>
      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.productCategory}>{product.category}</Text>
      <View style={styles.productPriceRow}>
        <Text style={styles.productPrice}>${product.price?.toFixed(2)}</Text>
        {product.track_inventory && (
          <Text style={[styles.productStock, product.stock === 0 && { color: COLORS.accent }]}>
            Stock: {product.stock}
          </Text>
        )}
      </View>
    </View>

    {/* Actions */}
    <View style={styles.productActions}>
      <TouchableOpacity style={[styles.prodActionBtn, { backgroundColor: '#3B82F620' }]} onPress={onEdit}>
        <Ionicons name="create-outline" size={16} color="#3B82F6" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.prodActionBtn, { backgroundColor: product.is_available ? '#F59E0B20' : COLORS.primary + '20' }]}
        onPress={onToggle}
      >
        <Ionicons name={product.is_available ? 'eye-off-outline' : 'eye-outline'} size={16} color={product.is_available ? '#F59E0B' : COLORS.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.prodActionBtn, { backgroundColor: COLORS.accent + '20' }]} onPress={onDelete}>
        <Ionicons name="trash-outline" size={16} color={COLORS.accent} />
      </TouchableOpacity>
    </View>
  </View>
);

// ==================== IMPORT MODAL ====================
const ImportModal = ({ visible, onClose, onImportDone, onDownloadTemplate }: any) => {
  const [file, setFile] = useState<any>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '*/*'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setFile(res.assets[0]);
        setResult(null);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      const fileObj: any = {
        uri: file.uri,
        name: file.name || 'products.csv',
        type: file.mimeType || 'text/csv',
      };
      formData.append('file', fileObj);

      const res = await api.post(
        `/store/products/import/csv?update_existing=${updateExisting}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }
      );
      setResult(res.data);
      onImportDone();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Error en la importaciÃ³n');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setUpdateExisting(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                <Ionicons name="document-text" size={22} color={PURPLE} />
                <Text style={styles.modalTitle}>Importar Productos</Text>
              </View>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <View style={styles.instructionBox}>
              <Text style={styles.instructionTitle}>Instrucciones:</Text>
              <Text style={styles.instructionText}>1. Descarga la plantilla de ejemplo</Text>
              <Text style={styles.instructionText}>2. Completa los datos de tus productos</Text>
              <Text style={styles.instructionText}>3. Guarda el archivo como CSV</Text>
              <Text style={styles.instructionText}>4. SÃºbelo aquÃ­</Text>
            </View>

            {/* Download Template */}
            <TouchableOpacity style={styles.templateBtn} onPress={onDownloadTemplate}>
              <Ionicons name="download" size={18} color={COLORS.primary} />
              <Text style={styles.templateBtnText}>Descargar Plantilla de Ejemplo</Text>
            </TouchableOpacity>

            {/* File Picker */}
            <TouchableOpacity style={[styles.filePickerBox, file && { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' }]} onPress={pickFile}>
              {file ? (
                <View style={{ alignItems: 'center', gap: SPACING.xs }}>
                  <Ionicons name="checkmark-circle" size={40} color={COLORS.primary} />
                  <Text style={styles.filePickerName}>{file.name}</Text>
                  <Text style={styles.filePickerSize}>{((file.size || 0) / 1024).toFixed(1)} KB</Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center', gap: SPACING.xs }}>
                  <Ionicons name="cloud-upload" size={40} color={COLORS.textLight} />
                  <Text style={styles.filePickerText}>Toca para seleccionar archivo</Text>
                  <Text style={styles.filePickerHint}>CSV, XLSX, XLS</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Update existing toggle */}
            <View style={styles.toggleRow}>
              <Switch
                value={updateExisting}
                onValueChange={setUpdateExisting}
                trackColor={{ false: COLORS.border, true: PURPLE + '60' }}
                thumbColor={updateExisting ? PURPLE : COLORS.textLight}
              />
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Text style={styles.toggleLabel}>Actualizar existentes</Text>
                <Text style={styles.toggleDesc}>Si un producto ya existe (mismo SKU o nombre), se actualizarÃ¡</Text>
              </View>
            </View>

            {/* Import Result */}
            {result && (
              <View style={[styles.resultBox, result.failed > 0 ? { borderColor: '#F59E0B' } : { borderColor: COLORS.primary }]}>
                <Text style={styles.resultTitle}>Resultado de importaciÃ³n:</Text>
                <View style={styles.resultGrid}>
                  <View style={styles.resultItem}>
                    <Text style={[styles.resultValue, { color: COLORS.primary }]}>{result.successful}</Text>
                    <Text style={styles.resultLabel}>Exitosos</Text>
                  </View>
                  <View style={styles.resultItem}>
                    <Text style={[styles.resultValue, { color: COLORS.accent }]}>{result.failed}</Text>
                    <Text style={styles.resultLabel}>Fallidos</Text>
                  </View>
                  <View style={styles.resultItem}>
                    <Text style={[styles.resultValue, { color: COLORS.textSecondary }]}>{result.total_rows}</Text>
                    <Text style={styles.resultLabel}>Total</Text>
                  </View>
                </View>
                {result.errors?.length > 0 && (
                  <View style={{ marginTop: SPACING.sm }}>
                    <Text style={styles.resultErrorTitle}>Errores:</Text>
                    {result.errors.slice(0, 5).map((err: any, i: number) => (
                      <Text key={i} style={styles.resultErrorText}>Fila {err.row}: {err.error}</Text>
                    ))}
                    {result.errors.length > 5 && (
                      <Text style={styles.resultErrorMore}>...y {result.errors.length - 5} mÃ¡s</Text>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalActionBtn, { borderColor: COLORS.border }]} onPress={handleClose}>
                <Text style={[styles.modalActionBtnText, { color: COLORS.textSecondary }]}>
                  {result ? 'Cerrar' : 'Cancelar'}
                </Text>
              </TouchableOpacity>
              {!result && (
                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: PURPLE, borderColor: PURPLE }, (!file || importing) && { opacity: 0.5 }]}
                  disabled={!file || importing}
                  onPress={handleImport}
                >
                  {importing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="cloud-upload" size={16} color="#fff" />
                      <Text style={[styles.modalActionBtnText, { color: '#fff' }]}>Importar</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ==================== PRODUCT FORM MODAL ====================
const ProductFormModal = ({ visible, onClose, product, onSaved }: any) => {
  const [form, setForm] = useState({
    name: '', description: '', price: '', compare_at_price: '',
    category: '', subcategory: '', sku: '', barcode: '',
    stock: '0', track_inventory: true, is_available: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        compare_at_price: product.compare_at_price?.toString() || '',
        category: product.category || '',
        subcategory: product.subcategory || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        stock: product.stock?.toString() || '0',
        track_inventory: product.track_inventory !== false,
        is_available: product.is_available !== false,
      });
    } else {
      setForm({
        name: '', description: '', price: '', compare_at_price: '',
        category: '', subcategory: '', sku: '', barcode: '',
        stock: '0', track_inventory: true, is_available: true,
      });
    }
  }, [product, visible]);

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) {
      Alert.alert('Error', 'Nombre, precio y categorÃ­a son requeridos');
      return;
    }
    setSaving(true);
    try {
      const data: any = {
        ...form,
        price: parseFloat(form.price),
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        stock: parseInt(form.stock) || 0,
        tags: [],
      };
      if (product) {
        await api.put(`/store/products/${product.product_id}`, data);
        Alert.alert('Ã‰xito', 'Producto actualizado');
      } else {
        await api.post('/store/products', data);
        Alert.alert('Ã‰xito', 'Producto creado');
      }
      onSaved();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{product ? 'Editar Producto' : 'Nuevo Producto'}</Text>
                <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
              </View>

              <FormField label="Nombre *" value={form.name} onChangeText={(t: string) => setForm(p => ({ ...p, name: t }))} placeholder="Ej: AcetaminofÃ©n 500mg" />
              <FormField label="DescripciÃ³n" value={form.description} onChangeText={(t: string) => setForm(p => ({ ...p, description: t }))} placeholder="DescripciÃ³n del producto..." multiline />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <FormField label="Precio ($) *" value={form.price} onChangeText={(t: string) => setForm(p => ({ ...p, price: t }))} placeholder="0.00" keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <FormField label="Precio anterior" value={form.compare_at_price} onChangeText={(t: string) => setForm(p => ({ ...p, compare_at_price: t }))} placeholder="0.00" keyboardType="numeric" />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <FormField label="CategorÃ­a *" value={form.category} onChangeText={(t: string) => setForm(p => ({ ...p, category: t }))} placeholder="Ej: Medicamentos" />
                </View>
                <View style={{ flex: 1 }}>
                  <FormField label="SubcategorÃ­a" value={form.subcategory} onChangeText={(t: string) => setForm(p => ({ ...p, subcategory: t }))} placeholder="Ej: Sin receta" />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <FormField label="SKU" value={form.sku} onChangeText={(t: string) => setForm(p => ({ ...p, sku: t }))} placeholder="MED001" />
                </View>
                <View style={{ flex: 1 }}>
                  <FormField label="CÃ³digo de barras" value={form.barcode} onChangeText={(t: string) => setForm(p => ({ ...p, barcode: t }))} placeholder="7501234567890" />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <FormField label="Stock" value={form.stock} onChangeText={(t: string) => setForm(p => ({ ...p, stock: t }))} placeholder="0" keyboardType="numeric" />
                </View>
                <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                  <View style={styles.switchRow}>
                    <Switch value={form.track_inventory} onValueChange={(v) => setForm(p => ({ ...p, track_inventory: v }))}
                      trackColor={{ false: COLORS.border, true: PURPLE + '60' }} thumbColor={form.track_inventory ? PURPLE : COLORS.textLight} />
                    <Text style={styles.switchLabel}>Inventario</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.toggleRow, { marginTop: SPACING.md }]}>
                <Switch value={form.is_available} onValueChange={(v) => setForm(p => ({ ...p, is_available: v }))}
                  trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }} thumbColor={form.is_available ? COLORS.primary : COLORS.textLight} />
                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                  <Text style={styles.toggleLabel}>Producto disponible</Text>
                  <Text style={styles.toggleDesc}>Los clientes pueden ver y comprar este producto</Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalActionBtn, { borderColor: COLORS.border }]} onPress={onClose}>
                  <Text style={[styles.modalActionBtnText, { color: COLORS.textSecondary }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: PURPLE, borderColor: PURPLE }, saving && { opacity: 0.5 }]}
                  disabled={saving}
                  onPress={handleSave}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={[styles.modalActionBtnText, { color: '#fff' }]}>
                      {product ? 'Guardar Cambios' : 'Crear Producto'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ==================== IMAGE MANAGER MODAL ====================
const ImageManagerModal = ({ visible, onClose, product, onUpdated }: any) => {
  const [uploading, setUploading] = useState(false);
  const [productData, setProductData] = useState<any>(null);

  useEffect(() => {
    if (product) {
      setProductData(product);
    }
  }, [product]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galerÃ­a para subir fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0]);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la cÃ¡mara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0]);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const uploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!productData) return;
    setUploading(true);
    try {
      // 1. Upload image to /api/upload/image
      const formData = new FormData();
      const fileObj: any = {
        uri: asset.uri,
        name: `product_${Date.now()}.jpg`,
        type: 'image/jpeg',
      };
      formData.append('file', fileObj);

      const uploadRes = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });

      const imageUrl = uploadRes.data.url;

      // 2. Add image to product
      await api.post(
        `/store/products/${productData.product_id}/images?image_url=${encodeURIComponent(imageUrl)}&is_primary=false`
      );

      // 3. Refresh product data
      const prodRes = await api.get(`/store/products/${productData.product_id}`);
      setProductData(prodRes.data);
      onUpdated();
      Alert.alert('Ã‰xito', 'Imagen agregada al producto');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = (imageId: string) => {
    if (!productData) return;
    Alert.alert('Eliminar imagen', 'Â¿Eliminar esta imagen?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/store/products/${productData.product_id}/images/${imageId}`);
            const prodRes = await api.get(`/store/products/${productData.product_id}`);
            setProductData(prodRes.data);
            onUpdated();
          } catch { Alert.alert('Error', 'No se pudo eliminar la imagen'); }
        }
      }
    ]);
  };

  const setPrimaryImage = async (imageId: string) => {
    if (!productData) return;
    try {
      await api.put(`/store/products/${productData.product_id}/images/${imageId}/primary`);
      const prodRes = await api.get(`/store/products/${productData.product_id}`);
      setProductData(prodRes.data);
      onUpdated();
    } catch { Alert.alert('Error', 'No se pudo establecer como principal'); }
  };

  if (!productData) return null;

  const images = productData.images || [];
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>ImÃ¡genes</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>{productData.name}</Text>
              </View>
              <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>

            {/* Current Images */}
            {images.length > 0 ? (
              <View style={styles.imagesGrid}>
                {images.map((img: any, idx: number) => {
                  const imgUri = img.url.startsWith('/') ? `${backendUrl}${img.url}` : img.url;
                  return (
                    <View key={img.image_id || idx} style={styles.imageItem}>
                      <Image source={{ uri: imgUri }} style={styles.imageThumb} resizeMode="cover" />
                      {img.is_primary && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryBadgeText}>Principal</Text>
                        </View>
                      )}
                      <View style={styles.imageActions}>
                        {!img.is_primary && (
                          <TouchableOpacity style={styles.imgActionBtn} onPress={() => setPrimaryImage(img.image_id)}>
                            <Ionicons name="star-outline" size={14} color="#F59E0B" />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.imgActionBtn} onPress={() => deleteImage(img.image_id)}>
                          <Ionicons name="trash-outline" size={14} color={COLORS.accent} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.noImagesBox}>
                <Ionicons name="image-outline" size={48} color={COLORS.textLight} />
                <Text style={styles.noImagesText}>Este producto no tiene imÃ¡genes</Text>
              </View>
            )}

            {/* Add Image Buttons */}
            <Text style={[styles.formLabel, { marginTop: SPACING.lg }]}>Agregar nueva imagen</Text>
            <View style={styles.addImageRow}>
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImage} disabled={uploading}>
                <Ionicons name="images" size={24} color={PURPLE} />
                <Text style={styles.addImageBtnText}>GalerÃ­a</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addImageBtn} onPress={takePhoto} disabled={uploading}>
                <Ionicons name="camera" size={24} color={COLORS.primary} />
                <Text style={styles.addImageBtnText}>CÃ¡mara</Text>
              </TouchableOpacity>
            </View>

            {uploading && (
              <View style={styles.uploadingRow}>
                <ActivityIndicator size="small" color={PURPLE} />
                <Text style={styles.uploadingText}>Subiendo imagen...</Text>
              </View>
            )}

            <TouchableOpacity style={[styles.modalActionBtn, { borderColor: COLORS.border, marginTop: SPACING.lg, marginBottom: SPACING.xxl }]} onPress={onClose}>
              <Text style={[styles.modalActionBtnText, { color: COLORS.textSecondary }]}>Cerrar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ==================== FORM FIELD HELPER ====================
const FormField = ({ label, value, onChangeText, placeholder, keyboardType, multiline }: any) => (
  <View style={{ marginTop: SPACING.sm }}>
    <Text style={styles.formLabel}>{label}</Text>
    <TextInput
      style={[styles.formInput, multiline && { minHeight: 70, textAlignVertical: 'top' }]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textLight}
      keyboardType={keyboardType}
      multiline={multiline}
    />
  </View>
);

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? 56 : 16, paddingBottom: SPACING.sm,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: SPACING.xs, marginRight: SPACING.sm },
  headerTitle: { flex: 1, fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },

  // Stats
  statsRow: { flexDirection: 'row', gap: SPACING.sm, paddingRight: SPACING.sm },
  statCard: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md, alignItems: 'center', gap: SPACING.xs,
    borderWidth: 1, minWidth: 85,
  },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: 'bold' },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },

  // Search
  searchRow: { marginBottom: SPACING.md },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, height: 48,
  },
  searchInput: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.text },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xs, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
  },
  actionBtnText: { fontWeight: '700', fontSize: FONT_SIZE.sm },

  // Bulk
  bulkBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: PURPLE + '15', borderWidth: 1, borderColor: PURPLE + '30',
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.sm, marginBottom: SPACING.md,
  },
  bulkText: { fontSize: FONT_SIZE.sm, color: PURPLE, fontWeight: '600' },
  bulkActions: { flexDirection: 'row', gap: SPACING.xs },
  bulkBtn: {
    width: 36, height: 36, borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center', justifyContent: 'center',
  },

  // Loading / Empty
  loadingBox: { alignItems: 'center', padding: SPACING.xl, gap: SPACING.md },
  loadingText: { color: COLORS.textLight, fontSize: FONT_SIZE.md },
  emptyBox: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xl,
    alignItems: 'center', gap: SPACING.sm,
  },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text },
  emptyDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, textAlign: 'center' },
  emptyActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg, borderWidth: 1,
  },
  emptyBtnText: { fontWeight: '600', fontSize: FONT_SIZE.sm },

  // Products Grid
  productsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm,
  },
  productCard: {
    width: CARD_WIDTH, backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden',
  },
  productImageArea: { width: '100%', aspectRatio: 1, backgroundColor: COLORS.surfaceHighlight },
  productImage: { width: '100%', height: '100%' },
  productNoImage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusBadge: {
    position: 'absolute', top: 6, right: 6, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  statusBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  imageCountBadge: {
    position: 'absolute', bottom: 6, right: 6, flexDirection: 'row',
    alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: BORDER_RADIUS.full,
  },
  imageCountText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  selectCheckbox: { position: 'absolute', top: 6, left: 6 },
  addPhotoHint: {
    position: 'absolute', bottom: 6, left: 6, flexDirection: 'row',
    alignItems: 'center', gap: 3, backgroundColor: '#F59E0BCC',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: BORDER_RADIUS.full,
  },
  addPhotoHintText: { color: '#000', fontSize: 10, fontWeight: '700' },

  productInfo: { padding: SPACING.sm },
  productName: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  productCategory: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginTop: 2 },
  productPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  productPrice: { fontSize: FONT_SIZE.md, fontWeight: 'bold', color: COLORS.primary },
  productStock: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },

  productActions: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  prodActionBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.sm,
  },

  // Pagination
  paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.md, marginTop: SPACING.md },
  pageBtn: {
    width: 36, height: 36, borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl, padding: SPACING.lg,
    maxHeight: '92%', borderWidth: 1, borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  modalSubtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg, marginBottom: SPACING.xxl },
  modalActionBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg, borderWidth: 1,
  },
  modalActionBtnText: { fontWeight: '700', fontSize: FONT_SIZE.md },

  // Form
  formLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  formInput: {
    backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, fontSize: FONT_SIZE.md,
    color: COLORS.text, minHeight: 48,
  },
  formRow: { flexDirection: 'row', gap: SPACING.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.sm },
  switchLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: BORDER_RADIUS.lg,
    marginVertical: SPACING.xs,
  },
  toggleLabel: { fontSize: FONT_SIZE.md, color: COLORS.text, fontWeight: '500' },
  toggleDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginTop: 2 },

  // Import Modal
  instructionBox: {
    backgroundColor: '#3B82F615', borderWidth: 1, borderColor: '#3B82F630',
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md,
  },
  instructionTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: '#3B82F6', marginBottom: SPACING.xs },
  instructionText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  templateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.primary + '40', backgroundColor: COLORS.primary + '10',
    marginBottom: SPACING.md,
  },
  templateBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: FONT_SIZE.md },
  filePickerBox: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, alignItems: 'center',
    justifyContent: 'center', marginBottom: SPACING.md,
  },
  filePickerName: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text },
  filePickerSize: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
  filePickerText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  filePickerHint: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },

  // Import result
  resultBox: {
    borderWidth: 1, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginVertical: SPACING.sm,
  },
  resultTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
  resultGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  resultItem: { alignItems: 'center' },
  resultValue: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold' },
  resultLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
  resultErrorTitle: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginBottom: 4 },
  resultErrorText: { fontSize: FONT_SIZE.xs, color: COLORS.accent },
  resultErrorMore: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginTop: 4 },

  // Image Manager
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  imageItem: {
    width: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.sm * 3) / 3,
    aspectRatio: 1, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden',
    backgroundColor: COLORS.surfaceHighlight,
  },
  imageThumb: { width: '100%', height: '100%' },
  primaryBadge: {
    position: 'absolute', top: 4, left: 4, backgroundColor: COLORS.primary,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: BORDER_RADIUS.full,
  },
  primaryBadgeText: { color: '#000', fontSize: 9, fontWeight: '700' },
  imageActions: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: SPACING.xs,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 4,
  },
  imgActionBtn: { padding: 6 },
  noImagesBox: { alignItems: 'center', padding: SPACING.xl, gap: SPACING.sm },
  noImagesText: { color: COLORS.textLight, fontSize: FONT_SIZE.md },
  addImageRow: { flexDirection: 'row', gap: SPACING.md },
  addImageBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xl, paddingVertical: SPACING.lg,
  },
  addImageBtnText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontWeight: '500' },
  uploadingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, marginTop: SPACING.md,
  },
  uploadingText: { color: PURPLE, fontSize: FONT_SIZE.sm },
});
