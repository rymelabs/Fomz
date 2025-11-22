import React from 'react';
import { useTheme } from '../../hooks/useTheme';

const FormShell = ({ children, showProgress = false, progressPercent = 0, form }) => {
  const { themeData } = useTheme();
  const gradient = themeData?.gradient || 'linear-gradient(135deg, #7CA7FF 0%, #B6F3CF 100%)';
  const accent = themeData?.primaryColor || '#2563eb';

  // Style settings
  const fontFamily = form?.style?.fontFamily || 'sans';
  const fontSize = form?.style?.fontSize || 'md';
  const borderRadius = form?.style?.borderRadius || 'lg';

  const fontMap = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono'
  };

  const sizeMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const radiusMap = {
    none: '0px',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    full: '9999px'
  };

  const containerStyle = {
    '--element-radius': radiusMap[borderRadius] || '1rem',
    '--form-font-size': fontSize === 'sm' ? '0.875rem' : fontSize === 'lg' ? '1.125rem' : '1rem'
  };

  return (
    <div 
      className={`relative min-h-screen overflow-hidden bg-white ${fontMap[fontFamily] || 'font-sans'} ${sizeMap[fontSize] || 'text-base'}`}
      style={containerStyle}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60 blur-3xl animate-gradient-xy"
        style={{ background: gradient, backgroundSize: '400% 400%' }}
      ></div>
      
      {/* Shooting stars */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute h-0.5 w-[100px] bg-gradient-to-r from-transparent via-white to-transparent animate-shooting-star opacity-0"
            style={{
              top: `${Math.random() * 50}%`,
              left: `${Math.random() * 50}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white/30 blur-3xl"></div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="border-b border-white/60 bg-white/80 backdrop-blur">
          <div className="mx-auto w-full max-w-4xl px-6 pt-6 pb-0">
            <p className="font-display font-bold text-5xl text-gray-900">fomz</p>
            <p className="text-xs tracking-[0.2em] text-gray-500">by RymeLabs</p>
            {showProgress && (
              <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200/70">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(100, progressPercent)}%`, backgroundColor: accent }}
                ></div>
              </div>
            )}
          </div>
        </header>

        {form && (
          <div className="bg-white/0">
            <div className="mx-auto w-full max-w-4xl px-6 py-6">
              <div className="flex items-center gap-4">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="h-12 w-12 rounded-full border border-gray-200 object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 text-xs uppercase tracking-[0.4em] text-black">
                    {form.title?.[0] || 'F'}
                  </div>
                )}
                <div>
                  <p className="font-display text-2xl text-gray-900">{form.title || 'Untitled form'}</p>
                  {form.description && <p className="text-sm text-gray-500">{form.description}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-3xl">{children}</div>
        </main>

        <footer className="px-6 pb-10 text-center text-[0.65rem] uppercase tracking-[0.5em] text-gray-500">
          <span className="font-brand font-bold">fomz</span> by RymeLabs
        </footer>
      </div>
    </div>
  );
};

export default FormShell;
