import React, { useState } from 'react';
import { FaThumbsUp, FaFlag, FaEdit, FaTrash, FaUser, FaReply } from 'react-icons/fa';
import { toast } from '@/utils/toast';
import axios from 'axios';
import StarRating from './StarRating';

const ReviewCard = ({ 
  review, 
  currentUser = null, 
  onReviewUpdate = null,
  onReviewDelete = null 
}) => {
  const [helpfulVotes, setHelpfulVotes] = useState(review?.helpfulVotes || 0);
  const [userVoted, setUserVoted] = useState(
    Boolean(
      currentUser && Array.isArray(review?.helpfulBy) && review.helpfulBy.includes(currentUser._id)
    )
  );
  const [isVoting, setIsVoting] = useState(false);
  const [replyEditing, setReplyEditing] = useState(false);
  const [replyText, setReplyText] = useState(review.sellerReply?.content || '');
  const [localReply, setLocalReply] = useState(review.sellerReply?.content || '');
  const [savingReply, setSavingReply] = useState(false);

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

  const reviewer = review?.reviewer || null;
  const reviewerId = reviewer
    ? (typeof reviewer === 'object' && reviewer !== null ? reviewer._id : reviewer)
    : null;
  const isOwnReview = Boolean(
    currentUser && reviewerId && currentUser._id && String(reviewerId) === String(currentUser._id)
  );
  const sellerIdOfReview = review && review.seller
    ? (typeof review.seller === 'object' && review.seller !== null ? review.seller._id : review.seller)
    : null;
  const canReply = Boolean(
    currentUser && sellerIdOfReview && currentUser._id && String(sellerIdOfReview) === String(currentUser._id)
  );

  const saveReply = async () => {
    if (!replyText.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }
    try {
      setSavingReply(true);
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || localStorage.getItem('userToken');
      const base = import.meta?.env?.VITE_API_URL || '';
      const res = await axios.post(`${base}/api/v1/reviews/${review._id}/reply`, { content: replyText.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        toast.success('Reply saved');
        setReplyEditing(false);
        setLocalReply(replyText.trim());
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to save reply');
    } finally {
      setSavingReply(false);
    }
  };

  const removeReply = async () => {
    if (!window.confirm('Delete this reply?')) return;
    try {
      setSavingReply(true);
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || localStorage.getItem('userToken');
      const base = import.meta?.env?.VITE_API_URL || '';
      const res = await axios.delete(`${base}/api/v1/reviews/${review._id}/reply`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        toast.success('Reply deleted');
        setReplyText('');
        setReplyEditing(false);
        setLocalReply('');
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to delete reply');
    } finally {
      setSavingReply(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      {/* Reviewer Info and Rating */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            {reviewer?.profilePicture ? (
              <img
                src={reviewer.profilePicture}
                alt={reviewer.firstName || 'Reviewer'}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <FaUser className="text-emerald-600" />
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {(reviewer?.firstName || 'Anonymous')} {reviewer?.lastName || ''}
              {review.isVerifiedPurchase && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                  Verified Purchase
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {review?.createdAt ? formatDate(review.createdAt) : ''}
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
        {Array.isArray(review?.images) && review.images.length > 0 && (
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
          <span>{helpfulVotes}</span>
        </button>

        <div className="flex items-center gap-2">
          {canReply ? (
            <button
              onClick={() => setReplyEditing(true)}
              className="flex items-center gap-2 px-3 py-1 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              title="Reply to this review"
            >
              <FaReply className="text-xs" />
              <span>Reply</span>
            </button>
          ) : null}
          {/* Report button (for other users' reviews) */}
          {!isOwnReview && currentUser ? (
            <button className="flex items-center gap-2 px-3 py-1 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              <FaFlag className="text-xs" />
              <span>Report</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Seller Reply Section */}
      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Seller reply</div>
        {localReply && !replyEditing ? (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-700">
            {localReply}
            {canReply ? (
              <div className="mt-2 flex gap-3">
                <button onClick={() => setReplyEditing(true)} className="text-xs text-emerald-700 hover:underline">Edit reply</button>
                <button onClick={removeReply} className="text-xs text-red-600 hover:underline">Delete reply</button>
              </div>
            ) : null}
          </div>
        ) : null}
        {canReply ? (
          <div className="mt-2">
            {(!localReply || replyEditing) ? (
              <div className="space-y-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply to this review"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    disabled={savingReply}
                    onClick={saveReply}
                    className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {savingReply ? 'Saving...' : 'Save reply'}
                  </button>
                  {replyEditing ? (
                    <button
                      type="button"
                      onClick={() => setReplyEditing(false)}
                      className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>

  );
};

export default ReviewCard;
