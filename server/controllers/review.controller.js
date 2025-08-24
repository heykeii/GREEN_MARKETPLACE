import mongoose from 'mongoose';
import Review from '../models/reviews.model.js';
import Order from '../models/orders.model.js';
import Product from '../models/products.model.js';
import User from '../models/user.model.js';
import cloudinary from '../utils/cloudinary.js';

// Helper function for error responses
const errorResponse = (res, statusCode, message, error = null, details = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error || message,
    details: details || null,
  });
};

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;
    const reviewerId = req.user._id;

    // Validate required fields
    if (!productId || !orderId || !rating || !comment) {
      return errorResponse(res, 400, 'Missing required fields: productId, orderId, rating, comment');
    }

    // Validate rating
    if (!Number.isInteger(Number(rating)) || rating < 1 || rating > 5) {
      return errorResponse(res, 400, 'Rating must be a whole number between 1 and 5');
    }

    // Check if order exists and belongs to the user
    const order = await Order.findOne({ 
      _id: orderId, 
      customer: reviewerId,
      status: 'completed' // Only allow reviews for completed orders
    }).populate('items.product');

    if (!order) {
      return errorResponse(res, 404, 'Order not found or not completed');
    }

    // Check if the product was actually purchased in this order
    const orderedProduct = order.items.find(item => 
      item.product._id.toString() === productId
    );

    if (!orderedProduct) {
      return errorResponse(res, 400, 'Product not found in this order');
    }

    // Check if product already reviewed for this order
    const existingReview = await Review.findOne({
      reviewer: reviewerId,
      product: productId,
      order: orderId
    });

    if (existingReview) {
      return errorResponse(res, 400, 'You have already reviewed this product for this order');
    }

    // Handle image uploads to Cloudinary
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      if (req.files.length > 5) {
        return errorResponse(res, 400, 'Maximum 5 images allowed per review');
      }

      try {
        const uploadPromises = req.files.map(file => {
          return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                folder: 'reviews',
                resource_type: 'auto',
                transformation: [
                  { width: 800, height: 600, crop: 'limit' },
                  { quality: 'auto:good' }
                ]
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
              }
            ).end(file.buffer);
          });
        });
        
        imageUrls = await Promise.all(uploadPromises);
      } catch (uploadError) {
        return errorResponse(res, 500, 'Image upload failed', uploadError.message);
      }
    }

    // Get product and seller info
    const product = await Product.findById(productId).populate('seller');
    if (!product) {
      return errorResponse(res, 404, 'Product not found');
    }

    // Create the review
    const newReview = new Review({
      reviewer: reviewerId,
      product: productId,
      seller: product.seller._id,
      order: orderId,
      rating: Number(rating),
      comment: comment.trim(),
      images: imageUrls,
      isVerifiedPurchase: true
    });

    await newReview.save();

    // Update order to mark this product as reviewed
    await Order.findByIdAndUpdate(orderId, {
      $addToSet: {
        reviewedItems: {
          product: productId,
          reviewedAt: new Date()
        }
      }
    });

    // Populate the review for response
    const populatedReview = await Review.findById(newReview._id)
      .populate('reviewer', 'firstName lastName profilePicture')
      .populate('product', 'name images')
      .populate('seller', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review: populatedReview
    });

  } catch (error) {
    console.error('Create review error:', error);
    return errorResponse(res, 500, 'Internal server error', error.message);
  }
};

