import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Category, TransactionType } from "../types";

interface CategoriesScreenProps {
  categories: Category[];
  refreshing: boolean;
  onRefresh: () => void;
  onOpenCreateCategory: (type?: TransactionType) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: number) => Promise<boolean>;
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({
  categories,
  refreshing,
  onRefresh,
  onOpenCreateCategory,
  onEditCategory,
  onDeleteCategory,
}) => {
  const [activeType, setActiveType] = useState<TransactionType>("expense");

  const filtered = categories.filter((c) => c.type === activeType);

  const handleDelete = (cat: Category) => {
    if (cat.is_default === 1) {
      Alert.alert("Perhatian", "Kategori bawaan sistem tidak dapat dihapus.");
      return;
    }

    Alert.alert(
      "Hapus Kategori",
      `Apakah Anda yakin ingin menghapus kategori "${cat.name}"? Catatan transaksi dengan kategori ini juga akan terhapus.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            const success = await onDeleteCategory(cat.id);
            if (!success) {
              Alert.alert("Gagal", "Kategori tidak dapat dihapus.");
            }
          },
        },
      ],
    );
  };

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
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={styles.headerTitle}>Kelola Kategori</Text>
          <Text style={styles.headerSubtitle}>
            Ketuk kategori untuk mengedit
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => onOpenCreateCategory(activeType)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Baru</Text>
        </TouchableOpacity>
      </View>

      {/* Type Switcher */}
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[
            styles.typeTab,
            activeType === "expense" && styles.typeTabExpenseActive,
          ]}
          onPress={() => setActiveType("expense")}
        >
          <Text
            style={[
              styles.typeTabText,
              activeType === "expense" && styles.typeTabTextActive,
            ]}
          >
            Kategori Pengeluaran
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeTab,
            activeType === "income" && styles.typeTabIncomeActive,
          ]}
          onPress={() => setActiveType("income")}
        >
          <Text
            style={[
              styles.typeTabText,
              activeType === "income" && styles.typeTabTextActive,
            ]}
          >
            Kategori Pemasukan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category List */}
      <View style={styles.categoryList}>
        {filtered.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => onEditCategory(cat)}
          >
            <View
              style={[styles.iconWrap, { backgroundColor: `${cat.color}20` }]}
            >
              <Ionicons
                name={(cat.icon as any) || "pricetag"}
                size={22}
                color={cat.color}
              />
            </View>

            <View style={styles.catInfo}>
              <Text style={styles.catName}>{cat.name}</Text>
              <View style={styles.badgeRow}>
                {cat.is_default === 1 ? (
                  <View style={styles.systemBadge}>
                    <Text style={styles.systemBadgeText}>Bawaan</Text>
                  </View>
                ) : (
                  <View style={styles.customBadge}>
                    <Text style={styles.customBadgeText}>Kustom</Text>
                  </View>
                )}
              </View>
            </View>

            {cat.is_default === 0 && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(cat)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={17} color="#EF4444" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Belum Ada Kategori</Text>
            <Text style={styles.emptySubtitle}>
              Ketuk tombol "+ Baru" untuk menambahkan kategori{" "}
              {activeType === "expense" ? "pengeluaran" : "pemasukan"}.
            </Text>
          </View>
        )}
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  typeSelector: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  typeTabExpenseActive: {
    backgroundColor: "#EF4444",
  },
  typeTabIncomeActive: {
    backgroundColor: "#10B981",
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  typeTabTextActive: {
    color: "#FFFFFF",
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  catInfo: {
    flex: 1,
  },
  catName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  systemBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  systemBadgeText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  customBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  customBadgeText: {
    fontSize: 11,
    color: "#2563EB",
    fontWeight: "600",
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderStyle: "dashed",
    marginTop: 8,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
});
