import React, { useMemo } from 'react';
import FormShell from '../../components/fill/FormShell';
import { useTheme } from '../../hooks/useTheme';
import { Clock } from 'lucide-react';

const fontMap = {
  sans: 'font-sans',
  poppins: 'font-poppins',
  inter: 'font-inter',
  roboto: 'font-roboto',
  lato: 'font-lato',
  opensans: 'font-opensans',
  montserrat: 'font-montserrat',
  raleway: 'font-raleway',
  sourcesans: 'font-sourcesans',
  playfair: 'font-playfair',
  serif: 'font-serif',
  mono: 'font-mono',
  dancing: 'font-dancing',
  pacifico: 'font-pacifico'
};

const Start = ({ title, description, onBegin, logoUrl, form }) => {
  const { themeData } = useTheme();
  const accent = themeData?.primaryColor || '#2563eb';
  const fontFamily = form?.style?.fontFamily || 'poppins';
  const fontClass = fontMap[fontFamily] || 'font-poppins';

  // Estimate completion time based on question types
  const estimatedTime = useMemo(() => {
    const questions = form?.questions || [];
    if (questions.length === 0) return null;
    
    // Time estimates per question type (in seconds)
    const timePerType = {
      'short-text': 20,
      'long-text': 60,
      'multiple-choice': 15,
      'checkbox': 20,
      'dropdown': 10,
      'number': 15,
      'email': 15,
      'phone': 25,
      'date': 15,
      'time': 15,
      'rating': 10,
      'slider': 10,
      'address': 60,
      'image': 5, // Just viewing
      'section': 5  // Section break
    };
    
    const totalSeconds = questions.reduce((acc, q) => {
      return acc + (timePerType[q.type] || 20);
    }, 0);
    
    const minutes = Math.ceil(totalSeconds / 60);
    
    if (minutes < 1) return 'Less than 1 minute';
    if (minutes === 1) return '~1 minute';
    return `~${minutes} minutes`;
  }, [form?.questions]);

  return (
    <FormShell form={form} showHeader={false}>
      <div className="relative overflow-hidden rounded-[32px] border border-white bg-white/50 backdrop-blur-md px-10 py-14 shadow-[var(--fomz-card-shadow)] animate-card-enter">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-white/70 to-transparent opacity-80"></div>
        <div className="relative text-center">
          <p className="mt-6 text-xs uppercase tracking-[0.5em] text-gray-500 animate-text-enter">Welcome</p>
          <h1 className={`mt-4 text-4xl text-gray-900 animate-text-enter ${fontClass}`} style={{ animationDelay: '0.1s' }}>{title}</h1>
          {description && <p className="mt-4 text-gray-600 animate-text-enter" style={{ animationDelay: '0.2s' }}>{description}</p>}
          {estimatedTime && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 animate-text-enter" style={{ animationDelay: '0.25s' }}>
              <Clock className="h-4 w-4" />
              <span>{estimatedTime}</span>
            </div>
          )}
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
