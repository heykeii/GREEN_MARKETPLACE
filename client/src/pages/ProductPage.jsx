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
  FaPlus,
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
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(null);
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
      const variants = response.data?.product?.variants || [];
      setSelectedVariantIndex(variants.length > 0 ? 0 : null);
      if (response.data?.product?.seller) {
        try {
          const profileRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users/profile/${response.data.product.seller}`);
          setSeller(profileRes.data?.profile || null);
        } catch (e) {}
      }
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
    }
  };

  const handleAddToCart = async () => {
    if (!user || !token) {
      toast.error('Please login to add items to your cart');
      return;
    }

    setCartLoading(true);
    try {
      const variantPayload = (() => {
        if (!Array.isArray(product.variants) || product.variants.length === 0 || selectedVariantIndex === null) return undefined;
        const v = product.variants[selectedVariantIndex];
        return {
          name: v?.name,
          sku: v?.sku,
          attributes: v?.attributes || {},
          price: typeof v?.price === 'number' ? v.price : parseFloat(v?.price || 0)
        };
      })();

      await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/cart/add`, {
        productId: product._id,
        quantity: quantity,
        variant: variantPayload
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
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

    const variantPayload = (() => {
      if (!Array.isArray(product.variants) || product.variants.length === 0 || selectedVariantIndex === null) return undefined;
      const v = product.variants[selectedVariantIndex];
      return {
        name: v?.name,
        sku: v?.sku,
        attributes: v?.attributes || {},
        price: typeof v?.price === 'number' ? v.price : parseFloat(v?.price || 0)
      };
    })();

    const direct = {
      items: [{ 
        productId: product._id, 
        quantity: Math.max(1, quantity),
        variant: variantPayload,
        selectedVariant: selectedVariantIndex
      }],
      createdAt: Date.now()
    };
    localStorage.setItem('directCheckout', JSON.stringify(direct));
    navigate('/checkout?mode=direct');
  };

  const handleEditProduct = () => {
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
      
      // Do not allow updating materialsUsed from edit modal
      
      // Do not update tags via edit modal (field removed)

      const validUrls = editForm.externalUrls.filter(url => url.platform.trim() && url.url.trim());
      if (validUrls.length > 0) {
        formData.append('externalUrls', JSON.stringify(validUrls));
      }

      editImages.forEach(url => {
        formData.append('existingImages', url);
      });

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
      fetchProduct();
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
      fetchProduct();
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
          <div className="text-center">
            <FaSpinner className="animate-spin h-12 w-12 text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-600 text-sm">Loading product details...</p>
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Product not found</p>
            <Button onClick={() => navigate('/')} className="bg-emerald-600 hover:bg-emerald-700">
              Go Home
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const effectivePrice = (() => {
    if (!product) return 0;
    if (Array.isArray(product.variants) && product.variants.length > 0 && selectedVariantIndex !== null) {
      const v = product.variants[selectedVariantIndex];
      const priceNum = typeof v?.price === 'number' ? v.price : parseFloat(v?.price || product.price);
      return isNaN(priceNum) ? product.price : priceNum;
    }
    return product.price;
  })();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Images Section */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                {product.images && product.images.length > 0 ? (
                  <>
                    <img
                      src={product.images[selectedImage]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {product.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
                        >
                          <FaChevronLeft className="text-gray-700" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
                        >
                          <FaChevronRight className="text-gray-700" />
                        </button>
                      </>
                    )}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                      {selectedImage + 1} / {product.images.length}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <FaEye className="h-16 w-16 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? 'border-emerald-500 shadow-md scale-105'
                          : 'border-gray-200 hover:border-gray-300'
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

            {/* Product Information Section */}
            <div className="space-y-6">
              {/* Header Section */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                    {product.name}
                  </h1>
                  <button
                    onClick={handleShare}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FaShare className="text-gray-600" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <FaStar className="text-amber-400 w-5 h-5" />
                    <span className="font-medium text-gray-900">
                      {reviewStats.averageRating > 0 ? reviewStats.averageRating.toFixed(1) : 'New'}
                    </span>
                    <span className="text-gray-500 text-sm">
                      ({reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                    {product.category}
                  </Badge>
                </div>

                {/* Sustainability Score Badge */}
                {typeof product.sustainabilityScore === 'number' && product.sustainabilityScore > 0 && (
                  <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
                    <FaLeaf className="text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-700">
                      {Math.round(product.sustainabilityScore * 100)}% Sustainable
                    </span>
                  </div>
                )}

                {/* Seller Info */}
                {seller && (
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
                    <img
                      src={seller.avatar || '/default-avatar.svg'}
                      onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }}
                      alt="seller"
                      className="w-10 h-10 rounded-full border-2 border-gray-200 cursor-pointer hover:border-emerald-500 transition-colors"
                      onClick={() => navigate(`/profile/${seller._id}`)}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Sold by</p>
                      <button
                        onClick={() => navigate(`/profile/${seller._id}`)}
                        className="font-medium text-gray-900 hover:text-emerald-600 transition-colors"
                      >
                        {seller.firstName} {seller.lastName}
                      </button>
                    </div>
                    {!isOwner && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-300 hover:border-emerald-500 hover:text-emerald-600"
                        onClick={handleMessageSeller}
                      >
                        <FaEnvelope className="mr-2 w-4 h-4" />
                        Message
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Price Section */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-gray-900">₱{Number(effectivePrice).toLocaleString()}</span>
                  <span className="text-gray-500">/ unit</span>
                </div>

                {/* Stock Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      product.quantity > 10 ? 'bg-green-500' : 
                      product.quantity > 0 ? 'bg-amber-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <span className="font-medium text-gray-900">
                        {product.quantity > 10 ? 'In Stock' : 
                         product.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                      </span>
                      <p className="text-sm text-gray-500">
                        {product.quantity > 0 ? `${product.quantity} units available` : 'No units available'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Variant Selector */}
              {Array.isArray(product.variants) && product.variants.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Select Variant</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedVariantIndex(index)}
                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                          selectedVariantIndex === index
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-emerald-300'
                        }`}
                      >
                        {variant?.name || `Variant ${index + 1}`}
                      </button>
                    ))}
                  </div>
                  {selectedVariantIndex !== null && product.variants[selectedVariantIndex]?.attributes && (
                    <div className="text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                      {Object.entries(product.variants[selectedVariantIndex].attributes).map(([k, v]) => (
                        <span key={k}>
                          <strong className="text-gray-900">{k}:</strong> {String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {isOwner ? (
                <Button
                  onClick={handleEditProduct}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg font-semibold rounded-xl"
                  size="lg"
                >
                  <FaEdit className="mr-2 h-5 w-5" />
                  Edit Product
                </Button>
              ) : (
                <div className="space-y-3">
                  {/* Quantity Selector */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Quantity:</span>
                    <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="px-4 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="px-6 py-2 font-semibold text-gray-900 min-w-[60px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={quantity >= product.quantity}
                        className="px-4 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm text-gray-500">
                      Max: {product.quantity}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleAddToCart}
                      disabled={product.quantity === 0 || cartLoading}
                      className="py-6 text-base font-semibold bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-xl"
                    >
                      {cartLoading ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <>
                          <FaShoppingCart className="mr-2" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleBuyNow}
                      className="py-6 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                  <FaTruck className="text-emerald-600 text-xl mb-2" />
                  <span className="text-xs font-medium text-gray-700 text-center">Fast Delivery</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                  <FaShieldAlt className="text-emerald-600 text-xl mb-2" />
                  <span className="text-xs font-medium text-gray-700 text-center">Secure Payment</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                  <FaUser className="text-emerald-600 text-xl mb-2" />
                  <span className="text-xs font-medium text-gray-700 text-center">Verified Seller</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Details Section */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Product Details */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Product Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {product.origin && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <FaMapMarkerAlt className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Origin</p>
                        <p className="font-medium text-gray-900">{product.origin}</p>
                      </div>
                    </div>
                  )}
                  {product.productionMethod && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <FaCog className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Production Method</p>
                        <p className="font-medium text-gray-900">{product.productionMethod}</p>
                      </div>
                    </div>
                  )}
                  {product.materialsUsed && product.materialsUsed.length > 0 && (
                    <div className="flex items-start gap-3 sm:col-span-2">
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <FaRecycle className="text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-2">Materials Used</p>
                        <div className="flex flex-wrap gap-2">
                          {product.materialsUsed.map((material, index) => (
                            <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                              {material}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex items-start gap-3 sm:col-span-2">
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <FaTags className="text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-2">Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {product.tags.map((tag, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* External URLs */}
              {product.externalUrls && product.externalUrls.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Available on Other Platforms</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {product.externalUrls.map((url, index) => (
                      <a
                        key={index}
                        href={url.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group"
                      >
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                          <FaShoppingCart className="text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
                            {url.platform}
                          </p>
                          <p className="text-sm text-gray-500 truncate">View on {url.platform}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* AI Eco Assessment */}
              {product.ecoAssessment && product.ecoAssessment.rating && (
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <FaLeaf className="text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900">Sustainability Report</h3>
                  </div>

                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
                    product.ecoAssessment.rating === 'High' ? 'bg-emerald-600' :
                    product.ecoAssessment.rating === 'Moderate' ? 'bg-amber-500' :
                    'bg-orange-500'
                  }`}>
                    <FaLeaf className="text-white" />
                    <span className="text-white font-semibold">{product.ecoAssessment.rating} Impact</span>
                  </div>

                  <p className="text-gray-700 text-sm leading-relaxed mb-4">{product.ecoAssessment.summary}</p>

                  {product.ecoAssessment.strengths && product.ecoAssessment.strengths.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-emerald-800 text-sm mb-2 flex items-center gap-2">
                        <span className="text-green-600">✓</span> Strengths
                      </h4>
                      <ul className="space-y-2">
                        {product.ecoAssessment.strengths.map((strength, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {product.ecoAssessment.recommendations && product.ecoAssessment.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-blue-800 text-sm mb-2 flex items-center gap-2">
                        <span className="text-blue-600">💡</span> Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {product.ecoAssessment.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Legacy Sustainability Score */}
              {typeof product.sustainabilityScore === 'number' && product.sustainabilityScore > 0 && !product.ecoAssessment?.rating && (
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <FaLeaf className="text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900">Sustainability</h3>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl mb-4">
                    <div
                      className="w-16 h-16 rounded-full p-[3px]"
                      style={{
                        background: `conic-gradient(from 0deg, #10b981 0deg, #34d399 ${Math.round(product.sustainabilityScore * 100) * 3.6}deg, #e5e7eb 0deg)`
                      }}
                    >
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-lg font-bold text-emerald-700">
                        {Math.round(product.sustainabilityScore * 100)}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Eco Score</p>
                      <p className="text-sm text-gray-600">
                        {product.sustainabilityScore >= 0.8 ? 'Excellent' : 
                         product.sustainabilityScore >= 0.6 ? 'Good' : 
                         product.sustainabilityScore >= 0.4 ? 'Fair' : 'Poor'} Impact
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <FaRecycle className="text-emerald-600" />
                      <span className="text-sm font-medium text-gray-700">Recyclable Materials</span>
                    </div>
                  </div>
                </div>
              )}
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
      </div>

      {/* Edit Product Modal */}
      {showEditModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-2 block">Product Name</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="price" className="text-sm font-semibold text-gray-700 mb-2 block">Price (₱)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="quantity" className="text-sm font-semibold text-gray-700 mb-2 block">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-sm font-semibold text-gray-700 mb-2 block">Category</Label>
                  <select
                    id="category"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                  <Label htmlFor="origin" className="text-sm font-semibold text-gray-700 mb-2 block">Origin</Label>
                  <Input
                    id="origin"
                    value={editForm.origin}
                    onChange={(e) => setEditForm({ ...editForm, origin: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="productionMethod" className="text-sm font-semibold text-gray-700 mb-2 block">Production Method</Label>
                  <Input
                    id="productionMethod"
                    value={editForm.productionMethod}
                    onChange={(e) => setEditForm({ ...editForm, productionMethod: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700 mb-2 block">Description</Label>
                <textarea
                  id="description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>


              

              {/* External URLs */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">External Product URLs</Label>
                {editForm.externalUrls.map((url, index) => (
                  <div key={index} className="flex gap-3">
                    <Input
                      placeholder="Platform"
                      value={url.platform}
                      onChange={(e) => {
                        const newUrls = [...editForm.externalUrls];
                        newUrls[index].platform = e.target.value;
                        setEditForm(f => ({ ...f, externalUrls: newUrls }));
                      }}
                      className="flex-1"
                    />
                    <Input
                      placeholder="URL"
                      value={url.url}
                      onChange={(e) => {
                        const newUrls = [...editForm.externalUrls];
                        newUrls[index].url = e.target.value;
                        setEditForm(f => ({ ...f, externalUrls: newUrls }));
                      }}
                      className="flex-[2]"
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditForm(f => ({
                            ...f,
                            externalUrls: f.externalUrls.filter((_, i) => i !== index)
                          }));
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FaTimes />
                      </button>
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
                  className="w-full border-dashed"
                >
                  <FaPlus className="mr-2" />
                  Add URL
                </Button>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-gray-700">Product Images</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('image-upload').click()}
                    >
                      <FaImage className="mr-2" />
                      Add Images
                    </Button>
                    {(editImages.length > 0 || newImages.length > 0) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearAllImages}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Clear All
                      </Button>
                    )}
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
                
                <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  {editImages.length + newImages.length} of 10 images • Minimum 3 required
                </div>

                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {editImages.map((image, index) => (
                    <div key={`existing-${index}`} className="relative group aspect-square">
                      <img
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index, false)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    </div>
                  ))}
                  {newImages.map((file, index) => (
                    <div key={`new-${index}`} className="relative group aspect-square">
                      <img
                        src={imagePreviews[index]}
                        alt={`New ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border-2 border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index, true)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>

                {editImages.length === 0 && newImages.length === 0 && (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                    <FaImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">No images uploaded</p>
                    <p className="text-sm text-gray-500">Click "Add Images" to upload</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200">
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
                      <FaSpinner className="mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default ProductPage;