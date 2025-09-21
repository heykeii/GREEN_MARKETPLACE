// controllers/productController.js
import Product from '../models/products.model.js';
import cloudinary from '../utils/cloudinary.js';
import { getIO } from '../utils/socket.js';
import { processSustainabilityScoring } from '../utils/sustainabilityScoring.js';

// Helper for error responses
const errorResponse = (res, status, message, error = null, details = null) => {
  return res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error : undefined,
    details
  });
};

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      quantity,
      category,
      origin = '',
      productionMethod = '',
      materialsUsed,
      materialsInput, // New field for sustainability scoring
      tags = [],
    } = req.body;

    if (!name || !description || !price || !quantity || !category || !materialsUsed) {
      return errorResponse(res, 400, 'Missing required fields.', null, {
        name, description, price, quantity, category, materialsUsed
      });
    }

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      try {
        const uploadPromises = req.files.map(file => {
          return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                folder: 'products',
                resource_type: 'auto',
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
        return errorResponse(res, 500, 'Image upload failed.', uploadError.message);
      }
    }

    // Process sustainability scoring if materialsInput is provided OR if materialsUsed is available
    let sustainabilityData = {
      structuredMaterials: new Map(),
      materialRecyclabilityScores: new Map(),
      sustainabilityScore: 0,
      sustainabilityCalculation: {}
    };

    // Use materialsInput if provided, otherwise convert materialsUsed array to string
    let materialInputForScoring = materialsInput;
    if (!materialInputForScoring && materialsUsed) {
      const materialsArray = Array.isArray(materialsUsed) ? materialsUsed : [materialsUsed];
      materialInputForScoring = materialsArray.join(', ');
    }

    if (materialInputForScoring && materialInputForScoring.trim()) {
      try {
        console.log('Processing sustainability scoring for materials:', materialInputForScoring);
        const scoringResult = await processSustainabilityScoring(materialInputForScoring);
        
        sustainabilityData = {
          structuredMaterials: new Map(Object.entries(scoringResult.structuredMaterials)),
          materialRecyclabilityScores: new Map(Object.entries(scoringResult.recyclabilityScores)),
          sustainabilityScore: scoringResult.sustainabilityScore,
          sustainabilityCalculation: {
            totalWeight: scoringResult.totalWeight,
            weightedScore: scoringResult.weightedScore,
            calculatedAt: scoringResult.calculatedAt,
            details: JSON.stringify(scoringResult.calculationDetails)
          },
          validation: scoringResult.validation
        };
        
        console.log('Sustainability scoring completed:', {
          score: scoringResult.sustainabilityScore,
          materials: Object.keys(scoringResult.structuredMaterials)
        });
      } catch (sustainabilityError) {
        console.error('Sustainability scoring failed:', sustainabilityError.message);
        // Continue with product creation but log the error
        // Don't fail the entire product creation process
      }
    }

    const newProduct = new Product({
      name,
      description,
      images: imageUrls,
      price,
      quantity,
      category,
      origin,
      productionMethod,
      materialsUsed: Array.isArray(materialsUsed) ? materialsUsed : [materialsUsed],
      tags: Array.isArray(tags) ? tags : [tags],
      seller: req.user._id,
      status: 'pending',
      // Add sustainability fields
      structuredMaterials: sustainabilityData.structuredMaterials,
      materialRecyclabilityScores: sustainabilityData.materialRecyclabilityScores,
      sustainabilityScore: sustainabilityData.sustainabilityScore,
      sustainabilityCalculation: sustainabilityData.sustainabilityCalculation,
    });

    try {
      await newProduct.save();
    } catch (dbError) {
      return errorResponse(res, 400, 'Failed to save product.', dbError.message, dbError.errors);
    }

    // If validation exists and is invalid, include warning in response
    const validation = sustainabilityData?.validation;

    res.status(201).json({
      success: true,
      message: 'Product submitted successfully with images for admin approval.',
      product: newProduct,
      ...(validation && validation.valid === false ? { sustainabilityValidation: validation } : {})
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to create product.', error.message);
  }
};

// Get all products by the logged-in seller
export const getProductsBySeller = async (req, res) => {
  try {
    console.log('Fetching products for seller:', req.user._id);
    const products = await Product.find({ seller: req.user._id });
    console.log('Found products:', products.length);
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return errorResponse(res, 500, 'Failed to fetch products.', error.message);
  }
};

// Update a product by the seller
export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findOne({ _id: productId, seller: req.user._id });
    if (!product) {
      return errorResponse(res, 404, 'Product not found or not authorized.');
    }

    // Handle images: existingImages (URLs to keep) + new uploads
    let existingImages = req.body.existingImages || [];
    if (typeof existingImages === 'string') existingImages = [existingImages]; // handle single string
    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      try {
        const uploadPromises = req.files.map(file => {
          return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                folder: 'products',
                resource_type: 'auto',
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
        return errorResponse(res, 500, 'Image upload failed.', uploadError.message);
      }
    }
    const allImages = [...existingImages, ...newImageUrls];
    if (allImages.length < 3) {
      return errorResponse(res, 400, 'You must have at least 3 images.');
    }
    if (allImages.length > 10) {
      return errorResponse(res, 400, 'You can have a maximum of 10 images.');
    }
    product.images = allImages;

    // Update other fields
    const updatableFields = [
      'name', 'description', 'price', 'quantity', 'category',
      'origin', 'productionMethod', 'materialsUsed', 'tags'
    ];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    // Recalculate sustainability score if materialsUsed has changed
    if (req.body.materialsUsed !== undefined) {
      try {
        const materialsArray = Array.isArray(req.body.materialsUsed) ? req.body.materialsUsed : [req.body.materialsUsed];
        const materialInputForScoring = materialsArray.join(', ');
        
        if (materialInputForScoring && materialInputForScoring.trim()) {
          console.log('Recalculating sustainability score for updated materials:', materialInputForScoring);
          const scoringResult = await processSustainabilityScoring(materialInputForScoring);
          
          product.structuredMaterials = new Map(Object.entries(scoringResult.structuredMaterials));
          product.materialRecyclabilityScores = new Map(Object.entries(scoringResult.recyclabilityScores));
          product.sustainabilityScore = scoringResult.sustainabilityScore;
          product.sustainabilityCalculation = {
            totalWeight: scoringResult.totalWeight,
            weightedScore: scoringResult.weightedScore,
            calculatedAt: scoringResult.calculatedAt,
            details: JSON.stringify(scoringResult.calculationDetails)
          };
          
          console.log('Sustainability score updated:', scoringResult.sustainabilityScore);
        }
      } catch (sustainabilityError) {
        console.error('Sustainability scoring failed during update:', sustainabilityError.message);
        // Continue with product update but log the error
      }
    }

    try {
      await product.save();
    } catch (dbError) {
      return errorResponse(res, 400, 'Failed to update product.', dbError.message, dbError.errors);
    }
    res.status(200).json({ success: true, message: 'Product updated successfully.', product });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update product.', error.message);
  }
};

