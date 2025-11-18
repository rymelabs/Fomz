import React from 'react';
import Input from '../ui/Input';

const EmailInput = ({ 
  question, 
  value, 
  onChange, 
  error,
  disabled = false 
}) => {
  return (
    <Input
      type="email"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.placeholder || 'your@email.com'}
      error={error}
      disabled={disabled}
      required={question.required}
    />
  );
};

export default EmailInput;
