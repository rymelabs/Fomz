import React from 'react';

const ProgressBar = ({ current, total, showLabel = true, className = '' }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-[var(--fomz-surface-text)]">
            Question {current} of {total}
          </span>
          <span className="text-sm font-medium text-[var(--fomz-surface-text)]">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      
      <div className="w-full bg-white/30 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-[var(--fomz-primary)] h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
