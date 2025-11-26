import React from 'react';
import RadioButton from '../ui/RadioButton';

const MultipleChoice = ({ 
  question, 
  value, 
  onChange, 
  error,
  disabled = false,
  fontClass = ''
}) => {
  return (
    <div className="space-y-3">
      {question.options.map((option, index) => (
        <RadioButton
          key={index}
          name={question.id}
          label={option}
          value={option}
          checked={value === option}
          onChange={(e) => onChange(e.target.value)}
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

export default MultipleChoice;
