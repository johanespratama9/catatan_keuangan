import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { TransactionWithCategory, Category, TransactionType } from '../types';
import { createCategory, getCategories } from '../database/categoryRepo';
import { createTransaction } from '../database/transactionRepo';
import { defaultPalette } from './colors';

export interface ImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  newCategoriesCount: number;
  message: string;
}

/**
 * Export transactions and categories to an Excel (.xlsx) file and trigger share sheet
 */
export const exportToExcel = async (
  transactions: TransactionWithCategory[],
  categories: Category[],
  fileNamePrefix: string = 'Catatan_Keuangan'
): Promise<string> => {
  // 1. Prepare Transactions Sheet data
  const txData = transactions.map((t, idx) => ({
    No: idx + 1,
    Tanggal: t.date,
    Tipe: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    Kategori: t.category_name,
    'Nominal (Rp)': t.amount,
    Catatan: t.note || '',
  }));

  // 2. Prepare Summary Sheet data
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalIncome - totalExpense;

  const todayStr = new Date().toISOString().split('T')[0];

  const summaryData = [
    { Keterangan: 'Tanggal Ekspor', Nilai: todayStr },
    { Keterangan: 'Total Transaksi', Nilai: transactions.length },
    { Keterangan: 'Total Pemasukan (Rp)', Nilai: totalIncome },
    { Keterangan: 'Total Pengeluaran (Rp)', Nilai: totalExpense },
    { Keterangan: 'Saldo Bersih (Rp)', Nilai: totalBalance },
  ];

  // 3. Prepare Categories Sheet data
  const categoryData = categories.map((c) => ({
    ID: c.id,
    'Nama Kategori': c.name,
    Tipe: c.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    Status: c.is_default === 1 ? 'Bawaan' : 'Kustom',
  }));

  // 4. Create Workbook and add worksheets
  const wb = XLSX.utils.book_new();

  const wsTransactions = XLSX.utils.json_to_sheet(txData);
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  const wsCategories = XLSX.utils.json_to_sheet(categoryData);

  // Set column widths for better readability
  wsTransactions['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // Tanggal
    { wch: 14 }, // Tipe
    { wch: 22 }, // Kategori
    { wch: 16 }, // Nominal
    { wch: 35 }, // Catatan
  ];

  wsSummary['!cols'] = [
    { wch: 24 }, // Keterangan
    { wch: 20 }, // Nilai
  ];

  wsCategories['!cols'] = [
    { wch: 6 },  // ID
    { wch: 24 }, // Nama Kategori
    { wch: 16 }, // Tipe
    { wch: 12 }, // Status
  ];

  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Daftar Transaksi');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');
  XLSX.utils.book_append_sheet(wb, wsCategories, 'Kategori');

  // 5. Generate base64 string
  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

  // 6. Save to local app storage
  const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
  const fileName = `${fileNamePrefix}_${todayStr.replace(/-/g, '')}.xlsx`;
  const fileUri = `${baseDir}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, wbout, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // 7. Share file using expo-sharing if available
  const isSharingAvailable = await Sharing.isAvailableAsync();
  if (isSharingAvailable) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Simpan / Bagikan Data Keuangan Excel',
      UTI: 'com.microsoft.excel.xlsx',
    });
  }

  return fileUri;
};

/**
 * Generate a template Excel (.xlsx) file for user to fill and import
 */
export const downloadTemplateExcel = async (): Promise<string> => {
  const templateData = [
    {
      Tanggal: '2026-10-14',
      Tipe: 'Pengeluaran',
      Kategori: 'Makanan & Minuman',
      Nominal: 45000,
      Catatan: 'Makan siang nasi padang',
    },
    {
      Tanggal: '2026-10-14',
      Tipe: 'Pengeluaran',
      Kategori: 'Transportasi',
      Nominal: 20000,
      Catatan: 'Bensin motor',
    },
    {
      Tanggal: '2026-10-14',
      Tipe: 'Pemasukan',
      Kategori: 'Gaji Bulanan',
      Nominal: 7500000,
      Catatan: 'Gaji bulanan kantor',
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateData);

  ws['!cols'] = [
    { wch: 14 }, // Tanggal
    { wch: 14 }, // Tipe
    { wch: 22 }, // Kategori
    { wch: 16 }, // Nominal
    { wch: 35 }, // Catatan
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Template Transaksi');
  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

  const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
  const fileUri = `${baseDir}Template_Import_Keuangan.xlsx`;

  await FileSystem.writeAsStringAsync(fileUri, wbout, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Download Template Excel',
      UTI: 'com.microsoft.excel.xlsx',
    });
  }

  return fileUri;
};

/**
 * Import transactions from an Excel file selected by user
 */
export const importFromExcel = async (
  onSuccessCallback?: () => Promise<void>
): Promise<ImportResult> => {
  try {
    // 1. Pick file
    const pickResult = await DocumentPicker.getDocumentAsync({
      type: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        '*/*',
      ],
      copyToCacheDirectory: true,
    });

    if (pickResult.canceled || !pickResult.assets || pickResult.assets.length === 0) {
      return {
        success: false,
        importedCount: 0,
        skippedCount: 0,
        newCategoriesCount: 0,
        message: 'Pemilihan file dibatalkan.',
      };
    }

    const asset = pickResult.assets[0];
    const fileUri = asset.uri;

    // 2. Read file as base64
    const base64Data = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 3. Parse workbook
    const workbook = XLSX.read(base64Data, { type: 'base64' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        importedCount: 0,
        skippedCount: 0,
        newCategoriesCount: 0,
        message: 'File Excel tidak memiliki lembar kerja (worksheet).',
      };
    }

    // Pick first worksheet or one named "Transaksi" / "Daftar Transaksi"
    const targetSheetName =
      workbook.SheetNames.find(
        (name) =>
          name.toLowerCase().includes('transaksi') ||
          name.toLowerCase().includes('data')
      ) || workbook.SheetNames[0];

    const worksheet = workbook.Sheets[targetSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    if (!rows || rows.length === 0) {
      return {
        success: false,
        importedCount: 0,
        skippedCount: 0,
        newCategoriesCount: 0,
        message: 'Tidak ada baris data transaksi yang ditemukan di file Excel.',
      };
    }

    // 4. Fetch existing categories to map
    let existingCategories = await getCategories();
    let newCategoriesCount = 0;
    let importedCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      // Find keys flexibly
      const keys = Object.keys(row);
      const getKey = (...possibleNames: string[]): string | undefined => {
        return keys.find((k) =>
          possibleNames.some((p) => k.toLowerCase().trim().includes(p.toLowerCase()))
        );
      };

      const dateKey = getKey('tanggal', 'date', 'tgl');
      const typeKey = getKey('tipe', 'type', 'jenis');
      const catKey = getKey('kategori', 'category', 'pos');
      const amountKey = getKey('nominal', 'amount', 'jumlah', 'total');
      const noteKey = getKey('catatan', 'note', 'keterangan', 'deskripsi');

      const rawDate = dateKey ? String(row[dateKey]).trim() : '';
      const rawType = typeKey ? String(row[typeKey]).toLowerCase().trim() : '';
      const rawCat = catKey ? String(row[catKey]).trim() : 'Lain-lain';
      const rawAmount = amountKey ? String(row[amountKey]) : '';
      const rawNote = noteKey ? String(row[noteKey]).trim() : '';

      // Clean amount: remove "Rp", ".", ",", spaces
      const cleanAmountNum = parseFloat(
        rawAmount.replace(/[^0-9.-]+/g, '').replace(',', '.')
      );

      if (isNaN(cleanAmountNum) || cleanAmountNum <= 0) {
        skippedCount++;
        continue;
      }

      // Determine type
      let txType: TransactionType = 'expense';
      if (
        rawType.includes('masuk') ||
        rawType.includes('income') ||
        rawType.includes('pemasukan')
      ) {
        txType = 'income';
      }

      // Parse date: support YYYY-MM-DD or DD/MM/YYYY or excel serial numbers
      let formattedDate = new Date().toISOString().split('T')[0];
      if (rawDate) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          formattedDate = rawDate;
        } else if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}$/.test(rawDate)) {
          const parts = rawDate.split(/[\/\-\.]/);
          // Assuming DD/MM/YYYY
          const d = parts[0].padStart(2, '0');
          const m = parts[1].padStart(2, '0');
          const y = parts[2];
          formattedDate = `${y}-${m}-${d}`;
        } else {
          const parsed = new Date(rawDate);
          if (!isNaN(parsed.getTime())) {
            formattedDate = parsed.toISOString().split('T')[0];
          }
        }
      }

      // Find or create category
      let category = existingCategories.find(
        (c) =>
          c.name.toLowerCase().trim() === rawCat.toLowerCase().trim() &&
          c.type === txType
      );

      if (!category) {
        // Create new category automatically
        const randomColor =
          defaultPalette[existingCategories.length % defaultPalette.length];
        const newCatId = await createCategory(
          rawCat,
          txType === 'income' ? 'wallet' : 'cart',
          randomColor,
          txType
        );
        category = {
          id: newCatId,
          name: rawCat,
          icon: txType === 'income' ? 'wallet' : 'cart',
          color: randomColor,
          type: txType,
          is_default: 0,
        };
        existingCategories.push(category);
        newCategoriesCount++;
      }

      // Insert transaction into SQLite
      await createTransaction(
        txType,
        cleanAmountNum,
        category.id,
        formattedDate,
        rawNote || undefined
      );

      importedCount++;
    }

    if (onSuccessCallback) {
      await onSuccessCallback();
    }

    return {
      success: true,
      importedCount,
      skippedCount,
      newCategoriesCount,
      message: `Berhasil mengimpor ${importedCount} transaksi.${
        newCategoriesCount > 0
          ? ` (${newCategoriesCount} kategori baru ditambahkan)`
          : ''
      }${skippedCount > 0 ? ` (${skippedCount} baris tidak valid dilewati)` : ''}`,
    };
  } catch (error: any) {
    return {
      success: false,
      importedCount: 0,
      skippedCount: 0,
      newCategoriesCount: 0,
      message: error.message || 'Gagal memproses file Excel.',
    };
  }
};
