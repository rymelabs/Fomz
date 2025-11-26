import React from 'react';

const LongText = ({ 
  question, 
  value, 
  onChange, 
  error,
  disabled = false,
  fontClass = ''
}) => {
  return (
    <div>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder || 'Your answer'}
        disabled={disabled}
        required={question.required}
        minLength={question.validation?.min}
        maxLength={question.validation?.max}
        rows={4}
        className={`w-full px-3 py-1.5 rounded-[10px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none placeholder:text-sm text-black text-sm bg-white/20 ${fontClass}`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default LongText;
