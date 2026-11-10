import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TransactionItem } from '../components/TransactionItem';
import {
  TransactionWithCategory,
  TransactionType,
  Label,
} from '../types';
import { getAllLabels } from '../database/labelRepo';
import { formatRupiah, toISODateString, formatDate } from '../utils/formatters';
import { colors } from '../utils/colors';
import { useTheme } from '../context/ThemeContext';

type PeriodType = 'all' | 'today' | 'month' | 'custom';

interface TransactionsScreenProps {
  transactions: TransactionWithCategory[];
  refreshing: boolean;
  onRefresh: () => void;
  onSelectTransaction: (item: TransactionWithCategory) => void;
  onOpenAddModal: (type: TransactionType) => void;
  onOpenExcelModal?: () => void;
  onOpenThemeModal?: () => void;
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
  onOpenThemeModal,
  initialPeriod = 'all',
  onPeriodChange,
}) => {
  const { theme, isDark, themeMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodType>(initialPeriod);
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [selectedLabelFilter, setSelectedLabelFilter] = useState<string | null>(null);

  // Date Range States
  const [customStartDate, setCustomStartDate] = useState<string | null>(null);
  const [customEndDate, setCustomEndDate] = useState<string | null>(null);
  const [isDateRangeModalVisible, setIsDateRangeModalVisible] = useState(false);

  // Modal Temp Picker States
  const [tempStartDate, setTempStartDate] = useState<Date>(new Date());
  const [tempEndDate, setTempEndDate] = useState<Date>(new Date());
  const [activePickerField, setActivePickerField] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    getAllLabels().then(setAllLabels).catch(() => {});
  }, [refreshing]);

  useEffect(() => {
    if (initialPeriod) {
      setPeriodFilter(initialPeriod);
    }
  }, [initialPeriod]);

  const handlePeriodChange = (period: PeriodType) => {
    setPeriodFilter(period);
    if (period !== 'custom') {
      onPeriodChange?.(period as 'all' | 'today' | 'month');
    }
  };

  const openDateRangeModal = () => {
    if (customStartDate) {
      setTempStartDate(new Date(customStartDate + 'T00:00:00'));
    } else {
      const start = new Date();
      start.setDate(start.getDate() - 6);
      setTempStartDate(start);
    }

    if (customEndDate) {
      setTempEndDate(new Date(customEndDate + 'T00:00:00'));
    } else {
      setTempEndDate(new Date());
    }

    setActivePickerField(null);
    setIsDateRangeModalVisible(true);
  };

  const applyPreset = (preset: 'last7' | 'last30' | 'thisMonth' | 'lastMonth') => {
    const now = new Date();
    if (preset === 'last7') {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      setTempStartDate(start);
      setTempEndDate(end);
    } else if (preset === 'last30') {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29);
      setTempStartDate(start);
      setTempEndDate(end);
    } else if (preset === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date();
      setTempStartDate(start);
      setTempEndDate(end);
    } else if (preset === 'lastMonth') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setTempStartDate(start);
      setTempEndDate(end);
    }
    setActivePickerField(null);
  };

  const handleApplyDateRange = () => {
    const startStr = toISODateString(tempStartDate);
    const endStr = toISODateString(tempEndDate);

    if (startStr > endStr) {
      setCustomStartDate(endStr);
      setCustomEndDate(startStr);
    } else {
      setCustomStartDate(startStr);
      setCustomEndDate(endStr);
    }

    setPeriodFilter('custom');
    setIsDateRangeModalVisible(false);
  };

  const handleResetDateRange = () => {
    setCustomStartDate(null);
    setCustomEndDate(null);
    handlePeriodChange('all');
    setIsDateRangeModalVisible(false);
  };

  const todayStr = toISODateString(new Date());
  const currentMonthStr = todayStr.substring(0, 7);

  // Extract all unique label names from database + current transactions
  const availableLabelNames = Array.from(
    new Set([
      ...allLabels.map((l) => l.name),
      ...transactions.flatMap((t) => t.labels || []),
    ])
  ).filter((n) => Boolean(n) && n.trim().length > 0);

  // Filter transactions in-memory
  const filteredTransactions = transactions.filter((t) => {
    // Period filter
    if (periodFilter === 'today' && t.date !== todayStr) {
      return false;
    }
    if (periodFilter === 'month' && !t.date.startsWith(currentMonthStr)) {
      return false;
    }
    if (periodFilter === 'custom') {
      if (customStartDate && t.date < customStartDate) {
        return false;
      }
      if (customEndDate && t.date > customEndDate) {
        return false;
      }
    }
    // Type match
    if (filterType !== 'all' && t.type !== filterType) {
      return false;
    }
    // Label match
    if (selectedLabelFilter) {
      if (
        !t.labels ||
        !t.labels.some((l) => l.toLowerCase() === selectedLabelFilter.toLowerCase())
      ) {
        return false;
      }
    }
    // Search match
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const inCategory = t.category_name?.toLowerCase().includes(q);
      const inNote = t.note?.toLowerCase().includes(q);
      const inLabels = t.labels?.some((l) => l.toLowerCase().includes(q));
      return inCategory || inNote || inLabels;
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Transaksi</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {filteredTransactions.length} transaksi tercatat
          </Text>
        </View>

        <View style={styles.headerRightGroup}>
          {onOpenThemeModal && (
            <TouchableOpacity
              style={[
                styles.themeBtn,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
              onPress={onOpenThemeModal}
              activeOpacity={0.75}
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

          {onOpenExcelModal && (
            <TouchableOpacity
              style={[
                styles.excelBtn,
                isDark && {
                  backgroundColor: 'rgba(22, 163, 74, 0.15)',
                  borderColor: 'rgba(22, 163, 74, 0.35)',
                },
              ]}
              onPress={onOpenExcelModal}
              activeOpacity={0.75}
            >
              <Ionicons name="document-text" size={19} color="#16A34A" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => onOpenAddModal('expense')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modern Filter Card */}
      <View
        style={[
          styles.filterCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        {/* Search Input */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: theme.surfaceSecondary,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Cari transaksi, catatan, label..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="never"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Unified Segmented Type Selector */}
        <View
          style={[
            styles.typeSegmentedContainer,
            { backgroundColor: theme.surfaceSecondary },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.typeSegmentBtn,
              filterType === 'all' && [
                styles.typeSegmentBtnActive,
                { backgroundColor: theme.card },
              ],
            ]}
            onPress={() => setFilterType('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.typeSegmentText,
                {
                  color:
                    filterType === 'all'
                      ? theme.textPrimary
                      : theme.textSecondary,
                  fontWeight: filterType === 'all' ? '700' : '600',
                },
              ]}
            >
              Semua
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeSegmentBtn,
              filterType === 'expense' && [
                styles.typeSegmentExpenseActive,
                isDark && {
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                },
              ],
            ]}
            onPress={() => setFilterType('expense')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-down-circle"
              size={14}
              color={
                filterType === 'expense'
                  ? '#DC2626'
                  : theme.textSecondary
              }
            />
            <Text
              style={[
                styles.typeSegmentText,
                filterType === 'expense'
                  ? styles.typeSegmentExpenseTextActive
                  : { color: theme.textSecondary },
              ]}
            >
              Pengeluaran
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeSegmentBtn,
              filterType === 'income' && [
                styles.typeSegmentIncomeActive,
                isDark && {
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  borderColor: 'rgba(16, 185, 129, 0.4)',
                },
              ],
            ]}
            onPress={() => setFilterType('income')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-up-circle"
              size={14}
              color={
                filterType === 'income'
                  ? '#16A34A'
                  : theme.textSecondary
              }
            />
            <Text
              style={[
                styles.typeSegmentText,
                filterType === 'income'
                  ? styles.typeSegmentIncomeTextActive
                  : { color: theme.textSecondary },
              ]}
            >
              Pemasukan
            </Text>
          </TouchableOpacity>
        </View>

        {/* Period & Date Range Filter Pills */}
        <View style={styles.periodPillRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.periodScrollContent}
          >
            <TouchableOpacity
              style={[
                styles.periodPill,
                {
                  backgroundColor: theme.surfaceSecondary,
                  borderColor: theme.border,
                },
                periodFilter === 'all' && [
                  styles.periodPillActive,
                  {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  },
                ],
              ]}
              onPress={() => handlePeriodChange('all')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.periodPillText,
                  {
                    color:
                      periodFilter === 'all'
                        ? '#FFFFFF'
                        : theme.textSecondary,
                  },
                  periodFilter === 'all' && styles.periodPillTextActive,
                ]}
              >
                Semua Waktu
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.periodPill,
                {
                  backgroundColor: theme.surfaceSecondary,
                  borderColor: theme.border,
                },
                periodFilter === 'today' && [
                  styles.periodPillActive,
                  {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  },
                ],
              ]}
              onPress={() => handlePeriodChange('today')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="today-outline"
                size={13}
                color={
                  periodFilter === 'today' ? '#FFFFFF' : theme.textSecondary
                }
              />
              <Text
                style={[
                  styles.periodPillText,
                  {
                    color:
                      periodFilter === 'today'
                        ? '#FFFFFF'
                        : theme.textSecondary,
                  },
                  periodFilter === 'today' && styles.periodPillTextActive,
                ]}
              >
                Hari Ini
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.periodPill,
                {
                  backgroundColor: theme.surfaceSecondary,
                  borderColor: theme.border,
                },
                periodFilter === 'month' && [
                  styles.periodPillActive,
                  {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  },
                ],
              ]}
              onPress={() => handlePeriodChange('month')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="calendar-outline"
                size={13}
                color={
                  periodFilter === 'month' ? '#FFFFFF' : theme.textSecondary
                }
              />
              <Text
                style={[
                  styles.periodPillText,
                  {
                    color:
                      periodFilter === 'month'
                        ? '#FFFFFF'
                        : theme.textSecondary,
                  },
                  periodFilter === 'month' && styles.periodPillTextActive,
                ]}
              >
                Bulan Ini
              </Text>
            </TouchableOpacity>

            {/* Custom Date Range Pill */}
            <TouchableOpacity
              style={[
                styles.periodPill,
                {
                  backgroundColor: theme.surfaceSecondary,
                  borderColor: theme.border,
                },
                periodFilter === 'custom' && [
                  styles.periodPillCustomActive,
                  {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  },
                ],
              ]}
              onPress={openDateRangeModal}
              activeOpacity={0.75}
            >
              <Ionicons
                name="calendar"
                size={13}
                color={
                  periodFilter === 'custom' ? '#FFFFFF' : theme.primary
                }
              />
              <Text
                style={[
                  styles.periodPillText,
                  periodFilter === 'custom'
                    ? styles.periodPillTextActive
                    : { color: theme.primary, fontWeight: '600' },
                ]}
              >
                {periodFilter === 'custom' && customStartDate && customEndDate
                  ? `${formatDate(customStartDate)} - ${formatDate(customEndDate)}`
                  : 'Rentang Tanggal'}
              </Text>
              {periodFilter === 'custom' && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleResetDateRange();
                  }}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={{ marginLeft: 3 }}
                >
                  <Ionicons name="close-circle" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Label Filter Chips (if labels exist) */}
        {availableLabelNames.length > 0 && (
          <View
            style={[
              styles.labelSection,
              { borderTopColor: theme.borderLight },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.labelScrollContent}
            >
              <TouchableOpacity
                style={[
                  styles.labelPill,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    borderColor: theme.border,
                  },
                  selectedLabelFilter === null && [
                    styles.labelPillAllActive,
                    {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                    },
                  ],
                ]}
                onPress={() => setSelectedLabelFilter(null)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.labelPillText,
                    {
                      color:
                        selectedLabelFilter === null
                          ? '#FFFFFF'
                          : theme.textSecondary,
                    },
                    selectedLabelFilter === null && styles.labelPillTextActive,
                  ]}
                >
                  Semua Label
                </Text>
              </TouchableOpacity>

              {availableLabelNames.map((name) => {
                const isActive = selectedLabelFilter?.toLowerCase() === name.toLowerCase();
                return (
                  <TouchableOpacity
                    key={name}
                    style={[
                      styles.labelPill,
                      {
                        backgroundColor: theme.surfaceSecondary,
                        borderColor: theme.border,
                      },
                      isActive && [
                        styles.labelPillActive,
                        {
                          backgroundColor: theme.primary,
                          borderColor: theme.primary,
                        },
                      ],
                    ]}
                    onPress={() => setSelectedLabelFilter(isActive ? null : name)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.labelPillText,
                        {
                          color: isActive
                            ? '#FFFFFF'
                            : theme.textSecondary,
                        },
                        isActive && styles.labelPillTextActive,
                      ]}
                    >
                      #{name}
                    </Text>
                    {isActive && (
                      <Ionicons
                        name="close"
                        size={12}
                        color="#FFFFFF"
                        style={{ marginLeft: 2 }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Summary Ribbon */}
      <View
        style={[
          styles.summaryRibbon,
          { backgroundColor: theme.surfaceSecondary },
        ]}
      >
        <View style={styles.summaryLeft}>
          <Text style={[styles.summaryCount, { color: theme.textSecondary }]}>
            {periodFilter === 'today'
              ? `Hari Ini • ${filteredTransactions.length} transaksi`
              : periodFilter === 'month'
              ? `Bulan Ini • ${filteredTransactions.length} transaksi`
              : periodFilter === 'custom' && customStartDate && customEndDate
              ? `${formatDate(customStartDate)} - ${formatDate(customEndDate)} • ${filteredTransactions.length} data`
              : `${filteredTransactions.length} transaksi tercatat`}
          </Text>
          {selectedLabelFilter && (
            <View
              style={[
                styles.activeLabelBadge,
                {
                  backgroundColor: isDark
                    ? 'rgba(59, 130, 246, 0.2)'
                    : '#EFF6FF',
                  borderColor: isDark
                    ? 'rgba(59, 130, 246, 0.4)'
                    : '#DBEAFE',
                },
              ]}
            >
              <Text
                style={[
                  styles.activeLabelBadgeText,
                  { color: theme.primary },
                ]}
              >
                #{selectedLabelFilter}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.summaryAmounts}>
          {filterType !== 'expense' && (
            <View style={styles.incomeBadge}>
              <Text style={styles.incomeMiniText}>
                +{formatRupiah(totalFilteredIncome)}
              </Text>
            </View>
          )}
          {filterType !== 'income' && (
            <View style={styles.expenseBadge}>
              <Text style={styles.expenseMiniText}>
                -{formatRupiah(totalFilteredExpense)}
              </Text>
            </View>
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
          <View
            style={[
              styles.emptyContainer,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons name="document-text-outline" size={44} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Tidak Ada Transaksi</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {searchQuery
                ? 'Tidak ada transaksi yang sesuai dengan kata kunci pencarian.'
                : periodFilter === 'custom'
                ? 'Tidak ada transaksi pada rentang tanggal yang dipilih.'
                : 'Belum ada data transaksi yang tercatat.'}
            </Text>
            {periodFilter === 'custom' && (
              <TouchableOpacity
                style={[
                  styles.emptyResetBtn,
                  {
                    backgroundColor: isDark
                      ? 'rgba(59, 130, 246, 0.2)'
                      : '#EFF6FF',
                    borderColor: isDark
                      ? 'rgba(59, 130, 246, 0.4)'
                      : '#BFDBFE',
                  },
                ]}
                onPress={handleResetDateRange}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.emptyResetBtnText,
                    { color: theme.primary },
                  ]}
                >
                  Reset Rentang Tanggal
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* ======================================================== */}
      {/* DATE RANGE FILTER MODAL                                  */}
      {/* ======================================================== */}
      <Modal
        visible={isDateRangeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDateRangeModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  Rentang Tanggal
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Filter transaksi berdasarkan periode tertentu
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.modalCloseBtn,
                  { backgroundColor: theme.surfaceSecondary },
                ]}
                onPress={() => setIsDateRangeModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Quick Presets */}
            <View style={styles.presetSection}>
              <Text style={[styles.presetHeading, { color: theme.textSecondary }]}>
                Pilihan Cepat
              </Text>
              <View style={styles.presetGrid}>
                <TouchableOpacity
                  style={[
                    styles.presetBtn,
                    {
                      backgroundColor: theme.surfaceSecondary,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => applyPreset('last7')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.presetBtnText, { color: theme.textPrimary }]}>
                    7 Hari Terakhir
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetBtn,
                    {
                      backgroundColor: theme.surfaceSecondary,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => applyPreset('last30')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.presetBtnText, { color: theme.textPrimary }]}>
                    30 Hari Terakhir
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetBtn,
                    {
                      backgroundColor: theme.surfaceSecondary,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => applyPreset('thisMonth')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.presetBtnText, { color: theme.textPrimary }]}>
                    Bulan Ini
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetBtn,
                    {
                      backgroundColor: theme.surfaceSecondary,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => applyPreset('lastMonth')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.presetBtnText, { color: theme.textPrimary }]}>
                    Bulan Lalu
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date Range Selectors */}
            <View style={styles.dateSelectorsRow}>
              {/* Start Date Card */}
              <TouchableOpacity
                style={[
                  styles.dateBox,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    borderColor: theme.border,
                  },
                  activePickerField === 'start' && [
                    styles.dateBoxActive,
                    {
                      borderColor: theme.primary,
                      backgroundColor: isDark
                        ? 'rgba(59, 130, 246, 0.15)'
                        : '#EFF6FF',
                    },
                  ],
                ]}
                onPress={() =>
                  setActivePickerField(activePickerField === 'start' ? null : 'start')
                }
                activeOpacity={0.8}
              >
                <Text style={[styles.dateBoxLabel, { color: theme.textSecondary }]}>
                  Dari Tanggal
                </Text>
                <View style={styles.dateBoxValueRow}>
                  <Ionicons name="calendar-outline" size={17} color={theme.primary} />
                  <Text style={[styles.dateBoxValueText, { color: theme.textPrimary }]}>
                    {formatDate(toISODateString(tempStartDate))}
                  </Text>
                </View>
                <Text style={[styles.dateBoxSubText, { color: theme.textMuted }]}>
                  {toISODateString(tempStartDate)}
                </Text>
              </TouchableOpacity>

              <Ionicons name="arrow-forward" size={18} color={theme.textMuted} />

              {/* End Date Card */}
              <TouchableOpacity
                style={[
                  styles.dateBox,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    borderColor: theme.border,
                  },
                  activePickerField === 'end' && [
                    styles.dateBoxActive,
                    {
                      borderColor: theme.primary,
                      backgroundColor: isDark
                        ? 'rgba(59, 130, 246, 0.15)'
                        : '#EFF6FF',
                    },
                  ],
                ]}
                onPress={() =>
                  setActivePickerField(activePickerField === 'end' ? null : 'end')
                }
                activeOpacity={0.8}
              >
                <Text style={[styles.dateBoxLabel, { color: theme.textSecondary }]}>
                  Sampai Tanggal
                </Text>
                <View style={styles.dateBoxValueRow}>
                  <Ionicons name="calendar-outline" size={17} color={theme.primary} />
                  <Text style={[styles.dateBoxValueText, { color: theme.textPrimary }]}>
                    {formatDate(toISODateString(tempEndDate))}
                  </Text>
                </View>
                <Text style={[styles.dateBoxSubText, { color: theme.textMuted }]}>
                  {toISODateString(tempEndDate)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Inline Native DateTimePicker if opened */}
            {activePickerField !== null && (
              <View
                style={[
                  styles.pickerContainer,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.pickerHint, { color: theme.primary }]}>
                  Pilih {activePickerField === 'start' ? 'Tanggal Awal' : 'Tanggal Akhir'}:
                </Text>
                <DateTimePicker
                  value={activePickerField === 'start' ? tempStartDate : tempEndDate}
                  mode="date"
                  themeVariant={isDark ? 'dark' : 'light'}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, selectedDate) => {
                    if (Platform.OS === 'android') {
                      setActivePickerField(null);
                    }
                    if (selectedDate) {
                      if (activePickerField === 'start') {
                        setTempStartDate(selectedDate);
                      } else {
                        setTempEndDate(selectedDate);
                      }
                    }
                  }}
                  maximumDate={new Date(2035, 11, 31)}
                />
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalResetBtn,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    borderColor: theme.border,
                  },
                ]}
                onPress={handleResetDateRange}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalResetBtnText, { color: theme.textSecondary }]}>
                  Reset
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalApplyBtn, { backgroundColor: theme.primary }]}
                onPress={handleApplyDateRange}
                activeOpacity={0.8}
              >
                <Text style={styles.modalApplyBtnText}>Terapkan Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  excelBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.2,
    borderColor: '#DCFCE7',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 2,
  },

  /* ==================================================== */
  /* UNIFIED MODERN FILTER CARD                           */
  /* ==================================================== */
  filterCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },

  /* Segmented Type Control */
  typeSegmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  typeSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    borderRadius: 8,
    gap: 4,
  },
  typeSegmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  typeSegmentExpenseActive: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  typeSegmentIncomeActive: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  typeSegmentText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  typeSegmentTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  typeSegmentExpenseTextActive: {
    color: '#DC2626',
    fontWeight: '700',
  },
  typeSegmentIncomeTextActive: {
    color: '#16A34A',
    fontWeight: '700',
  },

  /* Period Pills */
  periodPillRow: {
    marginTop: 2,
  },
  periodScrollContent: {
    gap: 6,
  },
  periodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  periodPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  periodPillCustomActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  periodPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* Label Section */
  labelSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  labelScrollContent: {
    gap: 6,
    alignItems: 'center',
  },
  labelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 2,
  },
  labelPillAllActive: {
    backgroundColor: '#334155',
    borderColor: '#334155',
  },
  labelPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  labelPillText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  labelPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* ==================================================== */
  /* SUMMARY RIBBON                                       */
  /* ==================================================== */
  summaryRibbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: '#F1F5F9',
    marginBottom: 6,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  summaryCount: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  activeLabelBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  activeLabelBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryAmounts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  incomeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  incomeMiniText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  expenseBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  expenseMiniText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },

  /* ==================================================== */
  /* LIST & EMPTY STATE                                   */
  /* ==================================================== */
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  emptyResetBtn: {
    marginTop: 14,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  emptyResetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  /* ==================================================== */
  /* DATE RANGE MODAL STYLES                              */
  /* ==================================================== */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Preset Grid */
  presetSection: {
    marginBottom: 16,
  },
  presetHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },

  /* Date Selectors */
  dateSelectorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  dateBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
  },
  dateBoxActive: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
  },
  dateBoxLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dateBoxValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateBoxValueText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  dateBoxSubText: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },

  /* Picker Container */
  pickerContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerHint: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 6,
  },

  /* Modal Actions */
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalResetBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalResetBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  modalApplyBtn: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 2,
  },
  modalApplyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
