import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StatChart } from '../components/StatChart';
import { CategoryStat, FinancialSummary, TransactionType } from '../types';
import {
  formatRupiah,
  formatDate,
  getMonthName,
  toISODateString,
} from '../utils/formatters';
import {
  getFinancialSummary,
  getCategoryStats,
} from '../database/transactionRepo';
import { useTheme } from '../context/ThemeContext';

export type AnalyticsFilterType = 'month' | 'year' | 'custom' | 'all';

interface AnalyticsScreenProps {
  summary?: FinancialSummary;
  expenseStats?: CategoryStat[];
  incomeStats?: CategoryStat[];
  refreshing: boolean;
  onRefresh: () => void;
  onOpenThemeModal?: () => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const getDaysInMonth = (year: number, monthIndex: number): number => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

const getMonthRange = (year: number, monthIndex: number) => {
  const monthStr = String(monthIndex + 1).padStart(2, '0');
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const startDate = `${year}-${monthStr}-01`;
  const endDate = `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;
  return { startDate, endDate };
};

const getYearRange = (year: number) => {
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  };
};

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  summary: propSummary,
  expenseStats: propExpenseStats,
  incomeStats: propIncomeStats,
  refreshing,
  onRefresh,
  onOpenThemeModal,
}) => {
  const { theme, isDark, themeMode } = useTheme();
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');

  // Filter States - Default: Bulan Ini
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const [filterType, setFilterType] = useState<AnalyticsFilterType>('month');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Custom Date Range States
  const [customStartDate, setCustomStartDate] = useState<string | null>(null);
  const [customEndDate, setCustomEndDate] = useState<string | null>(null);

  // Modal States
  const [isMonthYearModalVisible, setIsMonthYearModalVisible] = useState(false);
  const [isYearModalVisible, setIsYearModalVisible] = useState(false);
  const [isDateRangeModalVisible, setIsDateRangeModalVisible] = useState(false);

  // Temp states for picker inside modals
  const [tempModalYear, setTempModalYear] = useState<number>(currentYear);
  const [tempStartDate, setTempStartDate] = useState<Date>(new Date(currentYear, currentMonth, 1));
  const [tempEndDate, setTempEndDate] = useState<Date>(now);
  const [activePickerField, setActivePickerField] = useState<'start' | 'end' | null>(null);

  // Loaded Data States
  const [summary, setSummary] = useState<FinancialSummary>(
    propSummary || { totalBalance: 0, totalIncome: 0, totalExpense: 0 }
  );
  const [expenseStats, setExpenseStats] = useState<CategoryStat[]>(propExpenseStats || []);
  const [incomeStats, setIncomeStats] = useState<CategoryStat[]>(propIncomeStats || []);

  // Compute active date boundaries
  const activeDateRange = useMemo(() => {
    if (filterType === 'month') {
      return getMonthRange(selectedYear, selectedMonth);
    }
    if (filterType === 'year') {
      return getYearRange(selectedYear);
    }
    if (filterType === 'custom' && customStartDate && customEndDate) {
      return { startDate: customStartDate, endDate: customEndDate };
    }
    return { startDate: undefined, endDate: undefined };
  }, [filterType, selectedYear, selectedMonth, customStartDate, customEndDate]);

  // Load Filtered Data from SQLite
  const loadFilteredData = useCallback(async () => {
    try {
      const { startDate, endDate } = activeDateRange;
      const sum = await getFinancialSummary(startDate, endDate);
      const exp = await getCategoryStats('expense', startDate, endDate);
      const inc = await getCategoryStats('income', startDate, endDate);

      setSummary(sum);
      setExpenseStats(exp);
      setIncomeStats(inc);
    } catch (err) {
      console.error('Failed to load filtered statistics:', err);
    }
  }, [activeDateRange]);

  useEffect(() => {
    loadFilteredData();
  }, [loadFilteredData, refreshing]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handlePrevYear = () => {
    setSelectedYear((y) => y - 1);
  };

  const handleNextYear = () => {
    setSelectedYear((y) => y + 1);
  };

  const handleResetToCurrentMonth = () => {
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
    setFilterType('month');
  };

  // Custom Date Range Modal Helpers
  const openCustomDateModal = () => {
    if (customStartDate && customEndDate) {
      setTempStartDate(new Date(customStartDate + 'T00:00:00'));
      setTempEndDate(new Date(customEndDate + 'T00:00:00'));
    } else {
      setTempStartDate(new Date(currentYear, currentMonth, 1));
      setTempEndDate(new Date());
    }
    setActivePickerField(null);
    setIsDateRangeModalVisible(true);
  };

  const applyCustomPreset = (preset: 'last7' | 'last30' | 'thisMonth' | 'lastMonth') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (preset === 'last7') {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      setTempStartDate(start);
      setTempEndDate(today);
    } else if (preset === 'last30') {
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      setTempStartDate(start);
      setTempEndDate(today);
    } else if (preset === 'thisMonth') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setTempStartDate(start);
      setTempEndDate(today);
    } else if (preset === 'lastMonth') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      setTempStartDate(start);
      setTempEndDate(end);
    }
    setActivePickerField(null);
  };

  const handleApplyDateRange = () => {
    let start = tempStartDate;
    let end = tempEndDate;
    if (start.getTime() > end.getTime()) {
      const swap = start;
      start = end;
      end = swap;
    }
    setCustomStartDate(toISODateString(start));
    setCustomEndDate(toISODateString(end));
    setFilterType('custom');
    setIsDateRangeModalVisible(false);
  };

  // Savings rate calculation
  const savings = summary.totalIncome - summary.totalExpense;
  const savingsRate =
    summary.totalIncome > 0
      ? Math.max(0, Math.min(100, (savings / summary.totalIncome) * 100))
      : 0;

  // Header Title & Active Period Label
  const periodLabel = useMemo(() => {
    if (filterType === 'month') {
      const isThisMonth = selectedMonth === currentMonth && selectedYear === currentYear;
      return `${MONTH_NAMES[selectedMonth]} ${selectedYear}${isThisMonth ? ' (Bulan Ini)' : ''}`;
    }
    if (filterType === 'year') {
      const isThisYear = selectedYear === currentYear;
      return `Tahun ${selectedYear}${isThisYear ? ' (Tahun Ini)' : ''}`;
    }
    if (filterType === 'custom') {
      if (customStartDate && customEndDate) {
        return `${formatDate(customStartDate)} - ${formatDate(customEndDate)}`;
      }
      return 'Rentang Tanggal';
    }
    return 'Semua Data (Seluruh Waktu)';
  }, [filterType, selectedMonth, selectedYear, currentMonth, currentYear, customStartDate, customEndDate]);

  // Year options for Month/Year & Year modals
  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear - 4; y <= currentYear + 1; y++) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Analisis & Statistik
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Pantau arus kas dan alokasi dana Anda
          </Text>
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

      {/* ======================================================== */}
      {/* FILTER CONTROL CARD (Bulan Ini, Per Bulan, Per Tahun, dll) */}
      {/* ======================================================== */}
      <View
        style={[
          styles.filterCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        {/* Horizontal Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {/* Pill 1: Bulanan (Default: Bulan Ini) */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              {
                backgroundColor: theme.surfaceSecondary,
                borderColor: theme.border,
              },
              filterType === 'month' && [
                styles.filterPillActive,
                {
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                },
              ],
            ]}
            onPress={() => {
              setFilterType('month');
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="calendar"
              size={14}
              color={filterType === 'month' ? '#FFFFFF' : theme.textSecondary}
            />
            <Text
              style={[
                styles.filterPillText,
                {
                  color: filterType === 'month' ? '#FFFFFF' : theme.textSecondary,
                  fontWeight: filterType === 'month' ? '700' : '600',
                },
              ]}
            >
              {selectedMonth === currentMonth && selectedYear === currentYear
                ? 'Bulan Ini'
                : `${MONTH_NAMES[selectedMonth].slice(0, 3)} ${selectedYear}`}
            </Text>
          </TouchableOpacity>

          {/* Pill 2: Tahunan */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              {
                backgroundColor: theme.surfaceSecondary,
                borderColor: theme.border,
              },
              filterType === 'year' && [
                styles.filterPillActive,
                {
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                },
              ],
            ]}
            onPress={() => {
              setFilterType('year');
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="calendar-outline"
              size={14}
              color={filterType === 'year' ? '#FFFFFF' : theme.textSecondary}
            />
            <Text
              style={[
                styles.filterPillText,
                {
                  color: filterType === 'year' ? '#FFFFFF' : theme.textSecondary,
                  fontWeight: filterType === 'year' ? '700' : '600',
                },
              ]}
            >
              Tahun {selectedYear}
            </Text>
          </TouchableOpacity>

          {/* Pill 3: Rentang Tanggal Bebas */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              {
                backgroundColor: theme.surfaceSecondary,
                borderColor: theme.border,
              },
              filterType === 'custom' && [
                styles.filterPillActive,
                {
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                },
              ],
            ]}
            onPress={openCustomDateModal}
            activeOpacity={0.7}
          >
            <Ionicons
              name="timer-outline"
              size={14}
              color={filterType === 'custom' ? '#FFFFFF' : theme.textSecondary}
            />
            <Text
              style={[
                styles.filterPillText,
                {
                  color: filterType === 'custom' ? '#FFFFFF' : theme.textSecondary,
                  fontWeight: filterType === 'custom' ? '700' : '600',
                },
              ]}
            >
              {filterType === 'custom' && customStartDate && customEndDate
                ? `${formatDate(customStartDate)} - ${formatDate(customEndDate)}`
                : 'Rentang Tanggal'}
            </Text>
          </TouchableOpacity>

          {/* Pill 4: Semua Data */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              {
                backgroundColor: theme.surfaceSecondary,
                borderColor: theme.border,
              },
              filterType === 'all' && [
                styles.filterPillActive,
                {
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                },
              ],
            ]}
            onPress={() => setFilterType('all')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="infinite-outline"
              size={15}
              color={filterType === 'all' ? '#FFFFFF' : theme.textSecondary}
            />
            <Text
              style={[
                styles.filterPillText,
                {
                  color: filterType === 'all' ? '#FFFFFF' : theme.textSecondary,
                  fontWeight: filterType === 'all' ? '700' : '600',
                },
              ]}
            >
              Semua Data
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Sub-Navigator Bar for Month / Year */}
        {filterType === 'month' && (
          <View
            style={[
              styles.navigatorBar,
              {
                backgroundColor: theme.surfaceSecondary,
                borderColor: theme.border,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.navChevron}
              onPress={handlePrevMonth}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color={theme.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCenterBtn}
              onPress={() => {
                setTempModalYear(selectedYear);
                setIsMonthYearModalVisible(true);
              }}
              activeOpacity={0.75}
            >
              <Ionicons name="calendar" size={16} color={theme.primary} />
              <Text style={[styles.navCenterText, { color: theme.textPrimary }]}>
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </Text>
              <Ionicons name="chevron-down" size={14} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navChevron}
              onPress={handleNextMonth}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={18} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        )}

        {filterType === 'year' && (
          <View
            style={[
              styles.navigatorBar,
              {
                backgroundColor: theme.surfaceSecondary,
                borderColor: theme.border,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.navChevron}
              onPress={handlePrevYear}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color={theme.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCenterBtn}
              onPress={() => setIsYearModalVisible(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="calendar-outline" size={16} color={theme.primary} />
              <Text style={[styles.navCenterText, { color: theme.textPrimary }]}>
                Tahun {selectedYear}
              </Text>
              <Ionicons name="chevron-down" size={14} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navChevron}
              onPress={handleNextYear}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={18} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        )}

        {filterType === 'custom' && (
          <TouchableOpacity
            style={[
              styles.navigatorBar,
              {
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE',
              },
            ]}
            onPress={openCustomDateModal}
            activeOpacity={0.75}
          >
            <Ionicons name="calendar" size={16} color={theme.primary} />
            <Text
              style={[styles.customBannerText, { color: theme.primary }]}
              numberOfLines={1}
            >
              {customStartDate && customEndDate
                ? `${formatDate(customStartDate)} - ${formatDate(customEndDate)}`
                : 'Pilih Rentang Tanggal'}
            </Text>
            <Text style={[styles.customChangeText, { color: theme.primary }]}>
              Ubah
            </Text>
          </TouchableOpacity>
        )}

        {filterType === 'all' && (
          <View
            style={[
              styles.navigatorBar,
              {
                backgroundColor: theme.surfaceSecondary,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons name="infinite" size={16} color={theme.primary} />
            <Text style={[styles.navCenterText, { color: theme.textSecondary, flex: 1, textAlign: 'center' }]}>
              Menghitung Akumulasi Seluruh Data Transaksi
            </Text>
          </View>
        )}
      </View>

      {/* Cash Flow Summary Card */}
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.summaryTitle, { color: theme.textPrimary }]}>
            Arus Kas
          </Text>
          <View
            style={[
              styles.periodBadge,
              {
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF',
                borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : '#DBEAFE',
              },
            ]}
          >
            <Text style={[styles.periodBadgeText, { color: theme.primary }]}>
              {periodLabel}
            </Text>
          </View>
        </View>

        <View style={styles.flowRow}>
          <View style={styles.flowCol}>
            <Text style={[styles.flowLabel, { color: theme.textSecondary }]}>
              Total Masuk
            </Text>
            <Text style={styles.incomeAmount}>
              +{formatRupiah(summary.totalIncome)}
            </Text>
          </View>

          <View
            style={[styles.flowDivider, { backgroundColor: theme.border }]}
          />

          <View style={styles.flowCol}>
            <Text style={[styles.flowLabel, { color: theme.textSecondary }]}>
              Total Keluar
            </Text>
            <Text style={styles.expenseAmount}>
              -{formatRupiah(summary.totalExpense)}
            </Text>
          </View>
        </View>

        {/* Savings Rate Bar */}
        <View
          style={[
            styles.savingsBox,
            {
              backgroundColor: theme.surfaceSecondary,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.savingsHeader}>
            <Text style={[styles.savingsLabel, { color: theme.textSecondary }]}>
              Tingkat Tabungan (Surplus)
            </Text>
            <Text style={[styles.savingsValue, { color: theme.textPrimary }]}>
              {savingsRate.toFixed(1)}%
            </Text>
          </View>
          <View
            style={[styles.savingsTrack, { backgroundColor: theme.border }]}
          >
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
          <Text style={[styles.netSavingsText, { color: theme.textSecondary }]}>
            Sisa Bersih: {formatRupiah(savings)}
          </Text>
        </View>
      </View>

      {/* Tab Switcher: Pengeluaran vs Pemasukan */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            {
              backgroundColor:
                activeTab === 'expense' ? '#EF4444' : theme.card,
              borderColor:
                activeTab === 'expense' ? '#EF4444' : theme.border,
            },
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
              {
                color:
                  activeTab === 'expense' ? '#FFFFFF' : theme.textSecondary,
              },
            ]}
          >
            Pengeluaran ({expenseStats.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            {
              backgroundColor:
                activeTab === 'income' ? '#10B981' : theme.card,
              borderColor:
                activeTab === 'income' ? '#10B981' : theme.border,
            },
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
              {
                color:
                  activeTab === 'income' ? '#FFFFFF' : theme.textSecondary,
              },
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
          } pada periode ${periodLabel.toLowerCase()}.`}
        />
      </View>

