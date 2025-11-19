import React from 'react';

const ImageBlock = ({ question }) => {
  if (!question.imageUrl) return null;

  return (
    <div className="w-full flex justify-center my-4">
      <img 
        src={question.imageUrl} 
        alt={question.title || 'Form image'} 
        className="max-w-full h-auto rounded-lg shadow-md object-contain max-h-[500px]"
        style={{ borderRadius: 'var(--element-radius, 0.5rem)' }}
      />
    </div>
  );
};

export default ImageBlock;
