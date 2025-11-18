import React from 'react';
import Input from '../ui/Input';

const NumberInput = ({ 
  question, 
  value, 
  onChange, 
  error,
  disabled = false 
}) => {
  return (
    <Input
      type="number"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.placeholder || '0'}
      error={error}
      disabled={disabled}
      required={question.required}
      min={question.validation?.min}
      max={question.validation?.max}
    />
  );
};

export default NumberInput;
