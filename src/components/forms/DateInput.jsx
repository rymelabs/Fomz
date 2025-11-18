import React from 'react';
import Input from '../ui/Input';

const DateInput = ({ 
  question, 
  value, 
  onChange, 
  error,
  disabled = false 
}) => {
  return (
    <Input
      type="date"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      disabled={disabled}
      required={question.required}
    />
  );
};

export default DateInput;
