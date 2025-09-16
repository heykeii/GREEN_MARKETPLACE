import React, { useState, useRef } from 'react';
import { FaImage, FaTimes, FaStar } from 'react-icons/fa';
import { toast } from '@/utils/toast';
import axios from 'axios';
import StarRating from './StarRating';
import { Button } from './ui/button';
import { Label } from './ui/label';

const ReviewForm = ({ 
  productId, 
  orderId, 
  onReviewSubmitted = null,
  onCancel = null,
  existingReview = null // For editing existing reviews
}) => {
  const [formData, setFormData] = useState({
    rating: existingReview?.rating || 0,
    comment: existingReview?.comment || ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState(existingReview?.images || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = imagePreviews.length + files.length;
    
    if (totalImages > 5) {
      toast.error('Maximum 5 images allowed per review');
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Add new images to state
    setImages(prev => [...prev, ...validFiles]);

    // Create preview URLs for new images
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    // If it's an existing image URL (string), just remove from previews
    if (typeof imagePreviews[index] === 'string' && imagePreviews[index].startsWith('http')) {
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      // It's a new image, remove from both arrays
      const newImageIndex = imagePreviews.slice(0, index).filter(preview => 
        !preview.startsWith('http')
      ).length;
      
      setImages(prev => prev.filter((_, i) => i !== newImageIndex));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const clearAllImages = () => {
    setImages([]);
    setImagePreviews(existingReview?.images || []);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    if (formData.rating === 0) {
      toast.error('Please select a rating');
      return false;
    }
    if (!formData.comment.trim()) {
      toast.error('Please write a review comment');
      return false;
    }
    if (formData.comment.length > 1000) {
      toast.error('Review comment must be less than 1000 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Create FormData for multipart form submission
      const submitData = new FormData();
      
      if (!existingReview) {
        // Creating new review
        submitData.append('productId', productId);
        submitData.append('orderId', orderId);
      }
      
      submitData.append('rating', formData.rating.toString());
      submitData.append('comment', formData.comment.trim());

      // Add new image files
      images.forEach((image) => {
        submitData.append('images', image);
      });

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to submit a review');
        return;
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      let response;
      if (existingReview) {
        // Update existing review
        response = await axios.put(
          `${import.meta.env.VITE_API_URL}/api/v1/reviews/${existingReview._id}`,
          submitData,
          config
        );
      } else {
        // Create new review
        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/v1/reviews`,
          submitData,
          config
        );
      }

      if (response.data.success) {
        toast.success(
          existingReview 
            ? 'Review updated successfully!' 
            : 'Review submitted successfully!'
        );
        
        // Reset form
        if (!existingReview) {
          setFormData({ rating: 0, comment: '' });
          setImages([]);
          setImagePreviews([]);
        }

        if (onReviewSubmitted) {
          onReviewSubmitted(response.data.review);
        }
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit review';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {existingReview ? 'Edit Your Review' : 'Write a Review'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Section */}
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </Label>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange(star)}
                  className="focus:outline-none hover:scale-110 transition-transform duration-150 p-1"
                >
                  <FaStar
                    className={`text-2xl ${
                      formData.rating >= star
                        ? 'text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-2">
              {formData.rating > 0 && `${formData.rating} star${formData.rating !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {/* Comment Section */}
        <div>
          <Label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Review Comment *
          </Label>
          <textarea
            id="comment"
            name="comment"
            rows={4}
            value={formData.comment}
            onChange={handleInputChange}
            placeholder="Share your experience with this product..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            maxLength={1000}
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>Share your honest experience to help other buyers</span>
            <span>{formData.comment.length}/1000</span>
          </div>
        </div>

        {/* Image Upload Section */}
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            Add Photos (Optional)
          </Label>
          <p className="text-sm text-gray-500 mb-3">
            Upload photos of the product to help other buyers (Max 5 images, 5MB each)
          </p>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Controls */}
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              disabled={imagePreviews.length >= 5}
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={imagePreviews.length >= 5}
              className="flex items-center gap-2"
            >
              <FaImage />
              Add Photos
            </Button>

            {imagePreviews.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={clearAllImages}
                className="text-red-600 hover:text-red-700"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || formData.rating === 0 || !formData.comment.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
          >
            {isSubmitting 
              ? (existingReview ? 'Updating...' : 'Submitting...') 
              : (existingReview ? 'Update Review' : 'Submit Review')
            }
          </Button>

          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