// Delete a product by the seller
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findOne({ _id: productId, seller: req.user._id });
    if (!product) {
      return errorResponse(res, 404, 'Product not found or not authorized.');
    }
    try {
      await product.deleteOne();
    } catch (dbError) {
      return errorResponse(res, 500, 'Failed to delete product.', dbError.message);
    }
    // Emit real-time analytics update to this seller's room
    try {
      const io = getIO();
      if (io && req.user?._id) {
        io.to(req.user._id.toString()).emit('seller_analytics_updated', {
          reason: 'product_deleted',
          productId
        });
      }
    } catch (_) {
      // best-effort; do not block deletion response
    }
    res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to delete product.', error.message);
  }
};

// Toggle product availability by the seller
export const toggleProductAvailability = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findOne({ _id: productId, seller: req.user._id });
    if (!product) {
      return errorResponse(res, 404, 'Product not found or not authorized.');
    }
    product.isAvailable = !product.isAvailable;
    try {
      await product.save();
    } catch (dbError) {
      return errorResponse(res, 500, 'Failed to toggle product availability.', dbError.message);
    }
    res.status(200).json({ success: true, message: 'Product availability toggled.', isAvailable: product.isAvailable });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to toggle product availability.', error.message);
  }
};


//Public Marketplace Product controller

