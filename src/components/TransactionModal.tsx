import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Keyboard,
  LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Category, TransactionType, TransactionWithCategory, Label } from '../types';
import { getAllLabels } from '../database/labelRepo';
import { formatRupiah, toISODateString, formatDate } from '../utils/formatters';
import { colors } from '../utils/colors';
import { useTheme } from '../context/ThemeContext';

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
    labels?: string[];
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
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [customLabelInput, setCustomLabelInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [isNoteFocused, setIsNoteFocused] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [noteLayoutY, setNoteLayoutY] = useState<number>(0);
  const [labelLayoutY, setLabelLayoutY] = useState<number>(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      if (Platform.OS === 'ios') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      if (Platform.OS === 'ios') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setKeyboardHeight(0);
      setIsNoteFocused(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleNoteFocus = () => {
    setIsNoteFocused(true);
    setTimeout(() => {
      if (noteLayoutY > 0) {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, noteLayoutY - 16),
          animated: true,
        });
      }
    }, 120);
  };

  const handleLabelFocus = () => {
    setTimeout(() => {
      if (labelLayoutY > 0) {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, labelLayoutY - 16),
          animated: true,
        });
      }
    }, 120);
  };

  const handleNoteBlur = () => {
    setIsNoteFocused(false);
  };

  useEffect(() => {
    if (visible) {
      // Load all available labels
      getAllLabels().then((labels) => {
        setAllLabels(labels);
      }).catch(() => {});

      if (initialTransaction) {
        setType(initialTransaction.type);
        setAmountStr(String(Math.round(initialTransaction.amount)));
        setSelectedCategoryId(initialTransaction.category_id);
        setDate(new Date(initialTransaction.date + 'T00:00:00'));
        setNote(initialTransaction.note || '');
        setSelectedLabels(initialTransaction.labels || []);
      } else {
        setType(defaultType);
        setAmountStr('');
        setDate(new Date());
        setNote('');
        setSelectedLabels([]);
        // Select first matching category
        const firstCat = categories.find((c) => c.type === defaultType);
        setSelectedCategoryId(firstCat ? firstCat.id : null);
      }
      setCustomLabelInput('');
    }
  }, [visible, initialTransaction, defaultType, categories]);

  const handleToggleLabel = (labelName: string) => {
    const trimmed = labelName.trim();
    if (!trimmed) return;
    setSelectedLabels((prev) => {
      const exists = prev.some((l) => l.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        return prev.filter((l) => l.toLowerCase() !== trimmed.toLowerCase());
      } else {
        return [...prev, trimmed];
      }
    });
  };

  const handleAddCustomLabel = () => {
    const trimmed = customLabelInput.trim();
    if (!trimmed) return;

    setSelectedLabels((prev) => {
      const exists = prev.some((l) => l.toLowerCase() === trimmed.toLowerCase());
      return exists ? prev : [...prev, trimmed];
    });

    setAllLabels((prev) => {
      const exists = prev.some((l) => l.name.toLowerCase() === trimmed.toLowerCase());
      if (exists) return prev;
      return [...prev, { id: Date.now(), name: trimmed }];
    });

    setCustomLabelInput('');
  };

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
        labels: selectedLabels,
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
      statusBarTranslucent
    >
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.card }]}
        edges={['top', 'left', 'right']}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={[styles.container, { backgroundColor: theme.card }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
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
          ref={scrollViewRef}
          style={[styles.body, { backgroundColor: theme.card }]}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: keyboardHeight > 0 ? 120 : 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Expense / Income Toggle */}
          <View
            style={[
              styles.typeSelector,
              { backgroundColor: theme.surfaceSecondary },
            ]}
          >
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
                  {
                    color:
                      type === 'expense' ? '#FFFFFF' : theme.textSecondary,
                  },
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
                  {
                    color:
                      type === 'income' ? '#FFFFFF' : theme.textSecondary,
                  },
                  type === 'income' && styles.typeButtonTextActive,
                ]}
              >
                Pemasukan
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <View style={styles.inputSection}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Nominal
            </Text>
            <View
              style={[
                styles.amountInputRow,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                },
              ]}
            >
              <Text style={[styles.currencyPrefix, { color: theme.textPrimary }]}>
                Rp
              </Text>
              <TextInput
                style={[styles.amountInput, { color: theme.textPrimary }]}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.textMuted}
                value={amountStr ? parseInt(amountStr, 10).toLocaleString('id-ID') : ''}
                onChangeText={handleAmountChange}
                autoFocus={!initialTransaction}
              />
            </View>
            {numericVal > 0 && (
              <Text style={[styles.terbilangPreview, { color: theme.textSecondary }]}>
                {formatRupiah(numericVal)}
              </Text>
            )}
          </View>

          {/* Category Picker */}
          <View style={styles.inputSection}>
            <View style={styles.labelRow}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                Kategori
              </Text>
              <Text style={[styles.subHint, { color: theme.textMuted }]}>
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
                      {
                        backgroundColor: theme.surfaceSecondary,
                        borderColor: theme.border,
                      },
                      isSelected && {
                        borderColor: cat.color,
                        backgroundColor: `${cat.color}20`,
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
                        { color: theme.textPrimary },
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
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Tanggal</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[
                  styles.dateSelector,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                <Text
                  style={[styles.dateValueText, { color: theme.textPrimary }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {`${date.getDate()} ${[
                    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
                  ][date.getMonth()]} ${date.getFullYear()}`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickDateBtn,
                  { backgroundColor: theme.surfaceSecondary },
                  toISODateString(date) === toISODateString(new Date()) && [
                    styles.quickDateBtnActive,
                    { backgroundColor: theme.primary },
                  ],
                ]}
                onPress={() => setQuickDate(0)}
              >
                <Text
                  style={[
                    styles.quickDateText,
                    { color: theme.textSecondary },
                    toISODateString(date) === toISODateString(new Date()) &&
                      styles.quickDateTextActive,
                  ]}
                >
                  Hari Ini
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickDateBtn,
                  { backgroundColor: theme.surfaceSecondary },
                ]}
                onPress={() => setQuickDate(1)}
              >
                <Text style={[styles.quickDateText, { color: theme.textSecondary }]}>Kemarin</Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                themeVariant={isDark ? 'dark' : 'light'}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date(2035, 11, 31)}
              />
            )}
          </View>

          {/* Note Input */}
          <View
            style={styles.inputSection}
            onLayout={(e) => setNoteLayoutY(e.nativeEvent.layout.y)}
          >
            <View style={styles.labelRow}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Catatan (Opsional)</Text>
              {isNoteFocused && (
                <TouchableOpacity
                  onPress={() => Keyboard.dismiss()}
                  style={[
                    styles.dismissBtn,
                    {
                      backgroundColor: isDark
                        ? 'rgba(59, 130, 246, 0.2)'
                        : '#EFF6FF',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-done" size={15} color={theme.primary} />
                  <Text style={[styles.dismissText, { color: theme.primary }]}>Selesai Mengetik</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={[
                styles.noteInput,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.textPrimary,
                },
                isNoteFocused && {
                  borderColor: theme.primary,
                  backgroundColor: theme.card,
                },
              ]}
              placeholder="Contoh: Makan siang dengan rekan kerja"
              placeholderTextColor={theme.textMuted}
              value={note}
              onChangeText={setNote}
              onFocus={handleNoteFocus}
              onBlur={handleNoteBlur}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Label Section */}
          <View
            style={styles.inputSection}
            onLayout={(e) => setLabelLayoutY(e.nativeEvent.layout.y)}
          >
            <View style={styles.labelRow}>
              <View style={styles.labelTitleRow}>
                <Ionicons name="pricetag-outline" size={16} color={theme.textSecondary} />
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Label Transaksi</Text>
              </View>
              {selectedLabels.length > 0 && (
                <View
                  style={[
                    styles.selectedCountBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(59, 130, 246, 0.2)'
                        : '#EFF6FF',
                    },
                  ]}
                >
                  <Text style={[styles.selectedCountText, { color: theme.primary }]}>
                    {selectedLabels.length} dipilih
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.sectionHint, { color: theme.textMuted }]}>
              Pilih label terdaftar atau buat label baru (tanpa batas)
            </Text>

            {/* Custom Label Input */}
            <View style={styles.labelInputRow}>
              <TextInput
                style={[
                  styles.labelTextInput,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="Ketik label baru (misal: Liburan, Proyek)..."
                placeholderTextColor={theme.textMuted}
                value={customLabelInput}
                onChangeText={setCustomLabelInput}
                onSubmitEditing={handleAddCustomLabel}
                onFocus={handleLabelFocus}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[
                  styles.addLabelBtn,
                  { backgroundColor: theme.primary },
                  !customLabelInput.trim() && styles.addLabelBtnDisabled,
                ]}
                onPress={handleAddCustomLabel}
                disabled={!customLabelInput.trim()}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={17} color="#FFFFFF" />
                <Text style={styles.addLabelBtnText}>Tambah</Text>
              </TouchableOpacity>
            </View>

            {/* Chips List */}
            <View style={styles.labelChipsWrap}>
              {allLabels.map((lbl) => {
                const isSelected = selectedLabels.some(
                  (s) => s.toLowerCase() === lbl.name.toLowerCase()
                );
                return (
                  <TouchableOpacity
                    key={lbl.id ? `lbl-${lbl.id}` : `lbl-${lbl.name}`}
                    style={[
                      styles.labelChip,
                      {
                        backgroundColor: theme.surfaceSecondary,
                        borderColor: theme.border,
                        borderWidth: 1,
                      },
                      isSelected && (type === 'income' ? styles.labelChipIncomeSelected : styles.labelChipExpenseSelected),
                    ]}
                    onPress={() => handleToggleLabel(lbl.name)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.labelChipText,
                        { color: theme.textSecondary },
                        isSelected && styles.labelChipTextSelected,
                      ]}
                    >
                      #{lbl.name}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={13}
                        color="#FFFFFF"
                        style={{ marginLeft: 3 }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Footer Submit Button */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.card,
              borderTopColor: theme.border,
              paddingBottom: keyboardHeight > 0 ? 12 : Math.max(insets.bottom, 16),
              marginBottom: keyboardHeight > 0 ? keyboardHeight : 0,
            },
          ]}
        >
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
        </View>
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
  body: {
    flex: 1,
  },
  scrollContent: {
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
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
    minWidth: 0,
  },
  dateValueText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  quickDateBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 10,
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
  noteInputFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  dismissBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
  },
  dismissText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
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
  labelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedCountBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  selectedCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 10,
    marginTop: -2,
  },
  labelInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  labelTextInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  addLabelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addLabelBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  addLabelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  labelChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  labelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  labelChipExpenseSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  labelChipIncomeSelected: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  labelChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  labelChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
