import React from 'react';
import { Star } from 'lucide-react';

const Rating = ({ 
  question, 
  value, 
  onChange, 
  error,
  disabled = false,
  maxRating = 5 
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  return (
    <div>
      <div className="flex gap-2">
        {[...Array(maxRating)].map((_, index) => {
          const ratingValue = index + 1;
          return (
            <button
              key={index}
              type="button"
              onClick={() => !disabled && onChange(ratingValue)}
              onMouseEnter={() => !disabled && setHoverRating(ratingValue)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={disabled}
              className="transition-transform hover:scale-110 focus:outline-none"
            >
              <Star
                className={`h-8 w-8 ${
                  ratingValue <= (hoverRating || value)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          );
        })}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Rating;
