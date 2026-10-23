const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const brainDir = '/Users/mac-mini-kirei/.gemini/antigravity-ide/brain/f9ec5a17-2f01-4d30-81bf-5f19e01a081e';
const assetsDir = path.join(__dirname, '..', 'assets');

const logoSrc = path.join(brainDir, 'finance_app_logo_1792756179173.jpg');
const splashSrc = path.join(brainDir, 'finance_splash_screen_1792756213336.jpg');
const emblemSrc = path.join(brainDir, 'finance_logo_emblem_1792756235020.jpg');

function convertOrCopy(src, destPng, destJpg) {
  if (!fs.existsSync(src)) {
    console.error(`✗ Sumber tidak ditemukan: ${src}`);
    return;
  }

  // Simpan versi JPG
  if (destJpg) {
    fs.copyFileSync(src, destJpg);
    console.log(`✓ Disalin (JPG): ${path.basename(destJpg)}`);
  }

  // Coba convert ke PNG menggunakan sips (native macOS)
  let converted = false;
  try {
    execSync(`sips -s format png "${src}" --out "${destPng}"`, { stdio: 'ignore' });
    converted = true;
    console.log(`✓ Dikonversi & disalin (PNG via sips): ${path.basename(destPng)}`);
  } catch (err) {
    // Fallback: copy langsung jika sips tidak ada
    fs.copyFileSync(src, destPng);
    console.log(`✓ Disalin (Fallback PNG): ${path.basename(destPng)}`);
  }
}

console.log('--- Memulai Penerapan Aset Logo & Splash Screen ---');

// 1. Icon utama
convertOrCopy(logoSrc, path.join(assetsDir, 'icon.png'), path.join(assetsDir, 'icon.jpg'));

// 2. Splash Screen Full
convertOrCopy(splashSrc, path.join(assetsDir, 'splash.png'), path.join(assetsDir, 'splash.jpg'));

// 3. Splash Icon & Android Foreground
convertOrCopy(emblemSrc, path.join(assetsDir, 'splash-icon.png'), path.join(assetsDir, 'splash-icon.jpg'));
convertOrCopy(emblemSrc, path.join(assetsDir, 'android-icon-foreground.png'), null);

// 4. Favicon
convertOrCopy(logoSrc, path.join(assetsDir, 'favicon.png'), path.join(assetsDir, 'favicon.jpg'));

console.log('--- Selesai Menerapkan Semua Aset! ---');
