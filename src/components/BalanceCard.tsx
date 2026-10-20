import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FinancialSummary } from '../types';
import { formatRupiah } from '../utils/formatters';
import { colors } from '../utils/colors';

interface BalanceCardProps {
  summary: FinancialSummary;
  periodLabel?: string;
  onPressPeriod?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  summary,
  periodLabel = 'Bulan Ini',
  onPressPeriod,
}) => {
  return (
    <View style={styles.container}>
      {/* Header card with period */}
      <View style={styles.topRow}>
        <Text style={styles.label}>Total Saldo</Text>
        {onPressPeriod && (
          <TouchableOpacity
            style={styles.periodBadge}
            onPress={onPressPeriod}
            activeOpacity={0.7}
          >
            <Text style={styles.periodText}>{periodLabel}</Text>
            <Ionicons name="chevron-down" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Main Balance */}
      <Text style={styles.balanceText}>{formatRupiah(summary.totalBalance)}</Text>

      {/* Income & Expense Split */}
      <View style={styles.statsContainer}>
        {/* Pemasukan */}
        <View style={styles.statBox}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
            <Ionicons name="arrow-down" size={16} color="#10B981" />
          </View>
          <View style={styles.statTextGroup}>
            <Text style={styles.statLabel}>Pemasukan</Text>
            <Text style={styles.incomeAmount}>+{formatRupiah(summary.totalIncome)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Pengeluaran */}
        <View style={styles.statBox}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
            <Ionicons name="arrow-up" size={16} color="#EF4444" />
          </View>
          <View style={styles.statTextGroup}>
            <Text style={styles.statLabel}>Pengeluaran</Text>
            <Text style={styles.expenseAmount}>-{formatRupiah(summary.totalExpense)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  periodText: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  balanceText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 14,
    padding: 12,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTextGroup: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 2,
  },
  incomeAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#34D399',
  },
  expenseAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F87171',
  },
});
