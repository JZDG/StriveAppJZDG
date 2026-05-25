import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from './colors';

const ThemeContext = createContext();

const THEME_KEY = '@striveapp_theme';
const GLASS_KEY = '@striveapp_glass';

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [glassMode, setGlassMode] = useState('off');
  const [loaded, setLoaded] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_KEY);
        const savedGlass = await AsyncStorage.getItem(GLASS_KEY);
        if (savedTheme !== null) setIsDarkMode(savedTheme === 'dark');
        if (savedGlass !== null) setGlassMode(savedGlass);
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await AsyncStorage.setItem(THEME_KEY, newMode ? 'dark' : 'light');
  };

  const setGlass = async (mode) => {
    setGlassMode(mode);
    await AsyncStorage.setItem(GLASS_KEY, mode);
  };

  const theme = isDarkMode ? Colors.dark : Colors.light;

  if (!loaded) return null; // Don't render until prefs loaded

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, glassMode, setGlass, Colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
