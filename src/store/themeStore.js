import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const themes = {
  blue: {
    name: 'Ocean Blue',
    gradient: 'linear-gradient(140deg, #312e81 0%, #4338ca 30%, #4f46e5 55%, #0ea5e9 100%)',
    primaryColor: '#4f46e5',
    primaryDark: '#4338ca',
    secondaryColor: '#0ea5e9',
    textColor: '#ffffff',
    surface: 'rgba(255, 255, 255, 0.97)',
    surfaceText: '#0f172a',
    surfaceMuted: '#475569',
    surfaceBorder: 'rgba(79, 70, 229, 0.25)',
    bodyBg: '#eef2ff',
    bodyText: '#0f172a',
    chipBg: 'rgba(255, 255, 255, 0.22)',
    chipText: '#f8fafc',
    buttonText: '#ffffff',
    buttonShadow: '0 18px 45px -20px rgba(79, 70, 229, 0.85)',
    cardShadow: '0 30px 90px -35px rgba(15, 23, 42, 0.45)'
  },
  green: {
    name: 'Sunset Bloom',
    gradient: 'linear-gradient(140deg, #ff9a8b 0%, #fecfef 56%, #fe99c3 100%)',
    primaryColor: '#fb7185',
    primaryDark: '#e11d48',
    secondaryColor: '#f9a8d4',
    textColor: '#1f2937',
    surface: 'rgba(255, 255, 255, 0.98)',
    surfaceText: '#1f2937',
    surfaceMuted: '#6b7280',
    surfaceBorder: 'rgba(249, 168, 212, 0.35)',
    bodyBg: '#fff1f2',
    bodyText: '#1f2937',
    chipBg: 'rgba(255, 255, 255, 0.4)',
    chipText: '#db2777',
    buttonText: '#ffffff',
    buttonShadow: '0 18px 45px -20px rgba(219, 39, 119, 0.65)',
    cardShadow: '0 35px 100px -45px rgba(219, 39, 119, 0.35)'
  },
  mixed: {
    name: 'Sky Mix',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    primaryColor: '#0ea5e9',
    primaryDark: '#0284c7',
    secondaryColor: '#22d3ee',
    textColor: '#ffffff',
    surface: 'rgba(255, 255, 255, 0.96)',
    surfaceText: '#0f172a',
    surfaceMuted: '#475569',
    surfaceBorder: 'rgba(14, 165, 233, 0.3)',
    bodyBg: '#e0f2fe',
    bodyText: '#0f172a',
    chipBg: 'rgba(255, 255, 255, 0.3)',
    chipText: '#0f172a',
    buttonText: '#ffffff',
    buttonShadow: '0 20px 50px -30px rgba(14, 165, 233, 0.85)',
    cardShadow: '0 25px 80px -40px rgba(2, 132, 199, 0.4)'
  },
  soft: {
    name: 'Soft Pastel',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    primaryColor: '#ec4899',
    primaryDark: '#db2777',
    secondaryColor: '#f472b6',
    textColor: '#1f2937',
    surface: 'rgba(255, 255, 255, 0.98)',
    surfaceText: '#1f2937',
    surfaceMuted: '#6b7280',
    surfaceBorder: 'rgba(236, 72, 153, 0.2)',
    bodyBg: '#fff7fb',
    bodyText: '#1f2937',
    chipBg: 'rgba(255, 255, 255, 0.5)',
    chipText: '#db2777',
    buttonText: '#ffffff',
    buttonShadow: '0 20px 55px -30px rgba(236, 72, 153, 0.55)',
    cardShadow: '0 30px 95px -55px rgba(236, 72, 153, 0.45)'
  },
  minimal: {
    name: 'Minimal Mist',
    gradient: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    primaryColor: '#0f172a',
    primaryDark: '#020617',
    secondaryColor: '#475569',
    textColor: '#0f172a',
    surface: '#ffffff',
    surfaceText: '#111827',
    surfaceMuted: '#6b7280',
    surfaceBorder: 'rgba(148, 163, 184, 0.35)',
    bodyBg: '#f8fafc',
    bodyText: '#0f172a',
    chipBg: 'rgba(15, 23, 42, 0.08)',
    chipText: '#0f172a',
    buttonText: '#ffffff',
    buttonShadow: '0 20px 40px -25px rgba(15, 23, 42, 0.6)',
    cardShadow: '0 25px 90px -45px rgba(15, 23, 42, 0.25)'
  },
  dark: {
    name: 'Night Mode',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #111827 55%, #020617 100%)',
    primaryColor: '#6366f1',
    primaryDark: '#4c1d95',
    secondaryColor: '#a855f7',
    textColor: '#f8fafc',
    surface: 'rgba(15, 23, 42, 0.85)',
    surfaceText: '#f8fafc',
    surfaceMuted: '#94a3b8',
    surfaceBorder: 'rgba(255, 255, 255, 0.12)',
    bodyBg: '#020617',
    bodyText: '#f8fafc',
    chipBg: 'rgba(248, 250, 252, 0.15)',
    chipText: '#c084fc',
    buttonText: '#f8fafc',
    buttonShadow: '0 25px 60px -30px rgba(99, 102, 241, 0.65)',
    cardShadow: '0 35px 120px -40px rgba(15, 15, 36, 0.9)'
  }
};

export const useThemeStore = create(
  persist(
    (set) => ({
      currentTheme: 'blue',
      themes,
      
      setTheme: (themeName) => {
        if (themes[themeName]) {
          set({ currentTheme: themeName });
        }
      },
      
      getTheme: (themeName) => {
        return themes[themeName || 'blue'];
      },
      
      getCurrentThemeData: () => {
        const state = useThemeStore.getState();
        return themes[state.currentTheme];
      }
    }),
    {
      name: 'fomz-theme-storage'
    }
  )
);
