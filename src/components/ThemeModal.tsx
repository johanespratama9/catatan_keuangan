import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '../context/ThemeContext';

interface ThemeModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ThemeOption {
  key: ThemeMode;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    key: 'system',
    title: 'Default Sistem',
    subtitle: 'Menyesuaikan tampilan sistem iPhone/HP secara otomatis',
    icon: 'phone-portrait-outline',
  },
  {
    key: 'light',
    title: 'Mode Terang (Light)',
    subtitle: 'Tampilan latar putih bersih dan kontras cerah',
    icon: 'sunny-outline',
  },
  {
    key: 'dark',
    title: 'Mode Gelap (Dark)',
    subtitle: 'Tampilan latar hitam redup, nyaman di mata saat minim cahaya',
    icon: 'moon-outline',
  },
];

export const ThemeModal: React.FC<ThemeModalProps> = ({ visible, onClose }) => {
  const { themeMode, setThemeMode, isDark, theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={[styles.backdrop, { backgroundColor: theme.modalOverlay }]} onPress={onClose}>
        <Pressable
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Sheet Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handleBar, { backgroundColor: theme.border }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextGroup}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>Tema Tampilan</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Pilih tema aplikasi atau ikuti pengaturan perangkat
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: theme.surfaceSecondary }]}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Options List */}
          <View style={styles.optionsList}>
            {THEME_OPTIONS.map((opt) => {
              const isSelected = themeMode === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(59, 130, 246, 0.16)'
                          : '#EFF6FF'
                        : theme.surfaceSecondary,
                      borderColor: isSelected ? theme.primary : theme.borderLight,
                    },
                  ]}
                  onPress={() => setThemeMode(opt.key)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isSelected
                          ? theme.primary
                          : isDark
                          ? '#233047'
                          : '#E2E8F0',
                      },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={20}
                      color={isSelected ? '#FFFFFF' : theme.textSecondary}
                    />
                  </View>

                  <View style={styles.optionTextCol}>
                    <View style={styles.optionTitleRow}>
                      <Text
                        style={[
                          styles.optionTitle,
                          {
                            color: isSelected ? theme.primary : theme.textPrimary,
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}
                      >
                        {opt.title}
                      </Text>
                      {opt.key === 'system' && (
                        <View
                          style={[
                            styles.currentBadge,
                            {
                              backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.currentBadgeText,
                              { color: theme.textSecondary },
                            ]}
                          >
                            Aktif: {isDark ? 'Gelap' : 'Terang'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[styles.optionSubtitle, { color: theme.textSecondary }]}
                      numberOfLines={2}
                    >
                      {opt.subtitle}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected ? theme.primary : theme.border,
                        backgroundColor: isSelected ? theme.primary : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Close / Done Button */}
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: theme.primary }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.doneBtnText}>Selesai</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsList: {
    gap: 10,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextCol: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  optionTitle: {
    fontSize: 14.5,
  },
  currentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  optionSubtitle: {
    fontSize: 11.5,
    lineHeight: 15,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

