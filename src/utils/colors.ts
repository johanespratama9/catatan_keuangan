export const lightTheme = {
  isDark: false,
  primary: '#2563EB',      // Royal Blue
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  
  income: '#10B981',       // Emerald Green
  incomeLight: '#ECFDF5',
  incomeDark: '#047857',

  expense: '#EF4444',      // Rose Red
  expenseLight: '#FEF2F2',
  expenseDark: '#B91C1C',

  warning: '#F59E0B',
  warningLight: '#FFFBEB',

  card: '#FFFFFF',
  cardSecondary: '#F8FAFC',
  background: '#F8FAFC',  // Slate 50
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  border: '#E2E8F0',       // Slate 200
  borderLight: '#F1F5F9',  // Slate 100

  textPrimary: '#0F172A',  // Slate 900
  textSecondary: '#64748B',// Slate 500
  textMuted: '#94A3B8',    // Slate 400

  inputBackground: '#F8FAFC',
  inputBorder: '#E2E8F0',

  modalOverlay: 'rgba(15, 23, 42, 0.55)',
  dockBackground: 'rgba(255, 255, 255, 0.24)',
  dockBorder: 'rgba(255, 255, 255, 0.65)',
  dockBubble: 'rgba(210, 218, 228, 0.60)',
  dockText: '#000000',
  dockTextMuted: '#64748B',

  white: '#FFFFFF',
  black: '#000000',
};

export const darkTheme = {
  isDark: true,
  primary: '#3B82F6',      // Bright Royal Blue for dark mode
  primaryDark: '#2563EB',
  primaryLight: 'rgba(59, 130, 246, 0.20)',
  
  income: '#10B981',       // Emerald Green
  incomeLight: 'rgba(16, 185, 129, 0.18)',
  incomeDark: '#34D399',

  expense: '#EF4444',      // Rose Red
  expenseLight: 'rgba(239, 68, 68, 0.18)',
  expenseDark: '#F87171',

  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.18)',

  card: '#141D2B',         // Deep slate dark card
  cardSecondary: '#1A2436',
  background: '#0B0F17',   // Ultra sleek dark slate
  surface: '#141D2B',
  surfaceSecondary: '#1C273A',
  border: '#233047',       // Visible subtle border
  borderLight: '#182232',

  textPrimary: '#F8FAFC',  // High contrast white
  textSecondary: '#94A3B8',// Slate 400
  textMuted: '#64748B',    // Slate 500

  inputBackground: '#0F1623',
  inputBorder: '#233047',

  modalOverlay: 'rgba(0, 0, 0, 0.75)',
  dockBackground: 'rgba(19, 27, 42, 0.85)',
  dockBorder: 'rgba(255, 255, 255, 0.12)',
  dockBubble: 'rgba(255, 255, 255, 0.16)',
  dockText: '#F8FAFC',
  dockTextMuted: '#94A3B8',

  white: '#FFFFFF',
  black: '#000000',
};

export type Theme = typeof lightTheme;

export const colors = lightTheme;

export const defaultPalette = [
  '#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D',
  '#6C5CE7', '#FD79A8', '#00B894', '#0984E3',
  '#E17055', '#2ED573', '#FFA502', '#9B59B6',
  '#1E90FF', '#FF4757', '#A4B0BE', '#20BF6B'
];
