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
import { useTheme } from '../context/ThemeContext';

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
  onNavigateToAnalytics?: () => void;
  onNavigateToCategories?: () => void;
  onOpenExcelModal?: () => void;
  onOpenThemeModal?: () => void;
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
  onOpenThemeModal,
}) => {
  const { theme, isDark, themeMode } = useTheme();
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
      style={[styles.container, { backgroundColor: theme.background }]}
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
            <Text style={[styles.greetingTitle, { color: theme.textPrimary }]}>Catatan Keuangan</Text>
            <Text style={[styles.greetingSubtitle, { color: theme.textSecondary }]}>Kelola finansial Anda dengan rapi</Text>
          </View>
        </View>

        {onOpenThemeModal && (
          <TouchableOpacity
            style={[
              styles.themeToggleBtn,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={onOpenThemeModal}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={
                themeMode === 'system'
                  ? 'phone-portrait-outline'
                  : themeMode === 'dark'
                  ? 'moon'
                  : 'sunny'
              }
              size={18}
              color={theme.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Main Balance Card */}
      <BalanceCard
        summary={summary}
        periodLabel="Keseluruhan"
        onPressPeriod={onNavigateToAnalytics}
      />

      {/* Pengeluaran Hari Ini Card */}
      <TouchableOpacity
        style={[
          styles.todayCard,
          {
            backgroundColor: theme.card,
            borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FEE2E2',
          },
        ]}
        onPress={onNavigateToTodayTransactions || onNavigateToTransactions}
        activeOpacity={0.82}
      >
        <View style={styles.todayHeaderRow}>
          <View style={styles.todayTitleBlock}>
            <View
              style={[
                styles.todayIconWrap,
                {
                  backgroundColor: isDark
                    ? 'rgba(239, 68, 68, 0.2)'
                    : '#FEF2F2',
                },
              ]}
            >
              <Ionicons name="calendar" size={18} color="#EF4444" />
            </View>
            <View style={styles.todayTitleTextWrap}>
              <Text style={[styles.todayCardTitle, { color: theme.textPrimary }]}>
                Pengeluaran Hari Ini
              </Text>
              <Text style={[styles.todayDateSubtitle, { color: theme.textSecondary }]}>
                {todayFormatted}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.todayDetailPill,
              {
                backgroundColor: isDark
                  ? 'rgba(59, 130, 246, 0.2)'
                  : '#EFF6FF',
              },
            ]}
          >
            <Text style={[styles.todayDetailText, { color: theme.primary }]}>
              Rincian
            </Text>
            <Ionicons name="chevron-forward" size={13} color={theme.primary} />
          </View>
        </View>

        <View style={styles.todayBody}>
          <Text
            style={[
              styles.todayExpenseAmount,
              todayExpenseTotal === 0 && { color: theme.textSecondary },
            ]}
          >
            {formatRupiah(todayExpenseTotal)}
          </Text>

          <View style={styles.todayBottomRow}>
            <Text style={[styles.todayTransCount, { color: theme.textMuted }]}>
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
      </TouchableOpacity>

      {/* Quick Action Buttons */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={[
            styles.quickActionBtn,
            styles.expenseBtn,
            isDark && {
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              borderColor: 'rgba(239, 68, 68, 0.35)',
            },
          ]}
          onPress={() => onOpenAddModal('expense')}
          activeOpacity={0.8}
        >
          <View style={styles.actionIconWrapExpense}>
            <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
          </View>
          <Text
            style={[
              styles.actionBtnTextExpense,
              isDark && { color: '#F87171' },
            ]}
          >
            + Pengeluaran
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickActionBtn,
            styles.incomeBtn,
            isDark && {
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              borderColor: 'rgba(16, 185, 129, 0.35)',
            },
          ]}
          onPress={() => onOpenAddModal('income')}
          activeOpacity={0.8}
        >
          <View style={styles.actionIconWrapIncome}>
            <Ionicons name="arrow-down" size={18} color="#FFFFFF" />
          </View>
          <Text
            style={[
              styles.actionBtnTextIncome,
              isDark && { color: '#34D399' },
            ]}
          >
            + Pemasukan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent Transactions Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Transaksi Terbaru
        </Text>
        <TouchableOpacity
          onPress={onNavigateToTransactions}
          activeOpacity={0.6}
        >
          <Text style={[styles.seeAllText, { color: theme.primary }]}>
            Lihat Semua
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {recentTransactions.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons name="wallet-outline" size={44} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              Belum Ada Catatan
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
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
  themeToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
  todayCard: {
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
  todayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  todayTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  todayIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayTitleTextWrap: {
    flex: 1,
  },
  todayCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  todayDateSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  todayDetailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 3,
  },
  todayDetailText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  todayBody: {
    paddingLeft: 4,
  },
  todayExpenseAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  todayExpenseZero: {
    color: '#64748B',
  },
  todayBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 18,
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
