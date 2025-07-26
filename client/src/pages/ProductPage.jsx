import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
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
  FaToggleOff
} from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    const storedToken = localStorage.getItem('token');
    setUser(storedUser);
    setToken(storedToken);
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/products/view/${productId}`);
      setProduct(response.data.product);
      
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

  const handleEditProduct = () => {
    navigate(`/seller/edit-product/${productId}`);
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
                        <span className="text-gray-600">4.5 (24 reviews)</span>
                      </div>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                        {product.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleWishlist}
                      className={`border-gray-200 hover:border-red-300 ${
                        isWishlisted ? 'text-red-500' : 'text-gray-500'
                      }`}
                    >
                      <FaHeart className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="border-gray-200 text-gray-500 hover:border-emerald-300"
                    >
                      <FaShare className="h-4 w-4" />
                    </Button>
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
                    {product.quantity > 0 && ` (${product.quantity} available)`}
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
                    <span className="text-sm text-gray-600">
                      {product.quantity} available
                    </span>
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
      </div>
      <Footer />
    </>
  );
};

export default ProductPage;