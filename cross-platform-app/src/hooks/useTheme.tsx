import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme, ColorSchemeName } from 'react-native';

type ThemeName = 'light' | 'dark';

// FIX: Encapsulate theme colors within a 'colors' property to match usage in components.
const lightTheme = {
  colors: {
    background: '#e0c3fc', // Simplified gradient
    textTitle: '#000',
    textBody: '#111827',
    textStreamer: '#111827',
    cardBg: 'rgba(255, 255, 255, 0.2)',
  },
};

// FIX: Encapsulate theme colors within a 'colors' property to match usage in components.
const darkTheme = {
  colors: {
    background: '#141e30',
    textTitle: '#fff',
    textBody: '#e5e7eb',
    textStreamer: '#e5e7eb',
    cardBg: 'rgba(0, 0, 0, 0.2)',
  },
};

const themes = {
  light: lightTheme,
  dark: darkTheme,
};

interface ThemeContextType {
  themeName: ThemeName;
  theme: typeof lightTheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemTheme = useColorScheme();
  // FIX: Handle potential 'unspecified' or null values from useColorScheme by defaulting to 'light'.
  const [themeName, setThemeName] = useState<ThemeName>(systemTheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('theme') as ThemeName | null;
        if (storedTheme) {
          setThemeName(storedTheme);
        } else {
          // FIX: Handle potential 'unspecified' or null values from useColorScheme by defaulting to 'light'.
          setThemeName(systemTheme === 'dark' ? 'dark' : 'light');
        }
      } catch (e) {
        console.error("Failed to load theme from storage", e);
      }
    };
    loadTheme();
  }, [systemTheme]);

  const toggleTheme = async () => {
    const newThemeName = themeName === 'light' ? 'dark' : 'light';
    setThemeName(newThemeName);
    try {
      await AsyncStorage.setItem('theme', newThemeName);
    } catch (e) {
      console.error("Failed to save theme to storage", e);
    }
  };

  const theme = themes[themeName];
  
  return (
    <ThemeContext.Provider value={{ themeName, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
