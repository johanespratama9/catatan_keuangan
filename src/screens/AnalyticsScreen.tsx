import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatChart } from '../components/StatChart';
import { CategoryStat, FinancialSummary, TransactionType } from '../types';
import { formatRupiah } from '../utils/formatters';

interface AnalyticsScreenProps {
  summary: FinancialSummary;
  expenseStats: CategoryStat[];
  incomeStats: CategoryStat[];
  refreshing: boolean;
  onRefresh: () => void;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  summary,
  expenseStats,
  incomeStats,
  refreshing,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');

  // Calculate savings rate
  const savings = summary.totalIncome - summary.totalExpense;
  const savingsRate =
    summary.totalIncome > 0
      ? Math.max(0, Math.min(100, (savings / summary.totalIncome) * 100))
      : 0;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analisis & Statistik</Text>
        <Text style={styles.headerSubtitle}>
          Pantau arus kas dan alokasi dana Anda
        </Text>
      </View>

      {/* Cash Flow Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Arus Kas Keseluruhan</Text>

        <View style={styles.flowRow}>
          <View style={styles.flowCol}>
            <Text style={styles.flowLabel}>Total Masuk</Text>
            <Text style={styles.incomeAmount}>
              +{formatRupiah(summary.totalIncome)}
            </Text>
          </View>

          <View style={styles.flowDivider} />

          <View style={styles.flowCol}>
            <Text style={styles.flowLabel}>Total Keluar</Text>
            <Text style={styles.expenseAmount}>
              -{formatRupiah(summary.totalExpense)}
            </Text>
          </View>
        </View>

        {/* Savings Rate Bar */}
        <View style={styles.savingsBox}>
          <View style={styles.savingsHeader}>
            <Text style={styles.savingsLabel}>Tingkat Tabungan (Surplus)</Text>
            <Text style={styles.savingsValue}>{savingsRate.toFixed(1)}%</Text>
          </View>
          <View style={styles.savingsTrack}>
            <View
              style={[
                styles.savingsFill,
                {
                  width: `${savingsRate}%`,
                  backgroundColor: savings >= 0 ? '#10B981' : '#EF4444',
                },
              ]}
            />
          </View>
          <Text style={styles.netSavingsText}>
            Sisa Bersih: {formatRupiah(savings)}
          </Text>
        </View>
      </View>

      {/* Tab Switcher: Pengeluaran vs Pemasukan */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'expense' && styles.tabExpenseActive,
          ]}
          onPress={() => setActiveTab('expense')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="pie-chart"
            size={18}
            color={activeTab === 'expense' ? '#FFFFFF' : '#EF4444'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'expense' && styles.tabTextActive,
            ]}
          >
            Pengeluaran ({expenseStats.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'income' && styles.tabIncomeActive,
          ]}
          onPress={() => setActiveTab('income')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="trending-up"
            size={18}
            color={activeTab === 'income' ? '#FFFFFF' : '#10B981'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'income' && styles.tabTextActive,
            ]}
          >
            Pemasukan ({incomeStats.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chart Section */}
      <View style={styles.chartWrapper}>
        <StatChart
          stats={activeTab === 'expense' ? expenseStats : incomeStats}
          title={
            activeTab === 'expense'
              ? 'Distribusi Pos Pengeluaran'
              : 'Distribusi Sumber Pemasukan'
          }
          emptyMessage={`Belum ada catatan ${
            activeTab === 'expense' ? 'pengeluaran' : 'pemasukan'
          } untuk dianalisis.`}
        />
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 14,
  },
  flowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  flowCol: {
    flex: 1,
  },
  flowDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  flowLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },
  savingsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  savingsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  savingsValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  savingsTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  savingsFill: {
    height: '100%',
    borderRadius: 4,
  },
  netSavingsText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'right',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  tabExpenseActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  tabIncomeActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  chartWrapper: {
    paddingHorizontal: 16,
  },
});
