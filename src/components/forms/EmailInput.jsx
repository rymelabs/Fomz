import React, { useState, useEffect } from 'react';
import Input from '../ui/Input';

const EmailInput = ({ 
  question, 
  value, 
  onChange, 
  error,
  disabled = false,
  fontClass = ''
}) => {
  const [validationError, setValidationError] = useState('');
  
  // Stricter email validation regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  
  // Real-time email validation
  useEffect(() => {
    if (!value) {
      setValidationError('');
      return;
    }
    
    // Check for common email mistakes
    if (!value.includes('@')) {
      setValidationError('Email must contain @ symbol');
      return;
    }
    
    const [localPart, domain] = value.split('@');
    
    if (!localPart) {
      setValidationError('Email address is incomplete');
      return;
    }
    
    if (!domain) {
      setValidationError('Please enter a domain (e.g., gmail.com)');
      return;
    }
    
    if (!domain.includes('.')) {
      setValidationError('Domain must include a TLD (e.g., .com)');
      return;
    }
    
    // Full regex check
    if (!emailRegex.test(value)) {
      setValidationError('Please enter a valid email address');
      return;
    }
    
    // Check for common typos in domains
    const commonDomainTypos = {
      'gmial.com': 'gmail.com',
      'gmal.com': 'gmail.com',
      'gamil.com': 'gmail.com',
      'gmail.co': 'gmail.com',
      'yahho.com': 'yahoo.com',
      'yahooo.com': 'yahoo.com',
      'yaho.com': 'yahoo.com',
      'hotmal.com': 'hotmail.com',
      'hotmial.com': 'hotmail.com',
      'outlok.com': 'outlook.com',
      'outloo.com': 'outlook.com'
    };
    
    const lowerDomain = domain.toLowerCase();
    if (commonDomainTypos[lowerDomain]) {
      setValidationError(`Did you mean ${localPart}@${commonDomainTypos[lowerDomain]}?`);
      return;
    }
    
    setValidationError('');
  }, [value]);
  
  const displayError = error || validationError;
  
  return (
    <div>
      <Input
        type="email"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder || 'your@email.com'}
        error={displayError}
        disabled={disabled}
        required={question.required}
        style={{ borderRadius: '9999px' }}
        className={fontClass}
      />
      {validationError && validationError.includes('Did you mean') && (
        <button
          type="button"
          className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline"
          onClick={() => {
            const corrected = validationError.match(/Did you mean (.+)\?/)?.[1];
            if (corrected) onChange(corrected);
          }}
        >
          Use suggested email
        </button>
      )}
    </div>
  );
};

export default EmailInput;
