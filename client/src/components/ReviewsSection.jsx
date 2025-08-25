import React, { useState, useEffect } from 'react';
import { FaPlus, FaFilter, FaSort } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import StarRating, { RatingBreakdown } from './StarRating';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const ReviewsSection = ({ productId, currentUser = null }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewableProducts, setReviewableProducts] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReviews: 0,
    hasNext: false,
    hasPrev: false
  });
  
  // Filters and sorting
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'highest', label: 'Highest Rating' },
    { value: 'lowest', label: 'Lowest Rating' },
    { value: 'helpful', label: 'Most Helpful' }
  ];

  // Fetch reviews for the product
  const fetchReviews = async (page = 1, sort = sortBy) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/reviews/product/${productId}?page=${page}&limit=10&sortBy=${sort}`
      );
      
      if (response.data.success) {
        setReviews(response.data.reviews);
        setStats(response.data.stats);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Don't show toast error for initial load to avoid spam
      if (reviews.length === 0) {
        console.warn('Failed to load reviews on initial load');
      } else {
        toast.error('Failed to load reviews');
      }
      // Set default values to prevent crashes
      setReviews([]);
      setStats({ averageRating: 0, totalReviews: 0, ratingDistribution: {} });
      setPagination({ currentPage: 1, totalPages: 1, totalReviews: 0, hasNext: false, hasPrev: false });
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's reviewable products
  const fetchReviewableProducts = async () => {
    if (!currentUser) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/reviews/reviewable`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setReviewableProducts(response.data.reviewableProducts);
      }
    } catch (error) {
      console.error('Error fetching reviewable products:', error);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchReviewableProducts();
  }, [productId]);

  useEffect(() => {
    fetchReviews(currentPage, sortBy);
  }, [currentPage, sortBy, productId]);

  // Listen for new reviews submitted from other pages
  useEffect(() => {
    const checkForNewReviews = () => {
      const newReviewFlag = localStorage.getItem('newReviewSubmitted');
      if (newReviewFlag) {
        // Remove the flag and refresh reviews
        localStorage.removeItem('newReviewSubmitted');
        fetchReviews(1, sortBy);
        fetchReviewableProducts();
        setCurrentPage(1);
      }
    };

    // Check immediately and set up interval to check periodically
    checkForNewReviews();
    const interval = setInterval(checkForNewReviews, 2000); // Check every 2 seconds

    // Listen for focus events to check when user returns to tab
    const handleFocus = () => checkForNewReviews();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [sortBy]);

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleReviewSubmitted = (newReview) => {
    if (editingReview) {
      // Update existing review in list
      setReviews(prev => prev.map(review => 
        review._id === editingReview._id ? newReview : review
      ));
      setEditingReview(null);
    } else {
      // Add new review to the list
      setReviews(prev => [newReview, ...prev]);
      fetchReviewableProducts(); // Refresh reviewable products
    }
    
    setShowReviewForm(false);
    fetchReviews(1, sortBy); // Refresh all reviews to update stats
  };

  const handleReviewUpdate = (review) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  const handleReviewDelete = (reviewId) => {
    setReviews(prev => prev.filter(review => review._id !== reviewId));
    fetchReviews(currentPage, sortBy); // Refresh to update stats
    fetchReviewableProducts(); // Refresh reviewable products
  };

  const canWriteReview = () => {
    if (!currentUser) return false;
    
    // Check if user has any reviewable products for this specific product
    const canReview = reviewableProducts.some(item => 
      item.product._id === productId
    );
    
    return canReview;
  };

  const getReviewOrder = () => {
    const reviewableItem = reviewableProducts.find(item => 
      item.product._id === productId
    );
    return reviewableItem?.orderId || null;
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Rating Overview */}
          <div className="lg:w-1/2">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Customer Reviews
            </h2>
            <RatingBreakdown stats={stats} />
          </div>

          {/* Write Review Section */}
          <div className="lg:w-1/2 lg:pl-8">
            {currentUser ? (
              <div className="space-y-4">
                {canWriteReview() ? (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      You purchased this product. Share your experience!
                    </p>
                    <Button
                      onClick={() => setShowReviewForm(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <FaPlus className="mr-2" />
                      Write a Review
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 p-4 bg-gray-50 rounded-lg">
                    <p>Purchase this product to write a review</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 p-4 bg-gray-50 rounded-lg">
                <p>Please login to write a review</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm
          productId={productId}
          orderId={getReviewOrder()}
          existingReview={editingReview}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={() => {
            setShowReviewForm(false);
            setEditingReview(null);
          }}
        />
      )}

      {/* Reviews List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Sort and Filter Controls */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <FaSort className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="text-sm text-gray-600">
              {pagination.totalReviews} {pagination.totalReviews === 1 ? 'review' : 'reviews'}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="p-4">
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review._id}
                  review={review}
                  currentUser={currentUser}
                  onReviewUpdate={handleReviewUpdate}
                  onReviewDelete={handleReviewDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No reviews yet</p>
              <p>Be the first to review this product!</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrev}
              >
                Previous
              </Button>
              
              <span className="px-3 py-1 text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNext}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsSection;
