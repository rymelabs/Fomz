import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  icon: Icon,
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95';
  
  const variants = {
    primary: 'bg-[var(--fomz-primary)] hover:bg-[var(--fomz-primary-dark)] text-[var(--fomz-on-primary)] shadow-[var(--fomz-button-shadow)] focus:ring-[var(--fomz-primary)]',
    secondary: 'bg-[var(--fomz-secondary)]/10 text-[var(--fomz-secondary)] hover:bg-[var(--fomz-secondary)]/20 focus:ring-[var(--fomz-secondary)]',
    outline: 'border-2 border-[var(--fomz-primary)] text-[var(--fomz-primary)] hover:bg-[var(--fomz-primary)]/10 focus:ring-[var(--fomz-primary)]',
    ghost: 'text-[var(--fomz-surface-muted)] hover:bg-[var(--fomz-primary)]/10 focus:ring-[var(--fomz-primary)]',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {Icon && !loading && <Icon className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
};

export default Button;
