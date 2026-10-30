import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { initDatabase } from './src/database/database';
import {
  getTransactions,
  getRecentTransactions,
  getFinancialSummary,
  getCategoryStats,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from './src/database/transactionRepo';
import {
  getCategories,
  createCategory,
  deleteCategory,
} from './src/database/categoryRepo';

import {
  Category,
  CategoryStat,
  FinancialSummary,
  TransactionType,
  TransactionWithCategory,
} from './src/types';

import { HomeScreen } from './src/screens/HomeScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { CategoriesScreen } from './src/screens/CategoriesScreen';
import { TransactionModal } from './src/components/TransactionModal';
import { CategoryModal } from './src/components/CategoryModal';
import { ExcelModal } from './src/components/ExcelModal';
import { colors } from './src/utils/colors';

type TabType = 'home' | 'transactions' | 'analytics' | 'categories';

function MainApp() {
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [refreshing, setRefreshing] = useState(false);
  const [transactionPeriodFilter, setTransactionPeriodFilter] = useState<'all' | 'today' | 'month'>('all');

  // Core Data States
  const [summary, setSummary] = useState<FinancialSummary>({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
  });
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenseStats, setExpenseStats] = useState<CategoryStat[]>([]);
  const [incomeStats, setIncomeStats] = useState<CategoryStat[]>([]);

  // Modal States
  const [isTxModalVisible, setIsTxModalVisible] = useState(false);
  const [isCatModalVisible, setIsCatModalVisible] = useState(false);
  const [isExcelModalVisible, setIsExcelModalVisible] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<TransactionType>('expense');
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithCategory | null>(null);

  // Load all app data from SQLite
  const loadData = useCallback(async () => {
    try {
      const [
        sumData,
        txList,
        recentList,
        catList,
        expStats,
        incStats,
      ] = await Promise.all([
        getFinancialSummary(),
        getTransactions(),
        getRecentTransactions(5),
        getCategories(),
        getCategoryStats('expense'),
        getCategoryStats('income'),
      ]);

      setSummary(sumData);
      setTransactions(txList);
      setRecentTransactions(recentList);
      setCategories(catList);
      setExpenseStats(expStats);
      setIncomeStats(incStats);
    } catch (error) {
      console.error('Failed to load financial data:', error);
    }
  }, []);

  // Initialize DB on mount
  useEffect(() => {
    const setup = async () => {
      try {
        await initDatabase();
        await loadData();
      } catch (err) {
        console.error('Database setup failed:', err);
      } finally {
        setIsReady(true);
      }
    };
    setup();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Modal Handlers
  const openAddTransaction = (type: TransactionType = 'expense') => {
    setSelectedTransaction(null);
    setModalDefaultType(type);
    setIsTxModalVisible(true);
  };

  const openEditTransaction = (tx: TransactionWithCategory) => {
    setSelectedTransaction(tx);
    setModalDefaultType(tx.type);
    setIsTxModalVisible(true);
  };

  const handleSaveTransaction = async (data: {
    type: TransactionType;
    amount: number;
    categoryId: number;
    date: string;
    note?: string;
  }) => {
    if (selectedTransaction) {
      await updateTransaction(
        selectedTransaction.id,
        data.type,
        data.amount,
        data.categoryId,
        data.date,
        data.note
      );
    } else {
      await createTransaction(
        data.type,
        data.amount,
        data.categoryId,
        data.date,
        data.note
      );
    }
    await loadData();
  };

  const handleDeleteTransaction = async (id: number) => {
    await deleteTransaction(id);
    await loadData();
  };

  const handleSaveCategory = async (data: {
    name: string;
    icon: string;
    color: string;
    type: TransactionType;
  }) => {
    await createCategory(data.name, data.icon, data.color, data.type);
    await loadData();
  };

  const handleDeleteCategory = async (id: number): Promise<boolean> => {
    const success = await deleteCategory(id);
    if (success) {
      await loadData();
    }
    return success;
  };

  if (!isReady) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Menyiapkan Catatan Keuangan...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

        {/* Screen Content */}
        <View style={styles.screenContainer}>
          {activeTab === 'home' && (
            <HomeScreen
              summary={summary}
              allTransactions={transactions}
              recentTransactions={recentTransactions}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              onOpenAddModal={openAddTransaction}
              onSelectTransaction={openEditTransaction}
              onNavigateToTransactions={() => {
                setTransactionPeriodFilter('all');
                setActiveTab('transactions');
              }}
              onNavigateToTodayTransactions={() => {
                setTransactionPeriodFilter('today');
                setActiveTab('transactions');
              }}
              onNavigateToAnalytics={() => setActiveTab('analytics')}
              onNavigateToCategories={() => setActiveTab('categories')}
              onOpenExcelModal={() => setIsExcelModalVisible(true)}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsScreen
              transactions={transactions}
              initialPeriod={transactionPeriodFilter}
              onPeriodChange={setTransactionPeriodFilter}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              onSelectTransaction={openEditTransaction}
              onOpenAddModal={openAddTransaction}
              onOpenExcelModal={() => setIsExcelModalVisible(true)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsScreen
              summary={summary}
              expenseStats={expenseStats}
              incomeStats={incomeStats}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesScreen
              categories={categories}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              onOpenCreateCategory={() => setIsCatModalVisible(true)}
              onDeleteCategory={handleDeleteCategory}
            />
          )}
        </View>

        {/* Bottom Navigation Bar */}
        <SafeAreaView edges={['bottom']} style={styles.bottomNavSafeArea}>
          <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'home' ? 'home' : 'home-outline'}
              size={22}
              color={activeTab === 'home' ? colors.primary : '#94A3B8'}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === 'home' && styles.navLabelActive,
              ]}
            >
              Beranda
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('transactions')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                activeTab === 'transactions'
                  ? 'receipt'
                  : 'receipt-outline'
              }
              size={22}
              color={activeTab === 'transactions' ? colors.primary : '#94A3B8'}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === 'transactions' && styles.navLabelActive,
              ]}
            >
              Transaksi
            </Text>
          </TouchableOpacity>

          {/* Quick Floating Add Button */}
          <TouchableOpacity
            style={styles.addNavButton}
            onPress={() => openAddTransaction('expense')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('analytics')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                activeTab === 'analytics'
                  ? 'pie-chart'
                  : 'pie-chart-outline'
              }
              size={22}
              color={activeTab === 'analytics' ? colors.primary : '#94A3B8'}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === 'analytics' && styles.navLabelActive,
              ]}
            >
              Statistik
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('categories')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                activeTab === 'categories' ? 'grid' : 'grid-outline'
              }
              size={22}
              color={activeTab === 'categories' ? colors.primary : '#94A3B8'}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === 'categories' && styles.navLabelActive,
              ]}
            >
              Kategori
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

        {/* Modals */}
        <TransactionModal
          visible={isTxModalVisible}
          categories={categories}
          initialTransaction={selectedTransaction}
          defaultType={modalDefaultType}
          onClose={() => {
            setIsTxModalVisible(false);
            setSelectedTransaction(null);
          }}
          onSave={handleSaveTransaction}
          onDelete={handleDeleteTransaction}
        />

        <CategoryModal
          visible={isCatModalVisible}
          onClose={() => setIsCatModalVisible(false)}
          onSave={handleSaveCategory}
        />

        <ExcelModal
          visible={isExcelModalVisible}
          transactions={transactions}
          categories={categories}
          onClose={() => setIsExcelModalVisible(false)}
          onDataImported={loadData}
        />
      </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  bottomNavSafeArea: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 6 : 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 3,
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  addNavButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
