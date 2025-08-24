import React, { useState } from 'react';
import { FaThumbsUp, FaFlag, FaEdit, FaTrash, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import StarRating from './StarRating';

const ReviewCard = ({ 
  review, 
  currentUser = null, 
  onReviewUpdate = null,
  onReviewDelete = null 
}) => {
  const [helpfulVotes, setHelpfulVotes] = useState(review.helpfulVotes || 0);
  const [userVoted, setUserVoted] = useState(
    currentUser && review.helpfulBy 
      ? review.helpfulBy.includes(currentUser._id) 
      : false
  );
  const [isVoting, setIsVoting] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleHelpfulVote = async () => {
    if (!currentUser) {
      toast.error('Please login to vote on reviews');
      return;
    }

    if (isVoting) return;

    try {
      setIsVoting(true);
      const token = localStorage.getItem('userToken');
      
      const response = await axios.post(
        `/api/v1/reviews/${review._id}/helpful`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setHelpfulVotes(response.data.helpfulVotes);
        setUserVoted(response.data.userVoted);
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error('Error voting on review:', error);
      toast.error('Failed to vote on review');
    } finally {
      setIsVoting(false);
    }
  };

  const handleEdit = () => {
    if (onReviewUpdate) {
      onReviewUpdate(review);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const token = localStorage.getItem('userToken');
      
      const response = await axios.delete(
        `/api/v1/reviews/${review._id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Review deleted successfully');
        if (onReviewDelete) {
          onReviewDelete(review._id);
        }
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const isOwnReview = currentUser && review.reviewer._id === currentUser._id;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      {/* Reviewer Info and Rating */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            {review.reviewer.profilePicture ? (
              <img
                src={review.reviewer.profilePicture}
                alt={review.reviewer.firstName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <FaUser className="text-emerald-600" />
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {review.reviewer.firstName} {review.reviewer.lastName}
              {review.isVerifiedPurchase && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                  Verified Purchase
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(review.createdAt)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} size="sm" />
          
          {/* Action buttons for own review */}
          {isOwnReview && (
            <div className="flex items-center gap-1 ml-4">
              <button
                onClick={handleEdit}
                className="p-1 text-gray-400 hover:text-emerald-600 transition-colors"
                title="Edit review"
              >
                <FaEdit className="text-sm" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete review"
              >
                <FaTrash className="text-sm" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Review Content */}
      <div className="space-y-3">
        <p className="text-gray-700 leading-relaxed">
          {review.comment}
        </p>

        {/* Review Images */}
        {review.images && review.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {review.images.map((image, index) => (
              <div 
                key={index}
                className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  // Open image in modal or new tab
                  window.open(image, '_blank');
                }}
              >
                <img
                  src={image}
                  alt={`Review image ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <button
          onClick={handleHelpfulVote}
          disabled={isVoting || !currentUser}
          className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-colors ${
            userVoted
              ? 'bg-emerald-100 text-emerald-700'
              : 'text-gray-600 hover:bg-gray-100'
          } ${!currentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <FaThumbsUp className="text-xs" />
          <span>Helpful ({helpfulVotes})</span>
        </button>

        {/* Report button (for other users' reviews) */}
        {!isOwnReview && currentUser && (
          <button className="flex items-center gap-2 px-3 py-1 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors">
            <FaFlag className="text-xs" />
            <span>Report</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
