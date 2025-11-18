import React from 'react';
import { useTheme } from '../../hooks/useTheme';

const GradientPanel = ({ 
  children, 
  gradient = 'blue',
  lockGradient = false,
  className = '',
  contentClassName = '',
  style = {}
}) => {
  const { themeData } = useTheme();

  const gradients = {
    blue: 'bg-gradient-blue',
    green: 'bg-gradient-green',
    mixed: 'bg-gradient-mixed',
    soft: 'bg-gradient-soft',
  };

  const themedBackground = !lockGradient && themeData?.gradient;
  const backgroundClass = themedBackground ? '' : gradients[gradient] || gradients.blue;
  const backgroundStyle = themedBackground
    ? { background: themeData.gradient, ...style }
    : style;
  
  return (
    <div
      className={`min-h-screen ${backgroundClass} ${className}`}
      style={backgroundStyle}
    >
      <div className={`container mx-auto px-4 py-8 ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default GradientPanel;
