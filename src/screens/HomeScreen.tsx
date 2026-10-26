import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BalanceCard } from '../components/BalanceCard';
import { TransactionItem } from '../components/TransactionItem';
import {
  FinancialSummary,
  TransactionWithCategory,
  TransactionType,
} from '../types';
import { colors } from '../utils/colors';
import { formatRupiah, toISODateString } from '../utils/formatters';

interface HomeScreenProps {
  summary: FinancialSummary;
  allTransactions?: TransactionWithCategory[];
  recentTransactions: TransactionWithCategory[];
  refreshing: boolean;
  onRefresh: () => void;
  onOpenAddModal: (type: TransactionType) => void;
  onSelectTransaction: (item: TransactionWithCategory) => void;
  onNavigateToTransactions: () => void;
  onNavigateToTodayTransactions?: () => void;
  onNavigateToAnalytics: () => void;
  onNavigateToCategories: () => void;
  onOpenExcelModal: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  summary,
  allTransactions,
  recentTransactions,
  refreshing,
  onRefresh,
  onOpenAddModal,
  onSelectTransaction,
  onNavigateToTransactions,
  onNavigateToTodayTransactions,
  onNavigateToAnalytics,
  onNavigateToCategories,
  onOpenExcelModal,
}) => {
  const todayStr = toISODateString(new Date());
  const todayDateObj = new Date();
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  const todayFormatted = `${dayNames[todayDateObj.getDay()]}, ${todayDateObj.getDate()} ${monthNames[todayDateObj.getMonth()]}`;

  const txSource = allTransactions && allTransactions.length > 0 ? allTransactions : recentTransactions;
  const todayTransactions = txSource.filter((t) => t.date === todayStr);
  const todayExpenses = todayTransactions.filter((t) => t.type === 'expense');
  const todayExpenseTotal = todayExpenses.reduce((sum, t) => sum + t.amount, 0);
  const todayIncomeTotal = todayTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const todayExpenseCount = todayExpenses.length;
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* App Header */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          {/* <Image
            source={require('../../assets/icon.png')}
            style={styles.headerLogo}
            resizeMode="cover"
          /> */}
          <View>
            <Text style={styles.greetingTitle}>Catatan Keuangan</Text>
            <Text style={styles.greetingSubtitle}>Kelola finansial Anda dengan rapi</Text>
          </View>
        </View>
        <View style={styles.headerBtnGroup}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={onOpenExcelModal}
            activeOpacity={0.7}
          >
            <Ionicons name="document-text-outline" size={20} color="#16A34A" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={onNavigateToCategories}
            activeOpacity={0.7}
          >
            <Ionicons name="pricetags-outline" size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Balance Card */}
      <BalanceCard
        summary={summary}
        periodLabel="Keseluruhan"
        onPressPeriod={onNavigateToAnalytics}
      />

      {/* Pengeluaran Hari Ini Card */}
      <TouchableOpacity
        style={styles.todayCard}
        onPress={onNavigateToTodayTransactions || onNavigateToTransactions}
        activeOpacity={0.82}
      >
        <View style={styles.todayCardContent}>
          <View style={styles.todayIconWrap}>
            <Ionicons name="calendar" size={22} color="#EF4444" />
          </View>
          <View style={styles.todayInfo}>
            <View style={styles.todayTopRow}>
              <Text style={styles.todayCardTitle}>Pengeluaran Hari Ini</Text>
              <View style={styles.todayDateTag}>
                <Text style={styles.todayDateTagText}>{todayFormatted}</Text>
              </View>
            </View>

            <Text
              style={[
                styles.todayExpenseAmount,
                todayExpenseTotal === 0 && styles.todayExpenseZero,
              ]}
            >
              {formatRupiah(todayExpenseTotal)}
            </Text>

            <View style={styles.todayBottomRow}>
              <Text style={styles.todayTransCount}>
                {todayExpenseCount > 0
                  ? `${todayExpenseCount} transaksi dicatat`
                  : 'Belum ada pengeluaran'}
              </Text>
              {todayIncomeTotal > 0 && (
                <Text style={styles.todayIncomeSub}>
                  • Pemasukan: +{formatRupiah(todayIncomeTotal)}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.todayChevronWrap}>
          <Text style={styles.todayDetailText}>Rincian</Text>
          <Ionicons name="chevron-forward" size={15} color={colors.primary} />
        </View>
      </TouchableOpacity>

      {/* Quick Action Buttons */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={[styles.quickActionBtn, styles.expenseBtn]}
          onPress={() => onOpenAddModal('expense')}
          activeOpacity={0.8}
        >
          <View style={styles.actionIconWrapExpense}>
            <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.actionBtnTextExpense}>+ Pengeluaran</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionBtn, styles.incomeBtn]}
          onPress={() => onOpenAddModal('income')}
          activeOpacity={0.8}
        >
          <View style={styles.actionIconWrapIncome}>
            <Ionicons name="arrow-down" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.actionBtnTextIncome}>+ Pemasukan</Text>
        </TouchableOpacity>
      </View>

      {/* Shortcuts Row */}
      <View style={styles.shortcutRow}>
        <TouchableOpacity
          style={styles.shortcutCard}
          onPress={onNavigateToAnalytics}
          activeOpacity={0.7}
        >
          <View style={[styles.shortcutIconWrap, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="pie-chart" size={20} color="#4F46E5" />
          </View>
          <View>
            <Text style={styles.shortcutTitle}>Analisis Finansial</Text>
            <Text style={styles.shortcutDesc}>Grafik & persentase</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcutCard}
          onPress={onNavigateToCategories}
          activeOpacity={0.7}
        >
          <View style={[styles.shortcutIconWrap, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="apps" size={20} color="#16A34A" />
          </View>
          <View>
            <Text style={styles.shortcutTitle}>Kategori</Text>
            <Text style={styles.shortcutDesc}>Atur pos pengeluaran</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Excel Export & Import Card */}
      <TouchableOpacity
        style={styles.excelBannerCard}
        onPress={onOpenExcelModal}
        activeOpacity={0.8}
      >
        <View style={styles.excelBannerIconWrap}>
          <Ionicons name="document-text" size={24} color="#16A34A" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.excelBannerTitleRow}>
            <Text style={styles.excelBannerTitle}>Ekspor & Impor Excel</Text>
            <View style={styles.excelTag}>
              <Text style={styles.excelTagText}>.XLSX</Text>
            </View>
          </View>
          <Text style={styles.excelBannerDesc}>
            Cadangkan data atau impor transaksi dari file Excel
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </TouchableOpacity>

      {/* Recent Transactions Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
        <TouchableOpacity
          onPress={onNavigateToTransactions}
          activeOpacity={0.6}
        >
          <Text style={styles.seeAllText}>Lihat Semua</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Belum Ada Catatan</Text>
            <Text style={styles.emptySubtitle}>
              Tekan tombol di atas untuk mencatat pengeluaran atau pemasukan pertama Anda.
            </Text>
          </View>
        ) : (
          recentTransactions.map((item) => (
            <TransactionItem
              key={item.id}
              transaction={item}
              onPress={onSelectTransaction}
            />
          ))
        )}
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  headerBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 2,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  todayCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  todayIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayInfo: {
    flex: 1,
  },
  todayTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  todayCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  todayDateTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  todayDateTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  todayExpenseAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: -0.5,
    marginVertical: 1,
  },
  todayExpenseZero: {
    color: '#64748B',
  },
  todayBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  todayTransCount: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  todayIncomeSub: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  todayChevronWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 2,
    marginLeft: 8,
  },
  todayDetailText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  excelBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    gap: 12,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  excelBannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  excelBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  excelBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  excelTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  excelTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
  },
  excelBannerDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginVertical: 4,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  expenseBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  incomeBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  actionIconWrapExpense: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconWrapIncome: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnTextExpense: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  actionBtnTextIncome: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  shortcutRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 14,
  },
  shortcutCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 10,
  },
  shortcutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortcutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  shortcutDesc: {
    fontSize: 11,
    color: '#64748B',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
