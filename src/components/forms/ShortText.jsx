import React, { useState, useEffect } from 'react';
import Input from '../ui/Input';

const ShortText = ({ 
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
      <Input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder || 'Your answer'}
        error={displayError}
        disabled={disabled}
        required={question.required}
        minLength={minLength}
        maxLength={maxLength}
        style={{ borderRadius: '9999px' }}
        className={fontClass}
      />
      {(maxLength || minLength) && (
        <p className={`text-xs mt-1 text-right ${getCounterColor()}`}>
          {currentLength}{maxLength ? `/${maxLength}` : ''} characters
          {minLength && currentLength < minLength && currentLength > 0 && (
            <span className="text-amber-500"> (min {minLength})</span>
          )}
        </p>
      )}
    </div>
  );
};

export default ShortText;
