import React from 'react';
import FormShell from '../../components/fill/FormShell';
import { useTheme } from '../../hooks/useTheme';

const Success = ({ title, description, onSubmitAnother, logoUrl, form }) => {
  const { themeData } = useTheme();
  const accent = themeData?.primaryColor || '#2563eb';

  return (
    <FormShell form={form}>
      <div className="relative overflow-hidden rounded-[32px] border border-white bg-white/50 backdrop-blur-md px-10 py-14 text-center shadow-[var(--fomz-card-shadow)] animate-slide-in-right">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-white/70 to-transparent opacity-80"></div>
        <div className="relative">
          <div className="mx-auto h-20 w-20 rounded-full border-2 border-white/70 bg-white/90 flex items-center justify-center text-4xl animate-text-enter" style={{ color: accent }}>
            ✓
          </div>
          <h1 className="mt-6 font-display text-3xl text-gray-900 animate-text-enter" style={{ animationDelay: '0.1s' }}>Thanks!</h1>
          <p className="mt-2 text-gray-600 animate-text-enter" style={{ animationDelay: '0.2s' }}>Your response has been recorded.</p>
          {title && <p className="mt-4 text-sm text-gray-500 animate-text-enter" style={{ animationDelay: '0.3s' }}>Form: {title}</p>}
          {description && <p className="text-xs text-gray-500 animate-text-enter" style={{ animationDelay: '0.3s' }}>{description}</p>}
          <div className="animate-text-enter" style={{ animationDelay: '0.4s' }}>
            <button
              className="mt-10 inline-flex items-center justify-center rounded-full px-10 py-3 font-sans text-lg text-white"
              style={{ backgroundColor: accent, boxShadow: themeData?.buttonShadow }}
              onClick={onSubmitAnother}
            >
              Submit another response
            </button>
          </div>
        </div>
      </div>
    </FormShell>
  );
};

export default Success;
