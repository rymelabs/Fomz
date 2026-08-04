import React from 'react';

const SliderInput = ({ 
  question, 
  value, 
  onChange, 
  error,
  disabled = false,
  fontClass = ''
}) => {
  const min = question.validation?.min ?? 1;
  const max = question.validation?.max ?? 10;
  const step = question.validation?.step || 1;
  const showTicks = question.validation?.showTicks ?? true;
  const unit = question.validation?.unit || '';
  const currentValue = value !== undefined && value !== '' ? Number(value) : min;
  
  // Calculate percentage for gradient
  const percentage = ((currentValue - min) / (max - min)) * 100;
  
  // Generate tick marks
  const ticks = [];
  for (let i = min; i <= max; i += step) {
    ticks.push(i);
  }

  // Labels for endpoints (optional)
  const minLabel = question.minLabel || min;
  const maxLabel = question.maxLabel || max;

  return (
    <div className="space-y-4">
      {/* Current Value Display */}
      <div className="flex justify-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 border-2 border-primary-200">
          <span className={`text-2xl font-bold text-primary-600 ${fontClass}`}>
            {currentValue}{unit && <span className="text-sm ml-0.5">{unit}</span>}
          </span>
        </div>
      </div>
      
      {/* Slider Container */}
      <div className="relative px-2">
        {/* Track */}
        <div className="relative h-2 rounded-full bg-gray-200">
          {/* Filled Track */}
          <div 
            className="absolute h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-150"
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Range Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          style={{ margin: 0 }}
        />
        
        {/* Custom Thumb */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-primary-500 shadow-md transition-all duration-150 pointer-events-none"
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
      </div>
      
      {/* Tick Marks */}
      {showTicks && ticks.length <= 11 && (
        <div className="relative flex justify-between px-2">
          {ticks.map((tick) => (
            <button
              key={tick}
              type="button"
              onClick={() => !disabled && onChange(tick)}
              disabled={disabled}
              className={`flex flex-col items-center transition-colors ${
                tick === currentValue 
                  ? 'text-primary-600 font-semibold' 
                  : 'text-gray-400 hover:text-gray-600'
              } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className={`w-1 h-1 rounded-full mb-1 ${
                tick === currentValue ? 'bg-primary-600' : 'bg-gray-300'
              }`} />
              <span className="text-xs">{tick}{unit}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* Labels */}
      {(question.minLabel || question.maxLabel) && (
        <div className="flex justify-between text-xs text-gray-500 px-2">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
      
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};

export default SliderInput;
