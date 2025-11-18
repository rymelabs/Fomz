import React from 'react';

const Card = ({ 
  children, 
  className = '',
  hover = false,
  variant = 'default',
  style = {},
  onClick
}) => {
  const hoverStyles = hover ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer' : '';

  const variants = {
    default: {
      className: 'bg-white shadow-soft',
      style: {}
    },
    surface: {
      className: 'border',
      style: {
        background: 'var(--fomz-surface)',
        color: 'var(--fomz-surface-text)',
        borderColor: 'var(--fomz-surface-border)',
        boxShadow: 'var(--fomz-card-shadow)'
      }
    },
    glass: {
      className: 'border border-white/30 backdrop-blur-xl',
      style: {
        background: 'rgba(255, 255, 255, 0.82)',
        color: 'var(--fomz-surface-text)',
        boxShadow: 'var(--fomz-card-shadow)'
      }
    }
  };

  const variantStyles = variants[variant] || variants.default;
  
  return (
    <div 
      className={`rounded-xl p-5 transition-all duration-200 ${variantStyles.className} ${hoverStyles} ${className}`}
      style={{ ...variantStyles.style, ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
