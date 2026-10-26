import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TransactionItem } from '../components/TransactionItem';
import {
  TransactionWithCategory,
  TransactionType,
} from '../types';
import { formatRupiah, toISODateString } from '../utils/formatters';

interface TransactionsScreenProps {
  transactions: TransactionWithCategory[];
  refreshing: boolean;
  onRefresh: () => void;
  onSelectTransaction: (item: TransactionWithCategory) => void;
  onOpenAddModal: (type: TransactionType) => void;
  onOpenExcelModal?: () => void;
  initialPeriod?: 'all' | 'today' | 'month';
  onPeriodChange?: (period: 'all' | 'today' | 'month') => void;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  transactions,
  refreshing,
  onRefresh,
  onSelectTransaction,
  onOpenAddModal,
  onOpenExcelModal,
  initialPeriod = 'all',
  onPeriodChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'month'>(initialPeriod);

  useEffect(() => {
    if (initialPeriod) {
      setPeriodFilter(initialPeriod);
    }
  }, [initialPeriod]);

  const handlePeriodChange = (period: 'all' | 'today' | 'month') => {
    setPeriodFilter(period);
    onPeriodChange?.(period);
  };

  const todayStr = toISODateString(new Date());
  const currentMonthStr = todayStr.substring(0, 7);

  // Filter transactions in-memory
  const filteredTransactions = transactions.filter((t) => {
    // Period filter
    if (periodFilter === 'today' && t.date !== todayStr) {
      return false;
    }
    if (periodFilter === 'month' && !t.date.startsWith(currentMonthStr)) {
      return false;
    }
    // Type match
    if (filterType !== 'all' && t.type !== filterType) {
      return false;
    }
    // Search match
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const inCategory = t.category_name?.toLowerCase().includes(q);
      const inNote = t.note?.toLowerCase().includes(q);
      return inCategory || inNote;
    }
    return true;
  });

  const totalFilteredIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFilteredExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
        <View style={styles.headerRightGroup}>
          {onOpenExcelModal && (
            <TouchableOpacity
              style={styles.excelBtn}
              onPress={onOpenExcelModal}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text-outline" size={18} color="#16A34A" />
              <Text style={styles.excelBtnText}>Excel</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => onOpenAddModal('expense')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Catat</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari transaksi atau kategori..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Period Filter Chips */}
      <View style={styles.periodChipRow}>
        <TouchableOpacity
          style={[styles.periodChip, periodFilter === 'all' && styles.periodChipActive]}
          onPress={() => handlePeriodChange('all')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.periodChipText,
              periodFilter === 'all' && styles.periodChipTextActive,
            ]}
          >
            Semua Waktu
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.periodChip,
            periodFilter === 'today' && styles.periodChipTodayActive,
          ]}
          onPress={() => handlePeriodChange('today')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="calendar"
            size={13}
            color={periodFilter === 'today' ? '#FFFFFF' : '#EF4444'}
          />
          <Text
            style={[
              styles.periodChipText,
              periodFilter === 'today' && styles.periodChipTextActive,
            ]}
          >
            Hari Ini
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.periodChip,
            periodFilter === 'month' && styles.periodChipMonthActive,
          ]}
          onPress={() => handlePeriodChange('month')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="calendar-outline"
            size={13}
            color={periodFilter === 'month' ? '#FFFFFF' : '#2563EB'}
          />
          <Text
            style={[
              styles.periodChipText,
              periodFilter === 'month' && styles.periodChipTextActive,
            ]}
          >
            Bulan Ini
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterChipRow}>
        <TouchableOpacity
          style={[
            styles.chip,
            filterType === 'all' && styles.chipActive,
          ]}
          onPress={() => setFilterType('all')}
        >
          <Text
            style={[
              styles.chipText,
              filterType === 'all' && styles.chipTextActive,
            ]}
          >
            Semua ({filteredTransactions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            filterType === 'expense' && styles.chipExpenseActive,
          ]}
          onPress={() => setFilterType('expense')}
        >
          <Text
            style={[
              styles.chipText,
              filterType === 'expense' && styles.chipTextActive,
            ]}
          >
            Pengeluaran
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            filterType === 'income' && styles.chipIncomeActive,
          ]}
          onPress={() => setFilterType('income')}
        >
          <Text
            style={[
              styles.chipText,
              filterType === 'income' && styles.chipTextActive,
            ]}
          >
            Pemasukan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Ribbon */}
      <View style={styles.summaryRibbon}>
        <Text style={styles.summaryCount}>
          {periodFilter === 'today'
            ? `Hari Ini (${filteredTransactions.length})`
            : periodFilter === 'month'
            ? `Bulan Ini (${filteredTransactions.length})`
            : `${filteredTransactions.length} Transaksi`}
        </Text>
        <View style={styles.summaryAmounts}>
          {filterType !== 'expense' && (
            <Text style={styles.incomeMiniText}>
              +{formatRupiah(totalFilteredIncome)}
            </Text>
          )}
          {filterType === 'all' && <Text style={styles.separatorMini}>|</Text>}
          {filterType !== 'income' && (
            <Text style={styles.expenseMiniText}>
              -{formatRupiah(totalFilteredExpense)}
            </Text>
          )}
        </View>
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            onPress={onSelectTransaction}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Tidak Ada Transaksi</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Tidak ada transaksi yang sesuai dengan kata kunci pencarian.'
                : 'Belum ada data transaksi yang tersimpan.'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  excelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
  },
  excelBtnText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  periodChipRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  periodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  periodChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  periodChipTodayActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  periodChipMonthActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  periodChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  periodChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterChipRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipExpenseActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  chipIncomeActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  summaryRibbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  summaryCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryAmounts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  incomeMiniText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  expenseMiniText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  separatorMini: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
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