// Get reviews for a specific product
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sortBy = 'newest' } = req.query;

    // Build sort object
    let sort = {};
    switch (sortBy) {
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'highest':
        sort = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sort = { rating: 1, createdAt: -1 };
        break;
      case 'helpful':
        sort = { helpfulVotes: -1, createdAt: -1 };
        break;
      default:
        sort = { createdAt: -1 }; // newest
    }

    const skip = (page - 1) * limit;

    // Get reviews with pagination
    const reviews = await Review.find({ 
      product: productId, 
      isVisible: true 
    })
      .populate('reviewer', 'firstName lastName profilePicture')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Get total count and rating statistics
    const totalReviews = await Review.countDocuments({ 
      product: productId, 
      isVisible: true 
    });

    const ratingStats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId), isVisible: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingBreakdown: {
            $push: '$rating'
          }
        }
      }
    ]);

    // Calculate rating distribution
    let ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (ratingStats.length > 0) {
      ratingStats[0].ratingBreakdown.forEach(rating => {
        ratingDistribution[rating]++;
      });
    }

    const stats = ratingStats.length > 0 ? {
      averageRating: Math.round(ratingStats[0].averageRating * 10) / 10,
      totalReviews: ratingStats[0].totalReviews,
      ratingDistribution
    } : {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution
    };

    res.json({
      success: true,
      reviews,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasNext: (page * limit) < totalReviews,
        hasPrev: page > 1
      },
      stats
    });

  } catch (error) {
    console.error('Get product reviews error:', error);
    return errorResponse(res, 500, 'Internal server error', error.message);
  }
};

// Get user's own reviews
export const getUserReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const reviews = await Review.find({ reviewer: userId })
      .populate('product', 'name images')
      .populate('seller', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalReviews = await Review.countDocuments({ reviewer: userId });

    res.json({
      success: true,
      reviews,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasNext: (page * limit) < totalReviews,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get user reviews error:', error);
    return errorResponse(res, 500, 'Internal server error', error.message);
  }
};

// Update a review
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    // Find the review
    const review = await Review.findOne({ 
      _id: reviewId, 
      reviewer: userId 
    });

    if (!review) {
      return errorResponse(res, 404, 'Review not found or you are not authorized to edit it');
    }

    // Validate new rating if provided
    if (rating && (!Number.isInteger(Number(rating)) || rating < 1 || rating > 5)) {
      return errorResponse(res, 400, 'Rating must be a whole number between 1 and 5');
    }

    // Handle new image uploads
    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      const totalImages = review.images.length + req.files.length;
      if (totalImages > 5) {
        return errorResponse(res, 400, 'Maximum 5 images allowed per review');
      }

      try {
        const uploadPromises = req.files.map(file => {
          return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                folder: 'reviews',
                resource_type: 'auto',
                transformation: [
                  { width: 800, height: 600, crop: 'limit' },
                  { quality: 'auto:good' }
                ]
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
              }
            ).end(file.buffer);
          });
        });
        
        newImageUrls = await Promise.all(uploadPromises);
      } catch (uploadError) {
        return errorResponse(res, 500, 'Image upload failed', uploadError.message);
      }
    }

    // Update review
    const updateData = {};
    if (rating) updateData.rating = Number(rating);
    if (comment) updateData.comment = comment.trim();
    if (newImageUrls.length > 0) {
      updateData.images = [...review.images, ...newImageUrls];
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      updateData,
      { new: true }
    ).populate('reviewer', 'firstName lastName profilePicture')
     .populate('product', 'name images')
     .populate('seller', 'firstName lastName');

    res.json({
      success: true,
      message: 'Review updated successfully',
      review: updatedReview
    });

  } catch (error) {
    console.error('Update review error:', error);
    return errorResponse(res, 500, 'Internal server error', error.message);
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await Review.findOne({ 
      _id: reviewId, 
      reviewer: userId 
    });

    if (!review) {
      return errorResponse(res, 404, 'Review not found or you are not authorized to delete it');
    }

    // Delete images from Cloudinary
    if (review.images && review.images.length > 0) {
      try {
        const deletePromises = review.images.map(imageUrl => {
          // Extract public_id from cloudinary URL
          const publicId = imageUrl.split('/').pop().split('.')[0];
          return cloudinary.uploader.destroy(`reviews/${publicId}`);
        });
        await Promise.all(deletePromises);
      } catch (deleteError) {
        console.error('Error deleting images from Cloudinary:', deleteError);
        // Continue with review deletion even if image deletion fails
      }
    }

    await Review.findByIdAndDelete(reviewId);

    // Remove from order's reviewedItems
    await Order.updateOne(
      { _id: review.order },
      { $pull: { reviewedItems: { product: review.product } } }
    );

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    return errorResponse(res, 500, 'Internal server error', error.message);
  }
};

