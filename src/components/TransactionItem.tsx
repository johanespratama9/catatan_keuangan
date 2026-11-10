import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TransactionWithCategory } from '../types';
import { formatRupiah, formatDate } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

interface TransactionItemProps {
  transaction: TransactionWithCategory;
  onPress: (transaction: TransactionWithCategory) => void;
  onDelete?: (transaction: TransactionWithCategory) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onPress,
}) => {
  const { theme, isDark } = useTheme();
  const isIncome = transaction.type === 'income';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
      onPress={() => onPress(transaction)}
      activeOpacity={0.7}
    >
      {/* Category Icon */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: transaction.category_color
              ? `${transaction.category_color}20`
              : theme.surfaceSecondary,
          },
        ]}
      >
        <Ionicons
          name={(transaction.category_icon as any) || 'receipt-outline'}
          size={22}
          color={transaction.category_color || theme.primary}
        />
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text
          style={[styles.categoryName, { color: theme.textPrimary }]}
          numberOfLines={1}
        >
          {transaction.category_name}
        </Text>
        <View style={styles.subRow}>
          <Text style={[styles.dateText, { color: theme.textSecondary }]}>
            {formatDate(transaction.date)}
          </Text>
          {transaction.note ? (
            <>
              <Text style={[styles.dot, { color: theme.textMuted }]}>•</Text>
              <Text
                style={[styles.noteText, { color: theme.textMuted }]}
                numberOfLines={1}
              >
                {transaction.note}
              </Text>
            </>
          ) : null}
        </View>

        {transaction.labels && transaction.labels.length > 0 && (
          <View style={styles.labelRow}>
            {transaction.labels.map((lbl, idx) => (
              <View
                key={idx}
                style={[
                  styles.itemLabelBadge,
                  { backgroundColor: theme.surfaceSecondary },
                ]}
              >
                <Text
                  style={[styles.itemLabelText, { color: theme.textSecondary }]}
                >
                  #{lbl}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Amount */}
      <View style={styles.amountContainer}>
        <Text
          style={[
            styles.amountText,
            isIncome
              ? { color: isDark ? '#34D399' : '#059669' }
              : { color: isDark ? '#F87171' : '#DC2626' },
          ]}
        >
          {isIncome ? '+' : '-'} {formatRupiah(transaction.amount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
  },
  dot: {
    fontSize: 12,
    color: '#94A3B8',
    marginHorizontal: 5,
  },
  noteText: {
    fontSize: 12,
    color: '#94A3B8',
    flexShrink: 1,
  },
  amountContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
  },
  incomeText: {
    color: '#059669',
  },
  expenseText: {
    color: '#DC2626',
  },
  labelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  itemLabelBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  itemLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
});
