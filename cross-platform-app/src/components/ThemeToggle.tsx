import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useLocalization } from '../hooks/useLocalization';
import { Sun, Moon } from 'lucide-react-native';

export const ThemeToggle: React.FC = () => {
  const { themeName, theme, toggleTheme } = useTheme();
  const { t } = useLocalization();

  return (
    <Pressable
      onPress={toggleTheme}
      style={[styles.button, { backgroundColor: theme.colors.cardBg }]}
      aria-label={t(themeName === 'light' ? 'switchToDarkMode' : 'switchToLightMode')}
    >
      {themeName === 'light' ? (
        <Moon size={24} color={theme.colors.textStreamer} />
      ) : (
        <Sun size={24} color={theme.colors.textStreamer} />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
