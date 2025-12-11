import React from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';

const ThemeSelector: React.FC = () => {
  const { themeName, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(themeName === 'light' ? 'dark' : 'light');
  };

  const isDark = themeName === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105"
      style={{
        backgroundColor: 'var(--color-panel)',
        color: 'var(--color-text)',
        border: `1px solid var(--color-accent)`,
      }}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
    >
      {isDark ? (
        // Sun icon for light mode
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        // Moon icon for dark mode
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
      <span className="hidden sm:inline text-sm font-medium">
        {themes[themeName]?.name}
      </span>
    </button>
  );
};

export default ThemeSelector;
