import React from 'react';

const Checkbox = ({ 
  label, 
  checked, 
  onChange, 
  disabled = false,
  error,
  helpText,
  className = '' 
}) => {
  return (
    <div className={className}>
      <label className="flex items-start cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors"
        />
        <span className="ml-2 text-sm text-gray-700">{label}</span>
      </label>
      
      {error && (
        <p className="mt-1 ml-6 text-sm text-red-600">{error}</p>
      )}
      
      {helpText && !error && (
        <p className="mt-1 ml-6 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

export default Checkbox;
