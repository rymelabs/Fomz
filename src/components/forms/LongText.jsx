import React, { useState, useEffect } from 'react';

const LongText = ({ 
  question, 
  value, 
  onChange, 
  error,
  disabled = false,
  fontClass = ''
}) => {
  const currentLength = (value || '').length;
  // Support both old (min/max) and new (minLength/maxLength) field names
  const maxLength = question.validation?.maxLength ?? question.validation?.max;
  const minLength = question.validation?.minLength ?? question.validation?.min;
  const pattern = question.validation?.pattern;
  const customError = question.validation?.errorMessage;
  
  const [validationError, setValidationError] = useState('');
  
  // Real-time validation
  useEffect(() => {
    if (!value) {
      setValidationError('');
      return;
    }
    
    // Check min length
    if (minLength && currentLength < minLength) {
      setValidationError(customError || `Minimum ${minLength} characters required`);
      return;
    }
    
    // Check pattern
    if (pattern && value) {
      try {
        const regex = new RegExp(pattern);
        if (!regex.test(value)) {
          const patternName = question.validation?.patternName || 'format';
          setValidationError(customError || `Please match the required ${patternName}`);
          return;
        }
      } catch (e) {
        // Invalid regex, skip pattern validation
      }
    }
    
    setValidationError('');
  }, [value, minLength, pattern, customError, currentLength, question.validation?.patternName]);
  
  // Determine character count color
  const getCounterColor = () => {
    if (maxLength && currentLength >= maxLength) return 'text-red-500';
    if (maxLength && currentLength >= maxLength * 0.9) return 'text-amber-500';
    return 'text-gray-400';
  };
  
  const displayError = error || validationError;
  
  return (
    <div>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder || 'Your answer'}
        disabled={disabled}
        required={question.required}
        minLength={minLength}
        maxLength={maxLength}
        rows={4}
        className={`w-full px-3 py-1.5 rounded-[10px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none placeholder:text-sm text-black text-sm bg-white/20 ${displayError ? 'border-2 border-red-500' : ''} ${fontClass}`}
      />
      <div className="flex items-center justify-between mt-1">
        {displayError ? (
          <p className="text-sm text-red-600">{displayError}</p>
        ) : (
          <span></span>
        )}
        {(maxLength || minLength) && (
          <p className={`text-xs ${getCounterColor()}`}>
            {currentLength}{maxLength ? `/${maxLength}` : ''} characters
            {minLength && currentLength < minLength && currentLength > 0 && (
              <span className="text-amber-500"> (min {minLength})</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
};

export default LongText;
