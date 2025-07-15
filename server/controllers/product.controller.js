// controllers/productController.js
import Product from '../models/products.model.js';
import cloudinary from '../utils/cloudinary.js';

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
    });

    try {
      await newProduct.save();
    } catch (dbError) {
      return errorResponse(res, 400, 'Failed to save product.', dbError.message, dbError.errors);
    }

    res.status(201).json({
      success: true,
      message: 'Product submitted successfully with images for admin approval.',
      product: newProduct,
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to create product.', error.message);
  }
};

// Get all products by the logged-in seller
export const getProductsBySeller = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id });
    res.status(200).json({ success: true, products });
  } catch (error) {
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
    const updatableFields = [
      'name', 'description', 'price', 'quantity', 'category',
      'origin', 'productionMethod', 'materialsUsed', 'tags'
    ];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });
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








