'use client';

import { Monitor, Moon, Sun, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from './theme-provider';
import { ThemeMode } from '@/lib/themes/types';

export function ThemeSwitcher() {
  const { 
    preferences, 
    setThemeMode, 
    setCurrentTheme, 
    manager,
    currentTheme,
  } = useTheme();

  const allThemes = manager.getAllThemes();

  const getModeIcon = (mode: ThemeMode) => {
    switch (mode) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getModeLabel = (mode: ThemeMode) => {
    switch (mode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {getModeIcon(preferences.mode)}
            <span>Theme Mode</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
              <DropdownMenuItem
                key={mode}
                onClick={() => setThemeMode(mode)}
                className="flex items-center gap-2"
              >
                {getModeIcon(mode)}
                <span>{getModeLabel(mode)}</span>
                {preferences.mode === mode && (
                  <span className="ml-auto text-xs">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="h-4 w-4" />
            <span>Color Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {allThemes.map((theme) => (
              <DropdownMenuItem
                key={theme.id}
                onClick={() => setCurrentTheme(theme.id)}
                className="flex items-center gap-2"
              >
                <div
                  className="h-3 w-3 rounded-full border"
                  style={{
                    backgroundColor: `hsl(${theme.colors.light.primary})`,
                  }}
                />
                <span>{theme.name}</span>
                {currentTheme.id === theme.id && (
                  <span className="ml-auto text-xs">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}