      <View style={{ height: 120 }} />

      {/* ======================================================== */}
      {/* 1. MONTH & YEAR PICKER MODAL                             */}
      {/* ======================================================== */}
      <Modal
        visible={isMonthYearModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMonthYearModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  Pilih Bulan & Tahun
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Pilih periode bulanan untuk melihat statistik
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: theme.surfaceSecondary }]}
                onPress={() => setIsMonthYearModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Year Selector in Modal */}
            <View
              style={[
                styles.modalYearSelector,
                {
                  backgroundColor: theme.surfaceSecondary,
                  borderColor: theme.border,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => setTempModalYear((y) => y - 1)}
                style={styles.modalYearChevron}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
              </TouchableOpacity>

              <Text style={[styles.modalYearText, { color: theme.textPrimary }]}>
                {tempModalYear}
              </Text>

              <TouchableOpacity
                onPress={() => setTempModalYear((y) => y + 1)}
                style={styles.modalYearChevron}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="chevron-forward" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* 12 Months Grid */}
            <View style={styles.monthGrid}>
              {MONTH_NAMES.map((name, idx) => {
                const isSelected = selectedMonth === idx && selectedYear === tempModalYear;
                const isCurrent = idx === currentMonth && tempModalYear === currentYear;

                return (
                  <TouchableOpacity
                    key={name}
                    style={[
                      styles.monthGridItem,
                      {
                        backgroundColor: theme.surfaceSecondary,
                        borderColor: theme.border,
                      },
                      isSelected && [
                        styles.monthGridItemSelected,
                        {
                          backgroundColor: theme.primary,
                          borderColor: theme.primary,
                        },
                      ],
                    ]}
                    onPress={() => {
                      setSelectedMonth(idx);
                      setSelectedYear(tempModalYear);
                      setFilterType('month');
                      setIsMonthYearModalVisible(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.monthGridText,
                        {
                          color: isSelected ? '#FFFFFF' : theme.textPrimary,
                          fontWeight: isSelected || isCurrent ? '700' : '500',
                        },
                      ]}
                    >
                      {name.slice(0, 3)}
                    </Text>
                    {isCurrent && !isSelected && (
                      <View style={[styles.dotCurrent, { backgroundColor: theme.primary }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick Reset to This Month button */}
            <TouchableOpacity
              style={[
                styles.modalResetToCurrentBtn,
                {
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF',
                  borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : '#BFDBFE',
                },
              ]}
              onPress={() => {
                handleResetToCurrentMonth();
                setIsMonthYearModalVisible(false);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color={theme.primary} />
              <Text style={[styles.modalResetToCurrentText, { color: theme.primary }]}>
                Kembali ke Bulan Ini ({MONTH_NAMES[currentMonth]} {currentYear})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 2. YEAR ONLY PICKER MODAL                                */}
      {/* ======================================================== */}
      <Modal
        visible={isYearModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsYearModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  Pilih Tahun
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Hitung akumulasi statistik sepanjang satu tahun
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: theme.surfaceSecondary }]}
                onPress={() => setIsYearModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.yearGrid}>
              {availableYears.map((yr) => {
                const isSelected = selectedYear === yr && filterType === 'year';
                const isThisYear = yr === currentYear;

                return (
                  <TouchableOpacity
                    key={yr}
                    style={[
                      styles.yearGridItem,
                      {
                        backgroundColor: theme.surfaceSecondary,
                        borderColor: theme.border,
                      },
                      isSelected && [
                        styles.yearGridItemSelected,
                        {
                          backgroundColor: theme.primary,
                          borderColor: theme.primary,
                        },
                      ],
                    ]}
                    onPress={() => {
                      setSelectedYear(yr);
                      setFilterType('year');
                      setIsYearModalVisible(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.yearGridText,
                        {
                          color: isSelected ? '#FFFFFF' : theme.textPrimary,
                          fontWeight: isSelected || isThisYear ? '700' : '600',
                        },
                      ]}
                    >
                      {yr}
                    </Text>
                    {isThisYear && !isSelected && (
                      <Text style={[styles.yearThisTag, { color: theme.primary }]}>
                        Tahun Ini
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 3. CUSTOM DATE RANGE PICKER MODAL                        */}
      {/* ======================================================== */}
      <Modal
        visible={isDateRangeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDateRangeModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.bottomModalContent, { backgroundColor: theme.card }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  Rentang Tanggal Kustom
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Pilih rentang tanggal bebas untuk analisis statistik
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
                  onPress={() => applyCustomPreset('last7')}
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
                  onPress={() => applyCustomPreset('last30')}
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
                  onPress={() => applyCustomPreset('thisMonth')}
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
                  onPress={() => applyCustomPreset('lastMonth')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.presetBtnText, { color: theme.textPrimary }]}>
                    Bulan Lalu
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date Selectors Row */}
            <View style={styles.dateSelectorsRow}>
              {/* Start Date Box */}
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

              {/* End Date Box */}
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

            {/* Inline Native DateTimePicker if active */}
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
                onPress={() => {
                  setFilterType('month');
                  setSelectedMonth(currentMonth);
                  setSelectedYear(currentYear);
                  setIsDateRangeModalVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalResetBtnText, { color: theme.textSecondary }]}>
                  Bulan Ini
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
    </ScrollView>
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
    paddingBottom: 10,
  },
  themeToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

  /* ==================================================== */
  /* FILTER CARD & NAVIGATOR                              */
  /* ==================================================== */
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 14,
    gap: 8,
  },
  filterScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  filterPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  navigatorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  navChevron: {
    padding: 6,
    borderRadius: 8,
  },
  navCenterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  navCenterText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  customBannerText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    marginLeft: 6,
  },
  customChangeText: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  /* ==================================================== */
  /* SUMMARY CARD                                         */
  /* ==================================================== */
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
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  periodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  periodBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
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

  /* ==================================================== */
  /* TAB CONTAINER                                        */
  /* ==================================================== */
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
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  chartWrapper: {
    paddingHorizontal: 16,
  },

  /* ==================================================== */
  /* MODAL STYLES                                         */
  /* ==================================================== */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomModalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalYearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  modalYearChevron: {
    padding: 6,
  },
  modalYearText: {
    fontSize: 16,
    fontWeight: '800',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  monthGridItem: {
    width: '31%',
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  monthGridItemSelected: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  monthGridText: {
    fontSize: 13,
  },
  dotCurrent: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  modalResetToCurrentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalResetToCurrentText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* Year Modal Grid */
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  yearGridItem: {
    width: '48%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  yearGridItemSelected: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  yearGridText: {
    fontSize: 16,
  },
  yearThisTag: {
    fontSize: 10,
    fontWeight: '700',
  },

  /* Date Range Presets */
  presetSection: {
    marginBottom: 16,
  },
  presetHeading: {
    fontSize: 12,
    fontWeight: '700',
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
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateSelectorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  dateBox: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
  },
  dateBoxActive: {
    elevation: 2,
  },
  dateBoxLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dateBoxValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateBoxValueText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dateBoxSubText: {
    fontSize: 10.5,
    marginTop: 2,
    fontWeight: '500',
  },
  pickerContainer: {
    borderRadius: 14,
    padding: 10,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  pickerHint: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalResetBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalApplyBtn: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
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