// Get all approved and available products (paginated)
export const getAllApprovedProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const filter = { status: 'approved', isAvailable: true };
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(filter)
    ]);
    const totalPages = Math.ceil(total / parseInt(limit));
    res.status(200).json({
      success: true,
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    errorResponse(res, 500, 'Failed to fetch products', error.message);
  }
};

// Get a single approved, available product by ID
export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 400, 'Invalid product ID');
    }
    const product = await Product.findOne({ _id: productId, status: 'approved', isAvailable: true });
    if (!product) {
      return errorResponse(res, 404, 'Product not found or unavailable');
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    errorResponse(res, 500, 'Failed to fetch product', error.message);
  }
};

// Search products by name or description (case-insensitive, partial match)
export const searchProducts = async (req, res) => {
  try {
    const { q = '', page = 1, limit = 20 } = req.query;
    if (!q.trim()) {
      return errorResponse(res, 400, 'Search query is required');
    }
    const filter = {
      status: 'approved',
      isAvailable: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(filter)
    ]);
    const totalPages = Math.ceil(total / parseInt(limit));
    res.status(200).json({
      success: true,
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    errorResponse(res, 500, 'Failed to search products', error.message);
  }
};

// Filter products by category, price range, tags, materialsUsed (all optional, AND logic)
export const filterProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, tags, materialsUsed, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const filter = { status: 'approved', isAvailable: true };
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (tags) {
      const tagsArr = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $in: tagsArr };
    }
    if (materialsUsed) {
      const materialsArr = Array.isArray(materialsUsed) ? materialsUsed : materialsUsed.split(',');
      filter.materialsUsed = { $in: materialsArr };
    }
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(filter)
    ]);
    const totalPages = Math.ceil(total / parseInt(limit));
    res.status(200).json({
      success: true,
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    errorResponse(res, 500, 'Failed to filter products', error.message);
  }
};

// Get related products (same category or sharing at least one tag, excluding the original product)
export const getRelatedProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 400, 'Invalid product ID');
    }
    const product = await Product.findOne({ _id: productId, status: 'approved', isAvailable: true });
    if (!product) {
      return errorResponse(res, 404, 'Product not found or unavailable');
    }
    const relatedFilter = {
      _id: { $ne: product._id },
      status: 'approved',
      isAvailable: true,
      $or: [
        { category: product.category },
        { tags: { $in: product.tags || [] } }
      ]
    };
    const relatedProducts = await Product.find(relatedFilter)
      .limit(8)
      .lean();
    res.status(200).json({ success: true, relatedProducts });
  } catch (error) {
    errorResponse(res, 500, 'Failed to fetch related products', error.message);
  }
};

// Get products by seller (public)
export const getProductsBySellerPublic = async (req, res) => {
  try {
    const { sellerId } = req.params;
    if (!sellerId) {
      return res.status(400).json({ success: false, message: 'Seller ID is required' });
    }

    const products = await Product.find({ seller: sellerId })
      .select('name images price category quantity createdAt')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, products });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch seller products', error: error.message });
  }
};

// Get products by multiple sellers (for promotional campaigns)
export const getProductsBySellers = async (req, res) => {
  try {
    const { sellers, limit = 6 } = req.query;
    
    if (!sellers) {
      return res.status(400).json({ success: false, message: 'Sellers parameter is required' });
    }

    const sellerIds = sellers.split(',').filter(id => id.trim().match(/^[0-9a-fA-F]{24}$/));
    
    if (sellerIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Valid seller IDs are required' });
    }

    const products = await Product.find({ 
      seller: { $in: sellerIds },
      status: 'approved',
      isAvailable: true
    })
    .populate('seller', 'name email businessName')
    .select('name images price category description rating createdAt')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

    return res.status(200).json({ success: true, products });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch products from sellers', 
      error: error.message 
    });
  }
};

// Sustainability Scoring Endpoints

