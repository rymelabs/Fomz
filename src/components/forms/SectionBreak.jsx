import React from 'react';

const SectionBreak = ({ question }) => {
  return (
    <div className="py-6">
      <div className="border-t-2 border-gray-200"></div>
      {question.label && (
        <h3 className="mt-4 text-lg font-semibold text-gray-700">
          {question.label}
        </h3>
      )}
      {question.helpText && (
        <p className="mt-2 text-sm text-gray-500">
          {question.helpText}
        </p>
      )}
    </div>
  );
};

export default SectionBreak;
