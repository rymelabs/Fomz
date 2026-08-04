import React, { useState, useEffect } from 'react';
import Input from '../ui/Input';

const NumberInput = ({ 
  question, 
  value, 
  onChange, 
  error,
  disabled = false,
  fontClass = ''
}) => {
  const min = question.validation?.min;
  const max = question.validation?.max;
  const step = question.validation?.step || 1;
  const allowDecimals = question.validation?.allowDecimals ?? true;
  const customError = question.validation?.errorMessage;
  
  const [validationError, setValidationError] = useState('');
  
  // Real-time validation
  useEffect(() => {
    if (value === '' || value === null || value === undefined) {
      setValidationError('');
      return;
    }
    
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      setValidationError(customError || 'Please enter a valid number');
      return;
    }
    
    // Check decimals
    if (!allowDecimals && !Number.isInteger(numValue)) {
      setValidationError(customError || 'Decimals are not allowed');
      return;
    }
    
    // Check min
    if (min !== undefined && min !== '' && numValue < parseFloat(min)) {
      setValidationError(customError || `Minimum value is ${min}`);
      return;
    }
    
    // Check max
    if (max !== undefined && max !== '' && numValue > parseFloat(max)) {
      setValidationError(customError || `Maximum value is ${max}`);
      return;
    }
    
    setValidationError('');
  }, [value, min, max, allowDecimals, customError]);
  
  const handleChange = (e) => {
    let newValue = e.target.value;
    
    // If decimals not allowed, remove decimal part
    if (!allowDecimals && newValue.includes('.')) {
      newValue = newValue.split('.')[0];
    }
    
    onChange(newValue);
  };
  
  const displayError = error || validationError;
  
  return (
    <div>
      <Input
        type="number"
        value={value || ''}
        onChange={handleChange}
        placeholder={question.placeholder || '0'}
        error={displayError}
        disabled={disabled}
        required={question.required}
        min={min}
        max={max}
        step={allowDecimals ? step : 1}
        className={fontClass}
      />
      {(min !== undefined && min !== '') || (max !== undefined && max !== '') ? (
        <p className="text-xs text-gray-400 mt-1">
          {min !== undefined && min !== '' && `Min: ${min}`}
          {min !== undefined && min !== '' && max !== undefined && max !== '' && ' · '}
          {max !== undefined && max !== '' && `Max: ${max}`}
        </p>
      ) : null}
    </div>
  );
};

export default NumberInput;
