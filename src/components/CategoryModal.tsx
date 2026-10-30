import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Category, TransactionType } from '../types';
import { defaultPalette } from '../utils/colors';
import { getCategoryTransactionCount } from '../database/categoryRepo';

interface CategoryModalProps {
  visible: boolean;
  initialCategory?: Category | null;
  defaultType?: TransactionType;
  onClose: () => void;
  onSave: (data: {
    name: string;
    icon: string;
    color: string;
    type: TransactionType;
  }) => Promise<void>;
  onDelete?: (id: number) => Promise<boolean>;
}

const AVAILABLE_ICONS = [
  'fast-food', 'car', 'cart', 'receipt', 'game-controller', 'medkit',
  'school', 'home', 'cash', 'gift', 'briefcase', 'trending-up',
  'heart', 'airplane', 'fitness', 'cafe', 'shirt', 'paw',
  'book', 'film', 'construct', 'bus', 'wallet', 'bulb',
  'shield-checkmark', 'laptop', 'musical-notes', 'pizza',
  'ellipsis-horizontal-circle', 'beer', 'camera', 'desktop',
  'card', 'flower', 'pricetag', 'barbell', 'basket', 'bicycle'
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  visible,
  initialCategory,
  defaultType = 'expense',
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>(defaultType);
  const [selectedIcon, setSelectedIcon] = useState<string>('cart');
  const [selectedColor, setSelectedColor] = useState<string>(defaultPalette[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionCount, setTransactionCount] = useState<number>(0);

  useEffect(() => {
    if (visible) {
      if (initialCategory) {
        setName(initialCategory.name);
        setType(initialCategory.type);
        setSelectedIcon(initialCategory.icon);
        setSelectedColor(initialCategory.color);

        getCategoryTransactionCount(initialCategory.id)
          .then((count) => setTransactionCount(count))
          .catch(() => setTransactionCount(0));
      } else {
        setName('');
        setType(defaultType);
        setSelectedIcon(defaultType === 'income' ? 'cash' : 'cart');
        setSelectedColor(defaultPalette[0]);
        setTransactionCount(0);
      }
    }
  }, [visible, initialCategory, defaultType]);

  const handleTypeSelect = (newType: TransactionType) => {
    if (initialCategory && transactionCount > 0 && newType !== type) {
      Alert.alert(
        'Tipe Tidak Dapat Diubah',
        `Kategori ini sudah digunakan dalam ${transactionCount} transaksi. Mengubah tipe transaksi dapat merusak riwayat keuangan Anda.`
      );
      return;
    }
    setType(newType);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Perhatian', 'Nama kategori tidak boleh kosong.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
        type,
      });
      setName('');
      onClose();
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Tidak dapat menyimpan kategori.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!initialCategory || !onDelete) return;

    if (initialCategory.is_default === 1) {
      Alert.alert('Perhatian', 'Kategori bawaan sistem tidak dapat dihapus.');
      return;
    }

    Alert.alert(
      'Hapus Kategori',
      `Apakah Anda yakin ingin menghapus kategori "${initialCategory.name}"? Catatan transaksi dengan kategori ini juga akan terhapus.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            const success = await onDelete(initialCategory.id);
            if (success) {
              onClose();
            } else {
              Alert.alert('Gagal', 'Kategori tidak dapat dihapus.');
            }
          },
        },
      ]
    );
  };

  // Ensure current icon and color are present in palettes
  const displayIcons = AVAILABLE_ICONS.includes(selectedIcon)
    ? AVAILABLE_ICONS
    : [selectedIcon, ...AVAILABLE_ICONS];

  const displayColors = defaultPalette.includes(selectedColor)
    ? defaultPalette
    : [selectedColor, ...defaultPalette];

  const isEditing = Boolean(initialCategory);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isEditing ? 'Edit Kategori' : 'Kategori Baru'}
            </Text>
            {isEditing && initialCategory?.is_default === 0 && onDelete ? (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 36 }} />
            )}
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* System Category Note if Default */}
            {isEditing && initialCategory?.is_default === 1 && (
              <View style={styles.systemNotice}>
                <Ionicons name="information-circle" size={18} color="#2563EB" />
                <Text style={styles.systemNoticeText}>
                  Kategori bawaan sistem. Anda dapat menyesuaikan nama, ikon, dan warna sesuai kebutuhan.
                </Text>
              </View>
            )}

            {/* Type Selector */}
            <View style={styles.typeSection}>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    type === 'expense' && styles.typeBtnExpenseActive,
                    isEditing && transactionCount > 0 && type !== 'expense' && styles.typeBtnDisabled,
                  ]}
                  onPress={() => handleTypeSelect('expense')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      type === 'expense' && styles.typeBtnTextActive,
                    ]}
                  >
                    Pengeluaran
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    type === 'income' && styles.typeBtnIncomeActive,
                    isEditing && transactionCount > 0 && type !== 'income' && styles.typeBtnDisabled,
                  ]}
                  onPress={() => handleTypeSelect('income')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      type === 'income' && styles.typeBtnTextActive,
                    ]}
                  >
                    Pemasukan
                  </Text>
                </TouchableOpacity>
              </View>

              {isEditing && transactionCount > 0 && (
                <View style={styles.typeLockedRow}>
                  <Ionicons name="lock-closed" size={13} color="#94A3B8" />
                  <Text style={styles.typeLockedText}>
                    Tipe terkunci karena digunakan dalam {transactionCount} transaksi
                  </Text>
                </View>
              )}
            </View>

            {/* Name Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Nama Kategori</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: Belanja Online, Asuransi, dsb."
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
                autoFocus={!isEditing}
              />
            </View>

            {/* Icon Selector */}
            <View style={styles.section}>
              <Text style={styles.label}>Pilih Ikon</Text>
              <View style={styles.iconGrid}>
                {displayIcons.map((icon) => {
                  const isSelected = selectedIcon === icon;
                  return (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconBox,
                        isSelected && {
                          backgroundColor: selectedColor,
                          borderColor: selectedColor,
                        },
                      ]}
                      onPress={() => setSelectedIcon(icon)}
                    >
                      <Ionicons
                        name={icon as any}
                        size={22}
                        color={isSelected ? '#FFFFFF' : '#475569'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Color Selector */}
            <View style={styles.section}>
              <Text style={styles.label}>Pilih Warna</Text>
              <View style={styles.colorGrid}>
                {displayColors.map((color) => {
                  const isSelected = selectedColor === color;
                  return (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: color },
                        isSelected && styles.colorCircleSelected,
                      ]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Preview */}
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Pratinjau Kategori:</Text>
              <View style={styles.previewBadge}>
                <View
                  style={[
                    styles.previewIconWrap,
                    { backgroundColor: `${selectedColor}25` },
                  ]}
                >
                  <Ionicons
                    name={selectedIcon as any}
                    size={24}
                    color={selectedColor}
                  />
                </View>
                <Text style={styles.previewName}>{name.trim() || 'Nama Kategori'}</Text>
              </View>
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              <Text style={styles.saveBtnText}>
                {isSubmitting
                  ? 'Menyimpan...'
                  : isEditing
                  ? 'Simpan Perubahan'
                  : 'Simpan Kategori'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeBtn: {
    padding: 6,
  },
  deleteBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  systemNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
    marginBottom: 4,
    gap: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  systemNoticeText: {
    fontSize: 12,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 17,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
  },
  typeSection: {
    marginTop: 14,
    marginBottom: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  typeBtnDisabled: {
    opacity: 0.45,
  },
  typeBtnExpenseActive: {
    backgroundColor: '#EF4444',
  },
  typeBtnIncomeActive: {
    backgroundColor: '#10B981',
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  typeLockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
    gap: 4,
  },
  typeLockedText: {
    fontSize: 11,
    color: '#64748B',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  previewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginTop: 6,
  },
  previewTitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
