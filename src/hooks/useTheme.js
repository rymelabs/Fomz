import { useMemo } from 'react';
import { useThemeStore } from '../store/themeStore';

export const useTheme = () => {
  const { currentTheme, themes, setTheme, getTheme } = useThemeStore();

  const themeData = useMemo(() => getTheme(currentTheme), [getTheme, currentTheme]);

  return {
    currentTheme,
    themeData,
    themes,
    setTheme,
  };
};
