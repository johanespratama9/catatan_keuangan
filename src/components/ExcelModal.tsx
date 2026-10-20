import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TransactionWithCategory, Category } from '../types';
import {
  exportToExcel,
  importFromExcel,
  downloadTemplateExcel,
} from '../utils/excelService';
import { colors } from '../utils/colors';

interface ExcelModalProps {
  visible: boolean;
  transactions: TransactionWithCategory[];
  categories: Category[];
  onClose: () => void;
  onDataImported: () => Promise<void>;
}

export const ExcelModal: React.FC<ExcelModalProps> = ({
  visible,
  transactions,
  categories,
  onClose,
  onDataImported,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const handleExport = async () => {
    if (transactions.length === 0) {
      Alert.alert('Perhatian', 'Belum ada transaksi untuk diekspor ke Excel.');
      return;
    }

    try {
      setLoading(true);
      setLoadingText('Membuat file Excel (.xlsx)...');
      await exportToExcel(transactions, categories);
      // Wait a moment then dismiss
      onClose();
    } catch (err: any) {
      Alert.alert('Gagal Ekspor', err.message || 'Terjadi kesalahan saat mengekspor Excel.');
    } finally {
      setLoading(false);
      setLoadingText('');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      setLoadingText('Menyiapkan template Excel...');
      await downloadTemplateExcel();
    } catch (err: any) {
      Alert.alert('Gagal Mengunduh', err.message || 'Gagal membuat file template.');
    } finally {
      setLoading(false);
      setLoadingText('');
    }
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      setLoadingText('Membaca & memproses file Excel...');
      const result = await importFromExcel(onDataImported);

      if (result.success) {
        Alert.alert('Impor Berhasil 🎉', result.message, [
          {
            text: 'OK',
            onPress: () => onClose(),
          },
        ]);
      } else if (result.message !== 'Pemilihan file dibatalkan.') {
        Alert.alert('Gagal Impor', result.message);
      }
    } catch (err: any) {
      Alert.alert('Kesalahan', err.message || 'Terjadi kesalahan saat mengimpor Excel.');
    } finally {
      setLoading(false);
      setLoadingText('');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ekspor & Impor Excel</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'export' && styles.tabBtnActive,
            ]}
            onPress={() => setActiveTab('export')}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={18}
              color={activeTab === 'export' ? '#FFFFFF' : '#64748B'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'export' && styles.tabTextActive,
              ]}
            >
              Ekspor ke Excel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'import' && styles.tabBtnActive,
            ]}
            onPress={() => setActiveTab('import')}
          >
            <Ionicons
              name="cloud-download-outline"
              size={18}
              color={activeTab === 'import' ? '#FFFFFF' : '#64748B'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'import' && styles.tabTextActive,
              ]}
            >
              Impor dari Excel
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {activeTab === 'export' ? (
            /* TAB EXPORT */
            <View style={styles.contentSection}>
              {/* Feature Banner */}
              <View style={styles.bannerCard}>
                <View style={styles.excelIconWrap}>
                  <Ionicons name="document-text" size={36} color="#16A34A" />
                </View>
                <Text style={styles.bannerTitle}>Ekspor Format Microsoft Excel (.xlsx)</Text>
                <Text style={styles.bannerSubtitle}>
                  Data catatan keuangan Anda akan diekspor dalam format spreadsheet (.xlsx) lengkap dengan multi-worksheet: Transaksi, Ringkasan, dan Kategori.
                </Text>
              </View>

              {/* Data Summary Stats */}
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Data yang Siap Diekspor:</Text>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Total Baris Transaksi</Text>
                  <Text style={styles.statVal}>{transactions.length} transaksi</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Jumlah Kategori</Text>
                  <Text style={styles.statVal}>{categories.length} kategori</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Format Output</Text>
                  <Text style={styles.statVal}>.xlsx (Workbook Excel)</Text>
                </View>
              </View>

              {/* Export Action Button */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.exportBtn, loading && styles.btnDisabled]}
                onPress={handleExport}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>
                      Ekspor & Bagikan File Excel
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* TAB IMPORT */
            <View style={styles.contentSection}>
              {/* Feature Banner */}
              <View style={styles.bannerCard}>
                <View style={[styles.excelIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="cloud-download" size={36} color="#2563EB" />
                </View>
                <Text style={styles.bannerTitle}>Impor Data dari Excel</Text>
                <Text style={styles.bannerSubtitle}>
                  Tambahkan atau pulihkan catatan transaksi massal dari file .xlsx, .xls, atau .csv.
                </Text>
              </View>

              {/* Template Download Card */}
              <View style={styles.templateCard}>
                <View style={styles.templateIconCol}>
                  <Ionicons name="bulb-outline" size={24} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.templateTitle}>Belum punya file dengan format yang sesuai?</Text>
                  <Text style={styles.templateSubtitle}>
                    Unduh file template contoh kami untuk melihat susunan kolom yang didukung.
                  </Text>
                  <TouchableOpacity
                    style={styles.downloadTemplateBtn}
                    onPress={handleDownloadTemplate}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="download-outline" size={16} color="#2563EB" />
                    <Text style={styles.downloadTemplateText}>Unduh Template Excel</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Columns Guide */}
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Kolom yang Didukung:</Text>
                <View style={styles.columnTagRow}>
                  <View style={styles.colTag}><Text style={styles.colTagText}>Tanggal (YYYY-MM-DD)</Text></View>
                  <View style={styles.colTag}><Text style={styles.colTagText}>Tipe (Pengeluaran/Pemasukan)</Text></View>
                  <View style={styles.colTag}><Text style={styles.colTagText}>Kategori</Text></View>
                  <View style={styles.colTag}><Text style={styles.colTagText}>Nominal (Angka)</Text></View>
                  <View style={styles.colTag}><Text style={styles.colTagText}>Catatan</Text></View>
                </View>
                <Text style={styles.subGuideNote}>
                  * Kategori yang belum ada di aplikasi akan dibuatkan secara otomatis.
                </Text>
              </View>

              {/* Import Action Button */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.importBtn, loading && styles.btnDisabled]}
                onPress={handleImport}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="folder-open-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>
                      Pilih File Excel & Impor Sekarang
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {loading && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingOverlayText}>{loadingText}</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  tabSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#1E293B',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentSection: {
    gap: 16,
  },
  bannerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  excelIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  statVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  exportBtn: {
    backgroundColor: '#16A34A', // Excel Green
  },
  importBtn: {
    backgroundColor: '#2563EB', // Blue
  },
  btnDisabled: {
    opacity: 0.6,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  templateCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    gap: 12,
  },
  templateIconCol: {
    paddingTop: 2,
  },
  templateTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  templateSubtitle: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
    marginBottom: 8,
  },
  downloadTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  downloadTemplateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  columnTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  colTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  colTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  subGuideNote: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 4,
  },
  loadingOverlay: {
    alignItems: 'center',
    marginVertical: 12,
  },
  loadingOverlayText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
});