// Calculate sustainability score for materials (preview/test endpoint)
export const calculateSustainabilityPreview = async (req, res) => {
  try {
    const { materialsInput } = req.body;

    if (!materialsInput || !materialsInput.trim()) {
      return errorResponse(res, 400, 'Materials input is required for sustainability calculation.');
    }

    console.log('Calculating sustainability preview for:', materialsInput);
    const scoringResult = await processSustainabilityScoring(materialsInput);

    res.status(200).json({
      success: true,
      message: 'Sustainability score calculated successfully.',
      sustainabilityData: {
        structuredMaterials: scoringResult.structuredMaterials,
        recyclabilityScores: scoringResult.recyclabilityScores,
        sustainabilityScore: scoringResult.sustainabilityScore,
        calculationBreakdown: {
          totalWeight: scoringResult.totalWeight,
          weightedScore: scoringResult.weightedScore,
          formula: scoringResult.formula,
          details: scoringResult.calculationDetails
        },
        validation: scoringResult.validation
      }
    });
  } catch (error) {
    console.error('Error calculating sustainability preview:', error);
    return errorResponse(res, 500, 'Failed to calculate sustainability score.', error.message);
  }
};

// Recalculate sustainability score for existing product
export const recalculateSustainabilityScore = async (req, res) => {
  try {
    const { productId } = req.params;
    const { materialsInput } = req.body;

    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 400, 'Invalid product ID');
    }

    const product = await Product.findOne({ _id: productId, seller: req.user._id });
    if (!product) {
      return errorResponse(res, 404, 'Product not found or not authorized.');
    }

    if (!materialsInput || !materialsInput.trim()) {
      return errorResponse(res, 400, 'Materials input is required for sustainability recalculation.');
    }

    console.log('Recalculating sustainability score for product:', productId);
    const scoringResult = await processSustainabilityScoring(materialsInput);

    // Update product with new sustainability data
    product.structuredMaterials = new Map(Object.entries(scoringResult.structuredMaterials));
    product.materialRecyclabilityScores = new Map(Object.entries(scoringResult.recyclabilityScores));
    product.sustainabilityScore = scoringResult.sustainabilityScore;
    product.sustainabilityCalculation = {
      totalWeight: scoringResult.totalWeight,
      weightedScore: scoringResult.weightedScore,
      calculatedAt: scoringResult.calculatedAt,
      details: JSON.stringify(scoringResult.calculationDetails)
    };

    try {
      await product.save();
    } catch (dbError) {
      return errorResponse(res, 500, 'Failed to update product sustainability data.', dbError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Sustainability score recalculated successfully.',
      product: {
        _id: product._id,
        name: product.name,
        sustainabilityScore: product.sustainabilityScore,
        sustainabilityCalculation: product.sustainabilityCalculation,
        structuredMaterials: Object.fromEntries(product.structuredMaterials),
        materialRecyclabilityScores: Object.fromEntries(product.materialRecyclabilityScores)
      }
      , validation: scoringResult.validation
    });
  } catch (error) {
    console.error('Error recalculating sustainability score:', error);
    return errorResponse(res, 500, 'Failed to recalculate sustainability score.', error.message);
  }
};

// Get sustainability details for a product
export const getProductSustainabilityDetails = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 400, 'Invalid product ID');
    }

    const product = await Product.findById(productId)
      .select('name sustainabilityScore structuredMaterials materialRecyclabilityScores sustainabilityCalculation')
      .lean();

    if (!product) {
      return errorResponse(res, 404, 'Product not found');
    }

    // Convert Maps to Objects for JSON response
    const sustainabilityDetails = {
      productId: product._id,
      productName: product.name,
      sustainabilityScore: product.sustainabilityScore,
      structuredMaterials: product.structuredMaterials ? Object.fromEntries(product.structuredMaterials) : {},
      materialRecyclabilityScores: product.materialRecyclabilityScores ? Object.fromEntries(product.materialRecyclabilityScores) : {},
      calculation: product.sustainabilityCalculation ? {
        ...product.sustainabilityCalculation,
        details: product.sustainabilityCalculation.details ? JSON.parse(product.sustainabilityCalculation.details) : []
      } : null
    };

    res.status(200).json({
      success: true,
      sustainabilityDetails
    });
  } catch (error) {
    console.error('Error fetching sustainability details:', error);
    return errorResponse(res, 500, 'Failed to fetch sustainability details.', error.message);
  }
};








