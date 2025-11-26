import React from 'react';
import Input from '../ui/Input';

const EmailInput = ({ 
  question, 
  value, 
  onChange, 
  error,
  disabled = false,
  fontClass = ''
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
      style={{ borderRadius: '9999px' }}
      className={fontClass}
    />
  );
};

export default EmailInput;
