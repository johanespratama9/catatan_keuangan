import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryStat } from '../types';
import { formatRupiah } from '../utils/formatters';

interface StatChartProps {
  stats: CategoryStat[];
  title?: string;
  emptyMessage?: string;
}

export const StatChart: React.FC<StatChartProps> = ({
  stats,
  title = 'Distribusi Kategori',
  emptyMessage = 'Belum ada data transaksi pada periode ini',
}) => {
  if (stats.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="pie-chart-outline" size={48} color="#CBD5E1" />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const grandTotal = stats.reduce((acc, curr) => acc + curr.total_amount, 0);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.totalText}>{formatRupiah(grandTotal)}</Text>
      </View>

      {/* Multi-segment stacked progress bar */}
      <View style={styles.stackedBarContainer}>
        {stats.map((item, idx) => (
          <View
            key={`bar-${item.category_id}-${idx}`}
            style={{
              backgroundColor: item.category_color,
              flex: Math.max(item.percentage, 1),
              height: 12,
              borderTopLeftRadius: idx === 0 ? 6 : 0,
              borderBottomLeftRadius: idx === 0 ? 6 : 0,
              borderTopRightRadius: idx === stats.length - 1 ? 6 : 0,
              borderBottomRightRadius: idx === stats.length - 1 ? 6 : 0,
              marginRight: idx < stats.length - 1 ? 2 : 0,
            }}
          />
        ))}
      </View>

      {/* Detail list per category */}
      <View style={styles.list}>
        {stats.map((item) => (
          <View key={item.category_id} style={styles.statRow}>
            {/* Left: Icon & Name */}
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: `${item.category_color}20` },
              ]}
            >
              <Ionicons
                name={(item.category_icon as any) || 'pricetag'}
                size={18}
                color={item.category_color}
              />
            </View>

            <View style={styles.middle}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.category_name}
                </Text>
                <Text style={styles.percentText}>
                  {item.percentage.toFixed(1)}%
                </Text>
              </View>

              {/* Progress bar */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(item.percentage, 100)}%`,
                      backgroundColor: item.category_color,
                    },
                  ]}
                />
              </View>

              <Text style={styles.countText}>{item.count} transaksi</Text>
            </View>

            {/* Right: Amount */}
            <View style={styles.right}>
              <Text style={styles.amount}>{formatRupiah(item.total_amount)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  stackedBarContainer: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
  },
  list: {
    gap: 14,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  middle: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 6,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  countText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 10,
    textAlign: 'center',
  },
});
