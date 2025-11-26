import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  type = 'text',
  label,
  error,
  helpText,
  className = '',
  containerClassName = '',
  icon: Icon,
  ...props 
}, ref) => {
  const baseStyles = 'w-full px-3 py-1.5 border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:scale-[1.01] focus:shadow-md text-black bg-white/20 text-sm';
  
  const errorStyles = error ? 'border-red-500' : 'border-gray-300';
  
  return (
    <div className={`${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        
        <input
          ref={ref}
          type={type}
          className={`${baseStyles} ${errorStyles} ${Icon ? 'pl-10' : ''} ${className}`}
          style={{ borderRadius: 'var(--element-radius, 9999px)', ...props.style }}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
