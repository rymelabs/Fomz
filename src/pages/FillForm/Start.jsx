import React from 'react';
import FormShell from '../../components/fill/FormShell';
import { useTheme } from '../../hooks/useTheme';

const Start = ({ title, description, onBegin, logoUrl, form }) => {
  const { themeData } = useTheme();
  const accent = themeData?.primaryColor || '#2563eb';

  return (
    <FormShell form={form}>
      <div className="relative overflow-hidden rounded-[32px] border border-white bg-white/50 backdrop-blur-md px-10 py-14 shadow-[var(--fomz-card-shadow)] animate-card-enter">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-white/70 to-transparent opacity-80"></div>
        <div className="relative text-center">
          <p className="mt-6 text-xs uppercase tracking-[0.5em] text-gray-500 animate-text-enter">Welcome</p>
          <h1 className="mt-4 font-display text-4xl text-gray-900 animate-text-enter" style={{ animationDelay: '0.1s' }}>{title}</h1>
          {description && <p className="mt-4 text-gray-600 animate-text-enter" style={{ animationDelay: '0.2s' }}>{description}</p>}
          <div className="animate-text-enter" style={{ animationDelay: '0.3s' }}>
            <button
              className="mt-10 inline-flex items-center justify-center rounded-full px-12 py-3 font-sans text-lg text-white"
              style={{ backgroundColor: accent, boxShadow: themeData?.buttonShadow }}
              onClick={onBegin}
            >
              Get started
            </button>
          </div>
        </div>
      </div>
    </FormShell>
  );
};

export default Start;
