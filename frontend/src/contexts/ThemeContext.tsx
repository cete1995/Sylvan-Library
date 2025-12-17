import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Theme {
  name: string;
  colors: {
    background: string;
    panel: string;
    accent: string;
    highlight: string;
    text: string;
    textSecondary: string;
    border: string;
  };
}

export const themes: Record<string, Theme> = {
  light: {
    name: 'Light Mode',
    colors: {
      background: '#F9FAFB',
      panel: '#FFFFFF',
      accent: '#3B82F6',
      highlight: '#8B5CF6',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
    },
  },
  dark: {
    name: 'Dark Mode',
    colors: {
      background: '#0A0E1A',
      panel: '#131824',
      accent: '#60A5FA',
      highlight: '#A78BFA',
      text: '#E5E7EB',
      textSecondary: '#9CA3AF',
      border: '#1F2937',
    },
  },
};

interface ThemeContextType {
  currentTheme: Theme;
  themeName: string;
  setTheme: (themeName: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeName, setThemeName] = useState<string>(() => {
    return localStorage.getItem('selectedTheme') || 'light';
  });

  const currentTheme = themes[themeName] || themes.light;

  useEffect(() => {
    localStorage.setItem('selectedTheme', themeName);
    
    // Apply CSS variables to root
    const root = document.documentElement;
    root.style.setProperty('--color-background', currentTheme.colors.background);
    root.style.setProperty('--color-panel', currentTheme.colors.panel);
    root.style.setProperty('--color-accent', currentTheme.colors.accent);
    root.style.setProperty('--color-highlight', currentTheme.colors.highlight);
    root.style.setProperty('--color-text', currentTheme.colors.text);
    root.style.setProperty('--color-text-secondary', currentTheme.colors.textSecondary);
    root.style.setProperty('--color-border', currentTheme.colors.border);
  }, [themeName, currentTheme]);

  const setTheme = (newThemeName: string) => {
    if (themes[newThemeName]) {
      setThemeName(newThemeName);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, themeName, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
