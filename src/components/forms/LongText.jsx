import React from 'react';

const LongText = ({ 
  question, 
  value, 
  onChange, 
  error,
  disabled = false 
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
        rows={5}
        className={`w-full px-4 py-2 border rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default LongText;
