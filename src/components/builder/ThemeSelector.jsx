import React, { useState, useMemo } from 'react';
import { Check } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useFormBuilderStore } from '../../store/formBuilderStore';

const ThemeSelector = () => {
  const { themes, currentTheme, setTheme } = useThemeStore();
  const updateFormInfo = useFormBuilderStore((state) => state.updateFormInfo);
  const [visibleCount, setVisibleCount] = useState(6);

  const themeEntries = useMemo(() => Object.entries(themes), [themes]);
  const visibleThemes = themeEntries.slice(0, visibleCount);
  const activeTheme = themes[currentTheme] || themes.blue;

  const handleSelect = (themeKey) => {
    setTheme(themeKey);
    updateFormInfo({ theme: themeKey });
  };

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {visibleThemes.map(([key, theme]) => {
        const isActive = currentTheme === key;

        return (
          <button
            key={key}
            type="button"
            onClick={() => handleSelect(key)}
            className={`group relative flex flex-col gap-2 rounded-xl border bg-white p-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 ${
              isActive ? 'border-primary-500 ring-1 ring-primary-200' : 'border-gray-200'
            }`}
          >
            <div className="relative h-20 w-full overflow-hidden rounded-lg">
              <div className="absolute inset-0" style={{ background: theme.gradient }} />
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute inset-x-2 top-2 flex flex-col gap-1.5 text-white/80">
                <div className="h-1.5 rounded-full bg-white/30" />
                <div className="flex flex-col gap-1 rounded-lg border border-white/30 bg-white/10 p-2 text-[10px] leading-tight">
                  <span className="font-semibold tracking-wide">Sample</span>
                  <div className="h-1 rounded-full bg-white/40" />
                </div>
              </div>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{theme.name}</p>
                <p className="text-xs text-gray-500">{theme.primaryColor}</p>
              </div>
              {isActive && (
                <>
                  <span className="absolute top-3 right-3 inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary-600 text-white shadow-md" aria-hidden="true">
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="sr-only">Active theme</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {[theme.primaryColor, theme.secondaryColor, theme.surface].map((color, index) => (
                <span
                  key={`${key}-color-${index}`}
                  className="h-5 w-5 rounded-full border border-black/5"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </button>
        );
        })}
      </div>
      {themeEntries.length > 6 && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">
            Showing {visibleThemes.length} of {themeEntries.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVisibleCount(6)}
              disabled={visibleCount <= 6}
              className="text-xs font-semibold text-gray-700 underline-offset-4 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
            >
              See less
            </button>
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => Math.min(prev + 4, themeEntries.length))}
              disabled={visibleCount >= themeEntries.length}
              className="text-xs font-semibold underline-offset-4 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                color: activeTheme?.primaryColor || '#4f46e5'
              }}
            >
              See more
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ThemeSelector;
