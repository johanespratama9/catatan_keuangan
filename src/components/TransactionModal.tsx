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
import DateTimePicker from '@react-native-community/datetimepicker';
import { Category, TransactionType, TransactionWithCategory } from '../types';
import { formatRupiah, toISODateString, formatDate } from '../utils/formatters';
import { colors } from '../utils/colors';

interface TransactionModalProps {
  visible: boolean;
  categories: Category[];
  initialTransaction?: TransactionWithCategory | null;
  defaultType?: TransactionType;
  onClose: () => void;
  onSave: (data: {
    type: TransactionType;
    amount: number;
    categoryId: number;
    date: string;
    note?: string;
  }) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  visible,
  categories,
  initialTransaction,
  defaultType = 'expense',
  onClose,
  onSave,
  onDelete,
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      if (initialTransaction) {
        setType(initialTransaction.type);
        setAmountStr(String(Math.round(initialTransaction.amount)));
        setSelectedCategoryId(initialTransaction.category_id);
        setDate(new Date(initialTransaction.date + 'T00:00:00'));
        setNote(initialTransaction.note || '');
      } else {
        setType(defaultType);
        setAmountStr('');
        setDate(new Date());
        setNote('');
        // Select first matching category
        const firstCat = categories.find((c) => c.type === defaultType);
        setSelectedCategoryId(firstCat ? firstCat.id : null);
      }
    }
  }, [visible, initialTransaction, defaultType, categories]);

  // When type changes, select appropriate default category if current is not of matching type
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const available = categories.filter((c) => c.type === newType);
    const currentStillValid = available.some((c) => c.id === selectedCategoryId);
    if (!currentStillValid && available.length > 0) {
      setSelectedCategoryId(available[0].id);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleAmountChange = (text: string) => {
    // Only numbers
    const cleanNum = text.replace(/[^0-9]/g, '');
    setAmountStr(cleanNum);
  };

  const handleDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const setQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setDate(d);
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amountStr);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Perhatian', 'Mohon masukkan nominal yang valid.');
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert('Perhatian', 'Silakan pilih kategori transaksi.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        type,
        amount: numAmount,
        categoryId: selectedCategoryId,
        date: toISODateString(date),
        note: note.trim() || undefined,
      });
      onClose();
    } catch (error: any) {
      Alert.alert('Kesalahan', error.message || 'Gagal menyimpan transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!initialTransaction || !onDelete) return;

    Alert.alert(
      'Hapus Transaksi',
      'Apakah Anda yakin ingin menghapus catatan transaksi ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await onDelete(initialTransaction.id);
              onClose();
            } catch (err: any) {
              Alert.alert('Gagal', err.message || 'Tidak dapat menghapus transaksi');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const numericVal = parseFloat(amountStr) || 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
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
            {initialTransaction ? 'Edit Catatan' : 'Tambah Catatan'}
          </Text>
          {initialTransaction && onDelete ? (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        <ScrollView
          style={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Expense / Income Toggle */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'expense' && styles.typeButtonExpenseActive,
              ]}
              onPress={() => handleTypeChange('expense')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-up-circle"
                size={20}
                color={type === 'expense' ? '#FFFFFF' : '#EF4444'}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'expense' && styles.typeButtonTextActive,
                ]}
              >
                Pengeluaran
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'income' && styles.typeButtonIncomeActive,
              ]}
              onPress={() => handleTypeChange('income')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-down-circle"
                size={20}
                color={type === 'income' ? '#FFFFFF' : '#10B981'}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'income' && styles.typeButtonTextActive,
                ]}
              >
                Pemasukan
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>Nominal</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencyPrefix}>Rp</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#94A3B8"
                value={amountStr ? parseInt(amountStr, 10).toLocaleString('id-ID') : ''}
                onChangeText={handleAmountChange}
                autoFocus={!initialTransaction}
              />
            </View>
            {numericVal > 0 && (
              <Text style={styles.terbilangPreview}>
                {formatRupiah(numericVal)}
              </Text>
            )}
          </View>

          {/* Category Picker */}
          <View style={styles.inputSection}>
            <View style={styles.labelRow}>
              <Text style={styles.sectionLabel}>Kategori</Text>
              <Text style={styles.subHint}>
                {filteredCategories.length} kategori tersedia
              </Text>
            </View>

            <View style={styles.categoryGrid}>
              {filteredCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryCard,
                      isSelected && {
                        borderColor: cat.color,
                        backgroundColor: `${cat.color}15`,
                      },
                    ]}
                    onPress={() => setSelectedCategoryId(cat.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.catIconWrap,
                        { backgroundColor: isSelected ? cat.color : `${cat.color}20` },
                      ]}
                    >
                      <Ionicons
                        name={(cat.icon as any) || 'pricetag'}
                        size={20}
                        color={isSelected ? '#FFFFFF' : cat.color}
                      />
                    </View>
                    <Text
                      style={[
                        styles.catName,
                        isSelected && { color: cat.color, fontWeight: '700' },
                      ]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Date Picker */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>Tanggal</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#2563EB" />
                <Text style={styles.dateValueText}>
                  {formatDate(toISODateString(date))} ({toISODateString(date)})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickDateBtn,
                  toISODateString(date) === toISODateString(new Date()) &&
                    styles.quickDateBtnActive,
                ]}
                onPress={() => setQuickDate(0)}
              >
                <Text
                  style={[
                    styles.quickDateText,
                    toISODateString(date) === toISODateString(new Date()) &&
                      styles.quickDateTextActive,
                  ]}
                >
                  Hari Ini
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickDateBtn}
                onPress={() => setQuickDate(1)}
              >
                <Text style={styles.quickDateText}>Kemarin</Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date(2035, 11, 31)}
              />
            )}
          </View>

          {/* Note Input */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>Catatan (Opsional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Contoh: Makan siang dengan rekan kerja"
              placeholderTextColor="#94A3B8"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Footer Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              type === 'income' ? styles.submitBtnIncome : styles.submitBtnExpense,
              isSubmitting && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting
                ? 'Menyimpan...'
                : initialTransaction
                ? 'Simpan Perubahan'
                : `Tambah ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'}`}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  body: {
    flex: 1,
    paddingHorizontal: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginTop: 16,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  typeButtonExpenseActive: {
    backgroundColor: '#EF4444',
  },
  typeButtonIncomeActive: {
    backgroundColor: '#10B981',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  inputSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subHint: {
    fontSize: 12,
    color: '#94A3B8',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  currencyPrefix: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    padding: 0,
  },
  terbilangPreview: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  catName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dateValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  quickDateBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  quickDateBtnActive: {
    backgroundColor: '#2563EB',
  },
  quickDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  quickDateTextActive: {
    color: '#FFFFFF',
  },
  noteInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnExpense: {
    backgroundColor: '#EF4444',
  },
  submitBtnIncome: {
    backgroundColor: '#10B981',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
