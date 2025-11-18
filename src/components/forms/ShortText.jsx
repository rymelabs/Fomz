import React from 'react';
import Input from '../ui/Input';

const ShortText = ({ 
  question, 
  value, 
  onChange, 
  error,
  disabled = false 
}) => {
  return (
    <Input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.placeholder || 'Your answer'}
      error={error}
      disabled={disabled}
      required={question.required}
      minLength={question.validation?.min}
      maxLength={question.validation?.max}
      pattern={question.validation?.pattern}
    />
  );
};

export default ShortText;
