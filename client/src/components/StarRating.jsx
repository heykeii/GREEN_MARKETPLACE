import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

const StarRating = ({ 
  rating, 
  maxRating = 5, 
  size = 'md', 
  interactive = false, 
  onRatingChange = null,
  showCount = false,
  reviewCount = 0
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  };

  const renderStars = () => {
    const stars = [];
    
    for (let i = 1; i <= maxRating; i++) {
      let starIcon;
      
      if (rating >= i) {
        // Full star
        starIcon = <FaStar key={i} className="text-yellow-400" />;
      } else if (rating >= i - 0.5) {
        // Half star
        starIcon = <FaStarHalfAlt key={i} className="text-yellow-400" />;
      } else {
        // Empty star
        starIcon = <FaRegStar key={i} className="text-gray-300" />;
      }

      if (interactive && onRatingChange) {
        stars.push(
          <button
            key={i}
            type="button"
            onClick={() => onRatingChange(i)}
            onMouseEnter={() => {
              // Optional: Add hover effect for interactive stars
            }}
            className="focus:outline-none hover:scale-110 transition-transform duration-150"
          >
            {rating >= i ? (
              <FaStar className="text-yellow-400" />
            ) : (
              <FaRegStar className="text-gray-300 hover:text-yellow-300" />
            )}
          </button>
        );
      } else {
        stars.push(starIcon);
      }
    }
    
    return stars;
  };

  return (
    <div className="flex items-center gap-1">
      <div className={`flex items-center gap-0.5 ${sizeClasses[size]}`}>
        {renderStars()}
      </div>
      
      {!interactive && (
        <span className="text-sm text-gray-600 ml-1">
          {rating ? rating.toFixed(1) : '0.0'}
        </span>
      )}
      
      {showCount && reviewCount > 0 && (
        <span className="text-sm text-gray-500 ml-1">
          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
};

// Component for rating statistics/breakdown
export const RatingBreakdown = ({ stats }) => {
  if (!stats || stats.totalReviews === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No reviews yet
      </div>
    );
  }

  const { averageRating, totalReviews, ratingDistribution } = stats;

  return (
    <div className="space-y-3">
      {/* Overall Rating */}
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold text-gray-900">
          {averageRating.toFixed(1)}
        </div>
        <div>
          <StarRating rating={averageRating} size="lg" />
          <div className="text-sm text-gray-600 mt-1">
            Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </div>
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratingDistribution[star] || 0;
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
          
          return (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-8 text-right">{star}</span>
              <FaStar className="text-yellow-400 text-xs" />
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-gray-600">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StarRating;
