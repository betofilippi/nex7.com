'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeManager, themeManager } from '@/lib/themes/theme-manager';
import { ThemeConfig, ThemeMode, UserThemePreferences } from '@/lib/themes/types';

interface ThemeContextType {
  manager: ThemeManager;
  currentTheme: ThemeConfig;
  preferences: UserThemePreferences;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setCurrentTheme: (themeId: string) => void;
  setFontSize: (size: UserThemePreferences['fontSize']) => void;
  setCompactMode: (compact: boolean) => void;
  setAnimations: (enabled: boolean) => void;
  addCustomTheme: (theme: ThemeConfig) => void;
  removeCustomTheme: (themeId: string) => void;
  exportTheme: (themeId: string) => string | null;
  importTheme: (themeJson: string) => ThemeConfig | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentThemeState] = useState(themeManager.getCurrentTheme());
  const [preferences, setPreferencesState] = useState(themeManager.getPreferences());
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Listen for theme changes
    const handleThemeChange = (event: CustomEvent) => {
      setCurrentThemeState(event.detail.theme);
      setPreferencesState(themeManager.getPreferences());
      setIsDark(event.detail.isDark);
    };

    window.addEventListener('theme-change', handleThemeChange as EventListener);

    // Initial dark mode detection
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateDarkMode = () => {
      if (preferences.mode === 'system') {
        setIsDark(mediaQuery.matches);
      } else {
        setIsDark(preferences.mode === 'dark');
      }
    };

    updateDarkMode();
    mediaQuery.addEventListener('change', updateDarkMode);

    return () => {
      window.removeEventListener('theme-change', handleThemeChange as EventListener);
      mediaQuery.removeEventListener('change', updateDarkMode);
    };
  }, [preferences.mode]);

  const contextValue: ThemeContextType = {
    manager: themeManager,
    currentTheme,
    preferences,
    isDark,
    setThemeMode: (mode: ThemeMode) => {
      themeManager.setThemeMode(mode);
    },
    setCurrentTheme: (themeId: string) => {
      themeManager.setCurrentTheme(themeId);
    },
    setFontSize: (size: UserThemePreferences['fontSize']) => {
      themeManager.setFontSize(size);
    },
    setCompactMode: (compact: boolean) => {
      themeManager.setCompactMode(compact);
    },
    setAnimations: (enabled: boolean) => {
      themeManager.setAnimations(enabled);
    },
    addCustomTheme: (theme: ThemeConfig) => {
      themeManager.addCustomTheme(theme);
    },
    removeCustomTheme: (themeId: string) => {
      themeManager.removeCustomTheme(themeId);
    },
    exportTheme: (themeId: string) => {
      return themeManager.exportTheme(themeId);
    },
    importTheme: (themeJson: string) => {
      return themeManager.importTheme(themeJson);
    },
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}