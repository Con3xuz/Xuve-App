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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { Card, Button } from '../../src/components/ui';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../src/constants/theme';
import api from '../../src/api';

interface Transaction {
  transaction_id: string;
  amount_usd: number;
  type: string;
  status: string;
  description: string;
  created_at: string;
}

export default function WalletScreen() {
  const { user, refreshUser } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(50);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeRef, setRechargeRef] = useState('');
  const [rechargeMethod, setRechargeMethod] = useState('pago_movil');
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawCedula, setWithdrawCedula] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const walletBalance = user?.wallet_balance || 0;
  const walletHeld = user?.wallet_held || 0;
  const availableBalance = walletBalance - walletHeld;

  const fetchData = async () => {
    try {
      const [txRes, rateRes] = await Promise.all([
        api.get('/wallet/transactions'),
        api.get('/exchange-rate'),
      ]);
      setTransactions(txRes.data || []);
      setExchangeRate(rateRes.data.usd_to_bs || 50);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), fetchData()]);
    setRefreshing(false);
  };

  const handleRecharge = async () => {
    const amountBs = parseFloat(rechargeAmount);
    if (!amountBs || amountBs <= 0) {
      Alert.alert('Error', 'Ingresa un monto vÃ¡lido');
      return;
    }
    if (!rechargeRef.trim()) {
      Alert.alert('Error', 'Ingresa la referencia del pago');
      return;
    }
    setRechargeLoading(true);
    try {
      await api.post('/wallet/recharge', {
        amount_bs: amountBs,
        payment_method: rechargeMethod,
        reference: rechargeRef.trim(),
      });
      Alert.alert('Ã‰xito', `Recarga de $${(amountBs / exchangeRate).toFixed(2)} USD procesada`);
      setShowRechargeModal(false);
      setRechargeAmount('');
      setRechargeRef('');
      await Promise.all([refreshUser(), fetchData()]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo procesar la recarga');
    } finally {
      setRechargeLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amountUsd = parseFloat(withdrawAmount);
    if (!amountUsd || amountUsd <= 0) {
      Alert.alert('Error', 'Ingresa un monto vÃ¡lido');
      return;
    }
    if (amountUsd > availableBalance) {
      Alert.alert('Error', 'Saldo insuficiente');
      return;
    }
    setWithdrawLoading(true);
    try {
      await api.post('/wallet/withdraw', {
        amount_usd: amountUsd,
        bank_name: withdrawBank,
        phone: withdrawPhone,
        cedula: withdrawCedula,
      });
      Alert.alert('Ã‰xito', 'Solicitud de retiro enviada');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawBank('');
      setWithdrawPhone('');
      setWithdrawCedula('');
      await Promise.all([refreshUser(), fetchData()]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error en el retiro');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const renderTransaction = (tx: Transaction) => {
    const isPositive = tx.amount_usd > 0;
    return (
      <View key={tx.transaction_id} style={styles.txItem}>
        <View style={[styles.txIcon, { backgroundColor: isPositive ? COLORS.primary + '20' : COLORS.accent + '20' }]}>
          <Ionicons
            name={isPositive ? 'arrow-down' : 'arrow-up'}
            size={18}
            color={isPositive ? COLORS.primary : COLORS.accent}
          />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txDesc} numberOfLines={1}>{tx.description || tx.type}</Text>
          <View style={styles.txStatus}>
            <Ionicons
              name={tx.status === 'completed' ? 'checkmark-circle' : tx.status === 'pending' ? 'time' : 'close-circle'}
              size={12}
              color={tx.status === 'completed' ? COLORS.primary : tx.status === 'pending' ? COLORS.warning : COLORS.accent}
            />
            <Text style={styles.txStatusText}>{tx.status}</Text>
          </View>
        </View>
        <View style={styles.txAmountContainer}>
          <Text style={[styles.txAmount, { color: isPositive ? COLORS.primary : COLORS.accent }]}>
            {isPositive ? '+' : ''}{tx.amount_usd.toFixed(2)} $
          </Text>
          <Text style={styles.txDate}>
            {new Date(tx.created_at).toLocaleDateString('es-VE')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.pageTitle}>WALLET</Text>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceGlow} />
          <Text style={styles.balanceLabel}>Balance disponible</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>${availableBalance.toFixed(2)}</Text>
            <Text style={styles.balanceCurrency}>USD</Text>
          </View>
          <Text style={styles.balanceBs}>â‰ˆ Bs {(availableBalance * exchangeRate).toFixed(2)}</Text>

          {walletHeld > 0 && (
            <View style={styles.heldRow}>
              <Ionicons name="lock-closed" size={12} color={COLORS.warning} />
              <Text style={styles.heldText}>${walletHeld.toFixed(2)} en garantÃ­a</Text>
            </View>
          )}

          <View style={styles.rateBox}>
            <Text style={styles.rateLabel}>Tasa actual</Text>
            <Text style={styles.rateValue}>1 USD = {exchangeRate.toFixed(2)} Bs</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => setShowRechargeModal(true)}>
            <Ionicons name="add" size={22} color={COLORS.textOnPrimary} />
            <Text style={styles.actionBtnPrimaryText}>RECARGAR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnOutline} onPress={() => setShowWithdrawModal(true)}>
            <Ionicons name="remove" size={22} color={COLORS.primary} />
            <Text style={styles.actionBtnOutlineText}>RETIRAR</Text>
          </TouchableOpacity>
        </View>

        {/* Transactions */}
        <Text style={styles.sectionTitle}>Historial</Text>
        {transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No hay transacciones</Text>
          </View>
        ) : (
          <View style={styles.txList}>
            {transactions.slice(0, 15).map(renderTransaction)}
          </View>
        )}
      </ScrollView>

      {/* Recharge Modal */}
      <Modal visible={showRechargeModal} animationType="slide" transparent onRequestClose={() => setShowRechargeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recargar Wallet</Text>
              <TouchableOpacity onPress={() => setShowRechargeModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>MÃ©todo de pago</Text>
            <View style={styles.methodRow}>
              <TouchableOpacity
                style={[styles.methodBtn, rechargeMethod === 'pago_movil' && styles.methodBtnActive]}
                onPress={() => setRechargeMethod('pago_movil')}
              >
                <Ionicons name="phone-portrait" size={24} color={rechargeMethod === 'pago_movil' ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[styles.methodBtnText, rechargeMethod === 'pago_movil' && { color: COLORS.primary }]}>Pago MÃ³vil</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodBtn, rechargeMethod === 'binance_pay' && styles.methodBtnActive]}
                onPress={() => setRechargeMethod('binance_pay')}
              >
                <Ionicons name="qr-code" size={24} color={rechargeMethod === 'binance_pay' ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[styles.methodBtnText, rechargeMethod === 'binance_pay' && { color: COLORS.primary }]}>Binance Pay</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Monto en Bs</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0.00"
              value={rechargeAmount}
              onChangeText={setRechargeAmount}
              keyboardType="numeric"
              placeholderTextColor={COLORS.textLight}
            />
            {rechargeAmount ? (
              <Text style={styles.conversionText}>â‰ˆ ${(parseFloat(rechargeAmount) / exchangeRate).toFixed(2)} USD</Text>
            ) : null}

            <Text style={styles.modalLabel}>Referencia de pago</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ãšltimos 6 dÃ­gitos"
              value={rechargeRef}
              onChangeText={setRechargeRef}
              keyboardType="numeric"
              placeholderTextColor={COLORS.textLight}
            />

            <Button title="CONFIRMAR RECARGA" onPress={handleRecharge} loading={rechargeLoading} style={{ marginTop: SPACING.lg }} />
          </View>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal visible={showWithdrawModal} animationType="slide" transparent onRequestClose={() => setShowWithdrawModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Retirar a Pago MÃ³vil</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Monto en USD</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0.00"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="numeric"
              placeholderTextColor={COLORS.textLight}
            />
            {withdrawAmount ? (
              <Text style={styles.conversionText}>RecibirÃ¡s â‰ˆ Bs {(parseFloat(withdrawAmount) * exchangeRate).toFixed(2)}</Text>
            ) : null}

            <Text style={styles.modalLabel}>Banco</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Banesco, Provincial..."
              value={withdrawBank}
              onChangeText={setWithdrawBank}
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.modalLabel}>TelÃ©fono</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0412..."
              value={withdrawPhone}
              onChangeText={setWithdrawPhone}
              keyboardType="phone-pad"
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.modalLabel}>CÃ©dula</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="V-12345678"
              value={withdrawCedula}
              onChangeText={setWithdrawCedula}
              placeholderTextColor={COLORS.textLight}
            />

            <Button title="SOLICITAR RETIRO" onPress={handleWithdraw} loading={withdrawLoading} style={{ marginTop: SPACING.lg }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  pageTitle: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.text, letterSpacing: 2, marginBottom: SPACING.md },

  // Balance
  balanceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  balanceGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    opacity: 0.1,
  },
  balanceLabel: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.sm, marginTop: SPACING.xs },
  balanceAmount: { fontSize: 44, fontWeight: 'bold', color: COLORS.text },
  balanceCurrency: { fontSize: FONT_SIZE.lg, color: COLORS.textSecondary },
  balanceBs: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginTop: SPACING.xs },
  heldRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.sm },
  heldText: { fontSize: FONT_SIZE.sm, color: COLORS.warning },
  rateBox: {
    marginTop: SPACING.md,
    padding: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
  rateValue: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600' },

  // Actions
  actionRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md + 2,
    borderRadius: BORDER_RADIUS.lg,
  },
  actionBtnPrimaryText: { color: COLORS.textOnPrimary, fontWeight: '700', fontSize: FONT_SIZE.md, letterSpacing: 1 },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: 'transparent',
    paddingVertical: SPACING.md + 2,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  actionBtnOutlineText: { color: COLORS.primary, fontWeight: '700', fontSize: FONT_SIZE.md, letterSpacing: 1 },

  // Transactions
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.md, letterSpacing: 1 },
  txList: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  txInfo: { flex: 1 },
  txDesc: { fontSize: FONT_SIZE.md, color: COLORS.text, fontWeight: '500' },
  txStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  txStatusText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  txAmountContainer: { alignItems: 'flex-end' },
  txAmount: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  txDate: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginTop: 2 },

  emptyContainer: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginTop: SPACING.md },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text, letterSpacing: 1 },
  modalLabel: { fontSize: FONT_SIZE.sm, fontWeight: '500', color: COLORS.textSecondary, marginBottom: SPACING.sm, marginTop: SPACING.md, letterSpacing: 0.5 },
  modalInput: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    minHeight: 48,
  },
  conversionText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, marginTop: SPACING.xs },
  methodRow: { flexDirection: 'row', gap: SPACING.md },
  methodBtn: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  methodBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  methodBtnText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
});