// Mark review as helpful/unhelpful
export const toggleHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return errorResponse(res, 404, 'Review not found');
    }

    // Check if user already voted
    const hasVoted = review.helpfulBy.includes(userId);

    let updatedReview;
    if (hasVoted) {
      // Remove vote
      updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        {
          $pull: { helpfulBy: userId },
          $inc: { helpfulVotes: -1 }
        },
        { new: true }
      );
    } else {
      // Add vote
      updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        {
          $addToSet: { helpfulBy: userId },
          $inc: { helpfulVotes: 1 }
        },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: hasVoted ? 'Vote removed' : 'Vote added',
      helpfulVotes: updatedReview.helpfulVotes,
      userVoted: !hasVoted
    });

  } catch (error) {
    console.error('Toggle helpful error:', error);
    return errorResponse(res, 500, 'Internal server error', error.message);
  }
};

// Get reviewable products for a user (completed orders not yet reviewed)
export const getReviewableProducts = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get completed orders for the user
    const completedOrders = await Order.find({
      customer: userId,
      status: 'completed'
    }).populate('items.product', 'name images price');

    // Get all products the user has already reviewed
    const reviewedProducts = await Review.find({
      reviewer: userId
    }).select('product order');

    // Create a set of reviewed product-order combinations for quick lookup
    const reviewedSet = new Set(
      reviewedProducts.map(review => `${review.product}_${review.order}`)
    );

    // Find products that can be reviewed
    const reviewableProducts = [];
    
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        const key = `${item.product._id}_${order._id}`;
        if (!reviewedSet.has(key)) {
          reviewableProducts.push({
            orderId: order._id,
            orderNumber: order.orderNumber,
            orderDate: order.createdAt,
            product: item.product,
            quantity: item.quantity,
            price: item.price
          });
        }
      });
    });

    res.json({
      success: true,
      reviewableProducts
    });

  } catch (error) {
    console.error('Get reviewable products error:', error);
    return errorResponse(res, 500, 'Internal server error', error.message);
  }
};

// Admin: Get all reviews with filters
export const getAllReviews = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = 'all', 
      rating,
      seller,
      product 
    } = req.query;

    // Build filter object
    const filter = {};
    if (status !== 'all') {
      filter.isVisible = status === 'visible';
    }
    if (rating) {
      filter.rating = Number(rating);
    }
    if (seller) {
      filter.seller = seller;
    }
    if (product) {
      filter.product = product;
    }

    const skip = (page - 1) * limit;

    const reviews = await Review.find(filter)
      .populate('reviewer', 'firstName lastName email')
      .populate('product', 'name')
      .populate('seller', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalReviews = await Review.countDocuments(filter);

    res.json({
      success: true,
      reviews,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasNext: (page * limit) < totalReviews,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get all reviews error:', error);
    return errorResponse(res, 500, 'Internal server error', error.message);
  }
};

// Admin: Toggle review visibility
export const toggleReviewVisibility = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return errorResponse(res, 404, 'Review not found');
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { isVisible: !review.isVisible },
      { new: true }
    ).populate('reviewer', 'firstName lastName')
     .populate('product', 'name');

    res.json({
      success: true,
      message: `Review ${updatedReview.isVisible ? 'shown' : 'hidden'} successfully`,
      review: updatedReview
    });

  } catch (error) {
    console.error('Toggle review visibility error:', error);
    return errorResponse(res, 500, 'Internal server error', error.message);
  }
};
