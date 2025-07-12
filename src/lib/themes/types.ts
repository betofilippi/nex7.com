export type ThemeMode = 'light' | 'dark' | 'system';

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  popover: string;
  popoverForeground: string;
  card: string;
  cardForeground: string;
  border: string;
  input: string;
  ring: string;
  destructive: string;
  destructiveForeground: string;
  warning: string;
  warningForeground: string;
  success: string;
  successForeground: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  description?: string;
  author?: string;
  version?: string;
  colors: {
    light: ColorPalette;
    dark: ColorPalette;
  };
  fonts?: {
    sans?: string[];
    mono?: string[];
  };
  borderRadius?: string;
  spacing?: Record<string, string>;
  shadows?: Record<string, string>;
  animations?: Record<string, string>;
  customCSS?: string;
}

export interface UserThemePreferences {
  mode: ThemeMode;
  currentTheme: string;
  customThemes: ThemeConfig[];
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  compactMode: boolean;
  animations: boolean;
}

export interface ThemeMarketplaceItem {
  id: string;
  theme: ThemeConfig;
  downloads: number;
  rating: number;
  reviews: number;
  featured: boolean;
  verified: boolean;
  categories: string[];
  screenshots?: string[];
  createdAt: Date;
  updatedAt: Date;
}