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
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

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
  updateCategory,
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
import { ThemeModal } from './src/components/ThemeModal';
import { LiquidGlassTabBar } from './src/components/LiquidGlassTabBar';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { colors } from './src/utils/colors';

type TabType = 'home' | 'transactions' | 'analytics' | 'categories';

function MainApp() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
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
  const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<TransactionType>('expense');
  const [categoryModalDefaultType, setCategoryModalDefaultType] = useState<TransactionType>('expense');
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithCategory | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

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
    labels?: string[];
  }) => {
    if (selectedTransaction) {
      await updateTransaction(
        selectedTransaction.id,
        data.type,
        data.amount,
        data.categoryId,
        data.date,
        data.note,
        data.labels
      );
    } else {
      await createTransaction(
        data.type,
        data.amount,
        data.categoryId,
        data.date,
        data.note,
        data.labels
      );
    }
    await loadData();
  };

  const handleDeleteTransaction = async (id: number) => {
    await deleteTransaction(id);
    await loadData();
  };

  const openAddCategory = (type: TransactionType = 'expense') => {
    setSelectedCategory(null);
    setCategoryModalDefaultType(type);
    setIsCatModalVisible(true);
  };

  const openEditCategory = (cat: Category) => {
    setSelectedCategory(cat);
    setCategoryModalDefaultType(cat.type);
    setIsCatModalVisible(true);
  };

  const handleSaveCategory = async (data: {
    name: string;
    icon: string;
    color: string;
    type: TransactionType;
  }) => {
    if (selectedCategory) {
      await updateCategory(
        selectedCategory.id,
        data.name,
        data.icon,
        data.color,
        data.type
      );
    } else {
      await createCategory(data.name, data.icon, data.color, data.type);
    }
    await loadData();
  };

  const handleDeleteCategory = async (id: number): Promise<boolean> => {
    const success = await deleteCategory(id);
    if (success) {
      if (selectedCategory?.id === id) {
        setIsCatModalVisible(false);
        setSelectedCategory(null);
      }
      await loadData();
    }
    return success;
  };

  if (!isReady) {
    return (
      <SafeAreaView
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
        edges={['top', 'bottom', 'left', 'right']}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Menyiapkan Catatan Keuangan...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.card }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Screen Content */}
      <View
        style={[styles.screenContainer, { backgroundColor: theme.background }]}
      >
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
            onOpenThemeModal={() => setIsThemeModalVisible(true)}
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
            onOpenThemeModal={() => setIsThemeModalVisible(true)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsScreen
            summary={summary}
            expenseStats={expenseStats}
            incomeStats={incomeStats}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onOpenThemeModal={() => setIsThemeModalVisible(true)}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesScreen
            categories={categories}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onOpenCreateCategory={openAddCategory}
            onEditCategory={openEditCategory}
            onDeleteCategory={handleDeleteCategory}
            onOpenThemeModal={() => setIsThemeModalVisible(true)}
          />
        )}
      </View>

      {/* Apple Music & WhatsApp Liquid Glass Floating Dock */}
      <LiquidGlassTabBar
        activeTab={activeTab}
        onTabPress={setActiveTab}
        bottomInset={insets.bottom}
      />

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
        initialCategory={selectedCategory}
        defaultType={categoryModalDefaultType}
        onClose={() => {
          setIsCatModalVisible(false);
          setSelectedCategory(null);
        }}
        onSave={handleSaveCategory}
        onDelete={handleDeleteCategory}
      />

      <ExcelModal
        visible={isExcelModalVisible}
        transactions={transactions}
        categories={categories}
        onClose={() => setIsExcelModalVisible(false)}
        onDataImported={loadData}
      />

      <ThemeModal
        visible={isThemeModalVisible}
        onClose={() => setIsThemeModalVisible(false)}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
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
});
