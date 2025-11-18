import React, { useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';

const cssVarMap = {
  '--fomz-primary': 'primaryColor',
  '--fomz-primary-dark': 'primaryDark',
  '--fomz-on-primary': 'buttonText',
  '--fomz-secondary': 'secondaryColor',
  '--fomz-surface': 'surface',
  '--fomz-surface-text': 'surfaceText',
  '--fomz-surface-muted': 'surfaceMuted',
  '--fomz-surface-border': 'surfaceBorder',
  '--fomz-body-bg': 'bodyBg',
  '--fomz-body-text': 'bodyText',
  '--fomz-chip-bg': 'chipBg',
  '--fomz-chip-text': 'chipText',
  '--fomz-button-shadow': 'buttonShadow',
  '--fomz-card-shadow': 'cardShadow',
  '--fomz-gradient': 'gradient'
};

const ThemeProvider = ({ children }) => {
  const { themeData } = useTheme();

  useEffect(() => {
    if (!themeData) return;
    const root = document.documentElement;

    Object.entries(cssVarMap).forEach(([cssVar, themeKey]) => {
      if (themeData[themeKey]) {
        root.style.setProperty(cssVar, themeData[themeKey]);
      }
    });
  }, [themeData]);

  return children;
};

export default ThemeProvider;
