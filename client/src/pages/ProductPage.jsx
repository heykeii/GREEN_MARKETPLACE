import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/utils/toast';
import { 
  FaSpinner, 
  FaArrowLeft, 
  FaHeart, 
  FaShare, 
  FaStar, 
  FaShoppingCart,
  FaTruck,
  FaShieldAlt,
  FaLeaf,
  FaRecycle,
  FaUser,
  FaMapMarkerAlt,
  FaCog,
  FaTags,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaChartBar,
  FaBoxes,
  FaToggleOn,
  FaToggleOff,
  FaTimes,
  FaImage,
  FaEnvelope
} from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ReviewsSection from '@/components/ReviewsSection';
import { CATEGORY_OPTIONS } from '@/constants/categories';

const ProductPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cartLoading, setCartLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [isOwner, setIsOwner] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
    origin: '',
    productionMethod: '',
    materialsUsed: '',
    tags: '',
    externalUrls: []
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editImages, setEditImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [seller, setSeller] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    const storedToken = localStorage.getItem('token');
    setUser(storedUser);
    setToken(storedToken);
    fetchProduct();
    fetchReviewStats();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/products/view/${productId}`);
      setProduct(response.data.product);
      // fetch seller basic for avatar link if present
      if (response.data?.product?.seller) {
        try {
          const profileRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users/profile/${response.data.product.seller}`);
          setSeller(profileRes.data?.profile || null);
        } catch (e) {
          // ignore silently
        }
      }
      
      // Check if current user is the seller
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (storedUser && response.data.product.seller === storedUser._id) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/reviews/product/${productId}?page=1&limit=1`);
      if (response.data.success) {
        setReviewStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching review stats:', error);
      // Don't show error toast for review stats, just use defaults
    }
  };

  const handleAddToCart = async () => {
    if (!user || !token) {
      toast.error('Please login to add items to your cart');
      return;
    }

    setCartLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/cart/add`, {
        productId: product._id,
        quantity: quantity
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update localStorage timestamp to prevent unnecessary API calls
      localStorage.setItem('lastCartUpdate', Date.now().toString());
      window.dispatchEvent(new Event('cartUpdated'));
      
      toast.success('Added to cart successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setCartLoading(false);
    }
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleMessageSeller = () => {
    if (!seller) return;
    // Create/find conversation and navigate
    const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
    if (!token) {
      toast.error('Please login to send a message');
      return;
    }
    axios.post(`${import.meta.env.VITE_API_URL}/api/v1/chat/conversations`, {
      recipientId: seller._id,
      productId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    }).then((res) => {
      const conversationId = res.data?.conversation?._id;
      if (conversationId) navigate(`/messages/${conversationId}`);
    }).catch(() => {
      toast.error('Unable to start chat');
    });
  };

  const handleBuyNow = async () => {
    const currUser = JSON.parse(localStorage.getItem('user') || 'null');
    const authToken = localStorage.getItem('token');
    if (!currUser || !authToken) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }
    if (!product) return;
    if (product.quantity === 0) {
      toast.error('Out of stock');
      return;
    }
    // Stash direct checkout payload and go to checkout page
    const direct = {
      items: [{ productId: product._id, quantity: Math.max(1, quantity) }],
      createdAt: Date.now()
    };
    localStorage.setItem('directCheckout', JSON.stringify(direct));
    navigate('/checkout?mode=direct');
  };

  const handleEditProduct = () => {
    // Populate the edit form with current product data
    setEditForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      quantity: product.quantity || '',
      category: product.category || '',
      origin: product.origin || '',
      productionMethod: product.productionMethod || '',
      materialsUsed: Array.isArray(product.materialsUsed) ? product.materialsUsed.join(', ') : '',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
      externalUrls: product.externalUrls || []
    });
    
    // Set existing images
    setEditImages(product.images || []);
    setNewImages([]);
    setImagePreviews([]);
    setShowEditModal(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = editImages.length + newImages.length + files.length;
    
    if (totalImages > 10) {
      toast.error('You can have a maximum of 10 images.');
      return;
    }
    
    if (totalImages < 3) {
      toast.error('You must have at least 3 images.');
      return;
    }
    
    setNewImages(prev => [...prev, ...files]);
    
    // Create previews for new images
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index, isNew = false) => {
    if (isNew) {
      setNewImages(prev => prev.filter((_, i) => i !== index));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      setEditImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const clearAllImages = () => {
    setEditImages([]);
    setNewImages([]);
    setImagePreviews([]);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    
    try {
      const totalImages = editImages.length + newImages.length;
      if (totalImages < 3) {
        toast.error('You must have at least 3 images.');
        setEditLoading(false);
        return;
      }
      
      if (totalImages > 10) {
        toast.error('You can have a maximum of 10 images.');
        setEditLoading(false);
        return;
      }
      
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('description', editForm.description);
      formData.append('price', editForm.price);
      formData.append('quantity', editForm.quantity);
      formData.append('category', editForm.category);
      formData.append('origin', editForm.origin);
      formData.append('productionMethod', editForm.productionMethod);
      
      // Handle materialsUsed as array
      editForm.materialsUsed.split(',').map(s => s.trim()).filter(Boolean).forEach(val => {
        formData.append('materialsUsed', val);
      });
      
      // Handle tags as array
      editForm.tags.split(',').map(s => s.trim()).filter(Boolean).forEach(val => {
        formData.append('tags', val);
      });

      // Add external URLs
      const validUrls = editForm.externalUrls.filter(url => url.platform.trim() && url.url.trim());
      if (validUrls.length > 0) {
        formData.append('externalUrls', JSON.stringify(validUrls));
      }

      // Add existing images
      editImages.forEach(url => {
        formData.append('existingImages', url);
      });

      // Add new images
      newImages.forEach(img => {
        formData.append('images', img);
      });

      await axios.patch(`${import.meta.env.VITE_API_URL}/api/v1/products/update/${productId}`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Product updated successfully!');
      setShowEditModal(false);
      fetchProduct(); // Refresh product data
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setEditLoading(false);
    }
  };

  const handleViewAnalytics = () => {
    navigate('/seller/dashboard?tab=analytics');
  };

  const handleManageInventory = () => {
    navigate('/seller/dashboard?tab=inventory');
  };

  const handleToggleAvailability = async () => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/v1/products/${productId}/toggle-availability`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Product availability updated!');
      fetchProduct(); // Refresh product data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update availability');
    }
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-50 flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="animate-spin h-12 w-12 text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading product details...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Product not found</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Go Home
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-50 py-8 px-4 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="mb-6 bg-white/80 hover:bg-white border-emerald-200 text-emerald-700 hover:text-emerald-800"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
                    {product.images && product.images.length > 0 ? (
                      <>
                        <img
                          src={product.images[selectedImage]}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                        {/* Navigation Arrows */}
                        {product.images.length > 1 && (
                          <>
                            <button
                              onClick={prevImage}
                              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
                            >
                              <FaChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                              onClick={nextImage}
                              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
                            >
                              <FaChevronRight className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        {/* Image Counter */}
                        <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                          {selectedImage + 1} / {product.images.length}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaEye className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        selectedImage === index
                          ? 'border-emerald-500 shadow-lg'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="space-y-8">
              {/* Product Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <FaStar className="text-amber-500" />
                        <span className="text-gray-600">
                          {reviewStats.averageRating > 0 
                            ? `${reviewStats.averageRating.toFixed(1)} (${reviewStats.totalReviews} ${reviewStats.totalReviews === 1 ? 'review' : 'reviews'})`
                            : 'No reviews yet'
                          }
                        </span>
                      </div>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                        {product.category}
                      </Badge>
                      {/* Seller Avatar & Link */}
                      {seller && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/profile/${seller._id}`)}
                            className="flex items-center gap-2 hover:opacity-90"
                            title={`${seller.firstName} ${seller.lastName}`}
                          >
                            <img
                              src={seller.avatar || '/default-avatar.png'}
                              onError={(e)=>{ e.currentTarget.src='/default-avatar.png'; }}
                              alt="seller"
                              className="w-8 h-8 rounded-full border"
                            />
                            <span className="text-sm text-gray-700 flex items-center gap-1">
                              <FaUser className="text-emerald-600" />
                              {seller.firstName}
                            </span>
                          </button>
                          {!isOwner && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              onClick={handleMessageSeller}
                              title="Message Seller"
                            >
                              <FaEnvelope className="mr-1" />
                              Message
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-emerald-600">₱{product.price.toLocaleString()}</span>
                  <span className="text-lg text-gray-500">per unit</span>
                </div>

                {/* Stock Status */}
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    product.quantity > 10 ? 'bg-green-500' : 
                    product.quantity > 0 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm text-gray-600">
                    {product.quantity > 10 ? 'In Stock' : 
                     product.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Product Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.origin && (
                    <div className="flex items-center gap-3">
                      <FaMapMarkerAlt className="text-emerald-600" />
                      <div>
                        <p className="text-sm text-gray-500">Origin</p>
                        <p className="font-medium">{product.origin}</p>
                      </div>
                    </div>
                  )}
                  {product.productionMethod && (
                    <div className="flex items-center gap-3">
                      <FaCog className="text-emerald-600" />
                      <div>
                        <p className="text-sm text-gray-500">Production Method</p>
                        <p className="font-medium">{product.productionMethod}</p>
                      </div>
                    </div>
                  )}
                  {product.materialsUsed && product.materialsUsed.length > 0 && (
                    <div className="flex items-start gap-3">
                      <FaRecycle className="text-emerald-600 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Materials Used</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.materialsUsed.map((material, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {material}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex items-start gap-3">
                      <FaTags className="text-emerald-600 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Tags</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* External URLs Section */}
              {product.externalUrls && product.externalUrls.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Buy on Other Platforms</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.externalUrls.map((url, index) => (
                      <a
                        key={index}
                        href={url.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors group"
                      >
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <FaShoppingCart className="text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 group-hover:text-emerald-600">{url.platform}</p>
                          <p className="text-sm text-gray-600">View on {url.platform}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Sustainability Features */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Sustainability Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg">
                    <FaLeaf className="text-emerald-600" />
                    <div>
                      <p className="font-medium text-gray-900">Eco-Friendly</p>
                      <p className="text-sm text-gray-600">Made with sustainable materials</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg">
                    <FaRecycle className="text-emerald-600" />
                    <div>
                      <p className="font-medium text-gray-900">Recyclable</p>
                      <p className="text-sm text-gray-600">100% recyclable packaging</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add to Cart Section */}
              {isOwner ? (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Button
                      onClick={handleEditProduct}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-semibold"
                      size="lg"
                    >
                      <FaEdit className="mr-2 h-5 w-5" /> Edit Product
                    </Button>
                    
                   
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="px-3"
                      >
                        -
                      </Button>
                      <span className="px-4 py-2 text-lg font-medium">{quantity}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={quantity >= product.quantity}
                        className="px-3"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={handleAddToCart}
                      disabled={product.quantity === 0 || cartLoading}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-semibold"
                      size="lg"
                    >
                      {cartLoading ? (
                        <>
                          <FaSpinner className="mr-2 h-5 w-5 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <FaShoppingCart className="mr-2 h-5 w-5" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      onClick={handleBuyNow}
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>
              )}

              {/* Shipping & Returns */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Payment & Returns</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <FaTruck className="text-emerald-600" />
                    <div>
                      <p className="font-medium text-gray-900">Fast Delivery</p>
                      <p className="text-sm text-gray-600">Same day dispatch</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <FaShieldAlt className="text-emerald-600" />
                    <div>
                      <p className="font-medium text-gray-900">Secure Payment</p>
                      <p className="text-sm text-gray-600">100% secure checkout</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <FaUser className="text-emerald-600" />
                    <div>
                      <p className="font-medium text-gray-900">Seller Verified</p>
                      <p className="text-sm text-gray-600">Trusted seller</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <ReviewsSection 
            productId={productId} 
            currentUser={user}
          />
        </div>
      </div>

      {/* Edit Product Modal */}
      {showEditModal && (
        <div 
          className="fixed inset-0 bg-gradient-to-br from-emerald-50/80 via-emerald-100/80 to-teal-50/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmitEdit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Price (₱)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={editForm.quantity}
                      onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="">Select Category</option>
                      {CATEGORY_OPTIONS.map((category, index) => (
                        <option key={index} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="origin">Origin</Label>
                    <Input
                      id="origin"
                      value={editForm.origin}
                      onChange={(e) => setEditForm({ ...editForm, origin: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="productionMethod">Production Method</Label>
                    <Input
                      id="productionMethod"
                      value={editForm.productionMethod}
                      onChange={(e) => setEditForm({ ...editForm, productionMethod: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={4}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                 <div>
                   <Label htmlFor="materialsUsed">Materials Used (comma-separated)</Label>
                   <Input
                     id="materialsUsed"
                     value={editForm.materialsUsed}
                     onChange={(e) => setEditForm({ ...editForm, materialsUsed: e.target.value })}
                     placeholder="e.g., Organic cotton, Recycled plastic, Bamboo"
                   />
                 </div>

                 <div>
                   <Label htmlFor="tags">Tags (comma-separated)</Label>
                   <Input
                     id="tags"
                     value={editForm.tags}
                     onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                     placeholder="e.g., Eco-friendly, Sustainable, Organic"
                   />
                 </div>

                 {/* External URLs Section */}
                 <div className="space-y-3">
                   <Label>External Product URLs</Label>
                   {editForm.externalUrls.map((url, index) => (
                     <div key={index} className="flex gap-3">
                       <div className="flex-1">
                         <Input
                           placeholder="Platform (e.g., Shopee, Lazada)"
                           value={url.platform}
                           onChange={(e) => {
                             const newUrls = [...editForm.externalUrls];
                             newUrls[index].platform = e.target.value;
                             setEditForm(f => ({ ...f, externalUrls: newUrls }));
                           }}
                         />
                       </div>
                       <div className="flex-[2]">
                         <Input
                           placeholder="Product URL"
                           value={url.url}
                           onChange={(e) => {
                             const newUrls = [...editForm.externalUrls];
                             newUrls[index].url = e.target.value;
                             setEditForm(f => ({ ...f, externalUrls: newUrls }));
                           }}
                         />
                       </div>
                       {index > 0 && (
                         <Button
                           type="button"
                           variant="outline"
                           size="icon"
                           className="shrink-0 text-red-600 hover:text-red-700"
                           onClick={() => {
                             setEditForm(f => ({
                               ...f,
                               externalUrls: f.externalUrls.filter((_, i) => i !== index)
                             }));
                           }}
                         >
                           <FaTimes className="h-4 w-4" />
                         </Button>
                       )}
                     </div>
                   ))}
                   <Button
                     type="button"
                     variant="outline"
                     size="sm"
                     onClick={() => {
                       setEditForm(f => ({
                         ...f,
                         externalUrls: [...f.externalUrls, { platform: '', url: '' }]
                       }));
                     }}
                   >
                     <FaPlus className="mr-2 h-4 w-4" />
                     Add Another URL
                   </Button>
                 </div>

                 {/* Image Upload Section */}
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <Label>Product Images</Label>
                     <div className="flex gap-2">
                       <Button
                         type="button"
                         variant="outline"
                         size="sm"
                         onClick={() => document.getElementById('image-upload').click()}
                         className="text-sm"
                       >
                         <FaImage className="mr-2 h-4 w-4" />
                         Add Images
                       </Button>
                       <Button
                         type="button"
                         variant="outline"
                         size="sm"
                         onClick={clearAllImages}
                         className="text-sm text-red-600 hover:text-red-700"
                       >
                         Clear All
                       </Button>
                     </div>
                   </div>
                   
                   <input
                     id="image-upload"
                     type="file"
                     multiple
                     accept="image/*"
                     onChange={handleImageChange}
                     className="hidden"
                   />
                   
                   <div className="text-sm text-gray-600">
                     {editImages.length + newImages.length} of 10 images • Minimum 3 required
                   </div>

                   {/* Existing Images */}
                   {editImages.length > 0 && (
                     <div className="space-y-2">
                       <Label className="text-sm font-medium text-gray-700">Existing Images</Label>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                         {editImages.map((image, index) => (
                           <div key={`existing-${index}`} className="relative group">
                             <img
                               src={image}
                               alt={`Product ${index + 1}`}
                               className="w-full h-24 object-cover rounded-lg border border-gray-200"
                             />
                             <button
                               type="button"
                               onClick={() => removeImage(index, false)}
                               className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                               <FaTimes className="h-3 w-3" />
                             </button>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* New Images */}
                   {newImages.length > 0 && (
                     <div className="space-y-2">
                       <Label className="text-sm font-medium text-gray-700">New Images</Label>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                         {newImages.map((file, index) => (
                           <div key={`new-${index}`} className="relative group">
                             <img
                               src={imagePreviews[index]}
                               alt={`New ${index + 1}`}
                               className="w-full h-24 object-cover rounded-lg border border-gray-200"
                             />
                             <button
                               type="button"
                               onClick={() => removeImage(index, true)}
                               className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                               <FaTimes className="h-3 w-3" />
                             </button>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Empty State */}
                   {editImages.length === 0 && newImages.length === 0 && (
                     <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                       <FaImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                       <p className="text-gray-600 mb-2">No images uploaded</p>
                       <p className="text-sm text-gray-500">Upload at least 3 images to continue</p>
                     </div>
                   )}
                 </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1"
                    disabled={editLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    disabled={editLoading}
                  >
                    {editLoading ? (
                      <>
                        <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Product'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default ProductPage;