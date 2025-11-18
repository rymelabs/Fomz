import React from 'react';

const RadioButton = ({ 
  label, 
  value, 
  checked, 
  onChange, 
  name,
  disabled = false,
  className = '' 
}) => {
  return (
    <label className={`flex items-start cursor-pointer ${className}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 transition-colors"
      />
      <span className="ml-2 text-sm text-gray-700">{label}</span>
    </label>
  );
};

export default RadioButton;
