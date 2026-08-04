import React from 'react';

const FormLoadingProgress = ({
  progress = 0,
  label = 'Opening form',
  accentColor = '#64748b',
  backgroundColor = '#f8fafc',
  textColor = '#0f172a'
}) => {
  const value = Math.max(0, Math.min(100, Math.round(progress)));
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 transition-colors duration-500"
      style={{ backgroundColor, color: textColor }}
    >
      <div className="w-full max-w-md text-center">
        <p className="font-display text-4xl font-bold">fomz</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] opacity-50">
          by RymeLabs
        </p>

        <div
          className="relative mx-auto mt-10 h-36 w-36"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
        >
          <svg className="h-full w-full -rotate-90" viewBox="0 0 144 144" aria-hidden="true">
            <circle
              cx="72"
              cy="72"
              r={radius}
              fill="none"
              stroke={accentColor}
              strokeOpacity="0.16"
              strokeWidth="10"
            />
            <circle
              cx="72"
              cy="72"
              r={radius}
              fill="none"
              stroke={accentColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-[stroke-dashoffset,stroke] duration-300 ease-out"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold tabular-nums">
            {value}%
          </span>
        </div>
        <p className="mt-6 text-sm font-medium">{label}</p>
        <p className="mt-2 text-xs opacity-50">Preparing a smooth form experience</p>
      </div>
    </div>
  );
};

export default FormLoadingProgress;
