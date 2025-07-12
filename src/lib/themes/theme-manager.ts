import { ThemeConfig, ThemeMode, UserThemePreferences, ColorPalette } from './types';
import { presetThemes, defaultTheme } from './presets';

export class ThemeManager {
  private preferences: UserThemePreferences;
  private storageKey = 'nex7:theme-preferences';
  private currentTheme: ThemeConfig;
  private systemDarkMode = false;

  constructor() {
    this.preferences = this.loadPreferences();
    this.currentTheme = this.getThemeById(this.preferences.currentTheme) || defaultTheme;
    this.initSystemThemeDetection();
    this.applyTheme();
  }

  private loadPreferences(): UserThemePreferences {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return {
          ...this.getDefaultPreferences(),
          ...JSON.parse(stored),
        };
      }
    } catch (error) {
      console.error('Error loading theme preferences:', error);
    }
    return this.getDefaultPreferences();
  }

  private getDefaultPreferences(): UserThemePreferences {
    return {
      mode: 'system',
      currentTheme: 'default',
      customThemes: [],
      fontSize: 'md',
      compactMode: false,
      animations: true,
    };
  }

  private savePreferences(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Error saving theme preferences:', error);
    }
  }

  private initSystemThemeDetection(): void {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemDarkMode = mediaQuery.matches;
      
      mediaQuery.addEventListener('change', (e) => {
        this.systemDarkMode = e.matches;
        if (this.preferences.mode === 'system') {
          this.applyTheme();
        }
      });
    }
  }

  getThemeById(id: string): ThemeConfig | undefined {
    const allThemes = [...presetThemes, ...this.preferences.customThemes];
    return allThemes.find(theme => theme.id === id);
  }

  getAllThemes(): ThemeConfig[] {
    return [...presetThemes, ...this.preferences.customThemes];
  }

  getCurrentTheme(): ThemeConfig {
    return this.currentTheme;
  }

  getPreferences(): UserThemePreferences {
    return { ...this.preferences };
  }

  setThemeMode(mode: ThemeMode): void {
    this.preferences.mode = mode;
    this.savePreferences();
    this.applyTheme();
  }

  setCurrentTheme(themeId: string): void {
    const theme = this.getThemeById(themeId);
    if (theme) {
      this.preferences.currentTheme = themeId;
      this.currentTheme = theme;
      this.savePreferences();
      this.applyTheme();
    }
  }

  addCustomTheme(theme: ThemeConfig): void {
    const existingIndex = this.preferences.customThemes.findIndex(t => t.id === theme.id);
    if (existingIndex >= 0) {
      this.preferences.customThemes[existingIndex] = theme;
    } else {
      this.preferences.customThemes.push(theme);
    }
    this.savePreferences();
  }

  removeCustomTheme(themeId: string): void {
    this.preferences.customThemes = this.preferences.customThemes.filter(t => t.id !== themeId);
    if (this.preferences.currentTheme === themeId) {
      this.setCurrentTheme('default');
    }
    this.savePreferences();
  }

  setFontSize(fontSize: UserThemePreferences['fontSize']): void {
    this.preferences.fontSize = fontSize;
    this.savePreferences();
    this.applyTheme();
  }

  setCompactMode(compact: boolean): void {
    this.preferences.compactMode = compact;
    this.savePreferences();
    this.applyTheme();
  }

  setAnimations(enabled: boolean): void {
    this.preferences.animations = enabled;
    this.savePreferences();
    this.applyTheme();
  }

  private isDarkMode(): boolean {
    switch (this.preferences.mode) {
      case 'dark':
        return true;
      case 'light':
        return false;
      case 'system':
        return this.systemDarkMode;
      default:
        return false;
    }
  }

  private applyTheme(): void {
    if (typeof document === 'undefined') return;

    const isDark = this.isDarkMode();
    const colors = isDark ? this.currentTheme.colors.dark : this.currentTheme.colors.light;

    // Apply CSS variables
    this.applyCSSVariables(colors);

    // Apply theme class
    document.documentElement.classList.toggle('dark', isDark);

    // Apply font size
    this.applyFontSize();

    // Apply compact mode
    document.documentElement.classList.toggle('compact', this.preferences.compactMode);

    // Apply animations
    document.documentElement.classList.toggle('no-animations', !this.preferences.animations);

    // Apply custom CSS if present
    if (this.currentTheme.customCSS) {
      this.applyCustomCSS(this.currentTheme.customCSS);
    }

    // Emit theme change event
    this.emitThemeChange();
  }

  private applyCSSVariables(colors: ColorPalette): void {
    const root = document.documentElement;
    
    Object.entries(colors).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });

    // Apply border radius
    if (this.currentTheme.borderRadius) {
      root.style.setProperty('--radius', this.currentTheme.borderRadius);
    }
  }

  private applyFontSize(): void {
    const fontSizeMap = {
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
    };

    document.documentElement.style.setProperty(
      '--base-font-size',
      fontSizeMap[this.preferences.fontSize]
    );
  }

  private applyCustomCSS(css: string): void {
    const styleId = 'nex7-custom-theme-css';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = css;
  }

  private emitThemeChange(): void {
    const event = new CustomEvent('theme-change', {
      detail: {
        theme: this.currentTheme,
        mode: this.preferences.mode,
        isDark: this.isDarkMode(),
        preferences: this.preferences,
      },
    });
    window.dispatchEvent(event);
  }

  generateThemeCSS(theme: ThemeConfig, mode: 'light' | 'dark'): string {
    const colors = mode === 'dark' ? theme.colors.dark : theme.colors.light;
    
    let css = ':root {\n';
    Object.entries(colors).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      css += `  ${cssVar}: ${value};\n`;
    });
    
    if (theme.borderRadius) {
      css += `  --radius: ${theme.borderRadius};\n`;
    }
    
    css += '}\n';
    
    if (theme.customCSS) {
      css += '\n' + theme.customCSS;
    }
    
    return css;
  }

  exportTheme(themeId: string): string | null {
    const theme = this.getThemeById(themeId);
    if (!theme) return null;
    
    return JSON.stringify(theme, null, 2);
  }

  importTheme(themeJson: string): ThemeConfig | null {
    try {
      const theme = JSON.parse(themeJson) as ThemeConfig;
      
      // Validate theme structure
      if (!theme.id || !theme.name || !theme.colors) {
        throw new Error('Invalid theme structure');
      }
      
      this.addCustomTheme(theme);
      return theme;
    } catch (error) {
      console.error('Error importing theme:', error);
      return null;
    }
  }
}

// Global theme manager instance
export const themeManager = new ThemeManager();