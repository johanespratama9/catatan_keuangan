import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, Theme } from '../utils/colors';
import { getSetting, getSettingSync, setSetting } from '../database/settingsRepo';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  theme: Theme;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  isDark: false,
  theme: lightTheme,
  setThemeMode: async () => {},
});

const SETTINGS_KEY = 'theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const saved = getSettingSync(SETTINGS_KEY);
      if (saved === 'system' || saved === 'light' || saved === 'dark') {
        return saved as ThemeMode;
      }
    } catch {
      // fallback to system
    }
    return 'system';
  });

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await setSetting(SETTINGS_KEY, mode);
    } catch (err) {
      console.error('Failed to save theme preference:', err);
    }
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const theme = useMemo(() => {
    return isDark ? darkTheme : lightTheme;
  }, [isDark]);

  const value = useMemo(
    () => ({
      themeMode,
      isDark,
      theme,
      setThemeMode,
    }),
    [themeMode, isDark, theme, setThemeMode]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

