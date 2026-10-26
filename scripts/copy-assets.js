const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
const walletSrc = path.join(assetsDir, 'wallet.png');

console.log('--- Menyinkronkan wallet.png ke aset icon dan splash ---');

if (fs.existsSync(walletSrc)) {
  fs.copyFileSync(walletSrc, path.join(assetsDir, 'icon.png'));
  fs.copyFileSync(walletSrc, path.join(assetsDir, 'splash-icon.png'));
  fs.copyFileSync(walletSrc, path.join(assetsDir, 'android-icon-foreground.png'));
  fs.copyFileSync(walletSrc, path.join(assetsDir, 'favicon.png'));
  console.log('✓ wallet.png berhasil disalin ke:');
  console.log('  - assets/icon.png');
  console.log('  - assets/splash-icon.png');
  console.log('  - assets/android-icon-foreground.png');
  console.log('  - assets/favicon.png');
} else {
  console.error(`✗ File ${walletSrc} tidak ditemukan!`);
}

console.log('--- Selesai! ---');
