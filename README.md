# Aplikasi Catatan Keuangan (Expo React Native + SQLite)

Aplikasi pencatatan keuangan pribadi modern berbasis mobile yang dibangun dengan **React Native**, **Expo SDK 57**, dan **SQLite** (`expo-sqlite`).

---

## 📱 Fitur Utama

1. **Dashboard & Ringkasan Finansial**
   - Menampilkan total saldo aktual, total pemasukan, dan total pengeluaran.
   - Quick action: Tombol cepat catat pengeluaran dan pemasukan.
   - Daftar riwayat transaksi terbaru.

2. **Pencatatan Transaksi (CRUD Lengkap)**
   - Mendukung tipe **Pengeluaran** (Expense) & **Pemasukan** (Income).
   - Format nominal Rupiah (IDR) otomatis.
   - Pemilihan kategori dengan icon dan warna visual.
   - Tanggal transaksi fleksibel (Hari Ini, Kemarin, atau kalender).
   - Catatan / keterangan tambahan.
   - Edit dan Hapus transaksi.

3. **Riwayat & Pencarian Transaksi**
   - Pencarian real-time berdasarkan catatan atau nama kategori.
   - Filter tab: Semua, Pengeluaran, Pemasukan.
   - Kalkulasi otomatis total nominal sesuai filter pencarian.

4. **Analisis Finansial & Statistik**
   - Grafik distribusi kategori dengan indikator progress bar warna-warni.
   - Persentase alokasi pengeluaran dan pemasukan per kategori.
   - Perhitungan rasio tabungan (*Savings Rate*) dan surplus bersih.

5. **Kelola Kategori Kustom**
   - Kategori bawaan sistem (Makanan, Transportasi, Belanja, Tagihan, Hiburan, Gaji, dll.).
   - Tambah kategori kustom dengan pilihan puluhan icon dan palet warna.
   - Hapus kategori kustom.

6. **Ekspor & Impor Data Excel (.xlsx)**
   - **Ekspor ke Excel**: Menghasilkan workbook spreadsheet `.xlsx` dengan 3 worksheet (Daftar Transaksi, Ringkasan Finansial, dan Daftar Kategori).
   - **Bagikan / Simpan File**: Terintegrasi langsung dengan menu berbagi sistem (*Files*, Google Drive, WhatsApp, Email, dll.).
   - **Impor dari Excel**: Baca data transaksi massal dari file Excel (`.xlsx`, `.xls`, `.csv`).
   - **Pemetaan Kategori Otomatis**: Kategori baru dalam file Excel otomatis dibuat jika belum terdaftar di aplikasi.
   - **Unduh Template Excel**: Menyediakan template siap pakai untuk pengguna.

---

## 🗄️ Arsitektur SQLite Database

Menggunakan API modern `expo-sqlite`:

- **Tabel `categories`**:
  - `id` (INTEGER PK AUTOINCREMENT)
  - `name` (TEXT)
  - `icon` (TEXT - Ionicons name)
  - `color` (TEXT - HEX color)
  - `type` (TEXT - 'income' | 'expense')
  - `is_default` (INTEGER)

- **Tabel `transactions`**:
  - `id` (INTEGER PK AUTOINCREMENT)
  - `type` (TEXT - 'income' | 'expense')
  - `amount` (REAL)
  - `category_id` (INTEGER FK -> categories.id)
  - `date` (TEXT - YYYY-MM-DD)
  - `note` (TEXT)
  - `created_at` (TEXT)

---

## 🚀 Cara Menjalankan Aplikasi

1. **Jalankan Development Server**:
   ```bash
   npx expo start
   ```

2. **Buka di Perangkat / Emulator**:
   - **Android**: Tekan `a` pada terminal untuk membuka Android Emulator, atau scan QR code melalui aplikasi **Expo Go**.
   - **iOS**: Tekan `i` pada terminal untuk membuka iOS Simulator.
   - **Web**: Tekan `w` untuk pratinjau di browser.

3. **Periksa Tipe Data (Typecheck)**:
   ```bash
   npx tsc --noEmit
   ```

4. **Diagnosa Expo**:
   ```bash
   npx expo-doctor
   ```
