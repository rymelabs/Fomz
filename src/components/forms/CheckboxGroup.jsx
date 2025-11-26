import React from 'react';
import Checkbox from '../ui/Checkbox';

const CheckboxGroup = ({ 
  question, 
  value = [], 
  onChange, 
  error,
  disabled = false,
  fontClass = ''
}) => {
  const handleCheckboxChange = (option) => {
    const newValue = value.includes(option)
      ? value.filter(v => v !== option)
      : [...value, option];
    onChange(newValue);
  };

  return (
    <div className="space-y-3">
      {question.options.map((option, index) => (
        <Checkbox
          key={index}
          label={option}
          checked={value.includes(option)}
          onChange={() => handleCheckboxChange(option)}
          disabled={disabled}
          labelClassName={fontClass}
        />
      ))}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default CheckboxGroup;
