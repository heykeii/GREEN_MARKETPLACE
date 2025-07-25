import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import { 
  FaSpinner, 
  FaHeart, 
  FaShoppingCart,
  FaStar,
  FaEye
} from 'react-icons/fa';

const ProductsListing = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState({});
  const [wishlist, setWishlist] = useState(new Set());
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  // Helper function to check if current user is the seller of a product
  const isProductOwner = (product) => {
    return user && product.seller === user._id;
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/products/`);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    if (!user || !token) {
      toast.error('Please login to add items to your cart');
      return;
    }

    setCartLoading(prev => ({ ...prev, [product._id]: true }));
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/cart/add`, {
        productId: product._id,
        quantity: 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Added to cart successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setCartLoading(prev => ({ ...prev, [product._id]: false }));
    }
  };

  const handleWishlist = (productId) => {
    setWishlist(prev => {
      const newWishlist = new Set(prev);
      if (newWishlist.has(productId)) {
        newWishlist.delete(productId);
        toast.success('Removed from wishlist');
      } else {
        newWishlist.add(productId);
        toast.success('Added to wishlist');
      }
      return newWishlist;
    });
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="text-center">
          <FaSpinner className="animate-spin h-12 w-12 text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-24">
        <FaEye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No products available</h3>
        <p className="text-gray-500">Check back soon for amazing sustainable products!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {products.map((product) => (
        <Card 
          key={product._id} 
          className="group relative overflow-hidden shadow-lg border-emerald-100 bg-white/95 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 backdrop-blur-sm cursor-pointer"
          onClick={() => handleProductClick(product._id)}
        >
          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleWishlist(product._id);
            }}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-all duration-200"
          >
            <FaHeart className={`w-4 h-4 ${wishlist.has(product._id) ? 'text-red-500' : 'text-gray-400'}`} />
          </button>

          <CardContent className="p-0 flex flex-col h-full">
            {/* Product Image */}
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
              <img
                src={product.images?.[0] || ''}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              {/* Category Badge */}
              <div className="absolute top-3 left-3 bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                {product.category}
              </div>
            </div>

            {/* Product Info */}
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex-1 mb-4">
                <h2 className="font-bold text-lg text-emerald-800 mb-2 line-clamp-2 leading-tight">
                  {product.name}
                </h2>
                <p className="text-gray-700 text-sm line-clamp-3 mb-3">
                  {product.description}
                </p>
                
                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  <FaStar className="text-amber-500 text-sm" />
                  <span className="text-sm text-gray-600">4.5 (24 reviews)</span>
                </div>
              </div>

              {/* Price and Stock */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-green-700 font-bold text-xl">
                  ₱{product.price.toLocaleString()}
                </span>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  product.quantity > 10 
                    ? 'text-emerald-600 bg-emerald-100' 
                    : product.quantity > 0 
                    ? 'text-yellow-600 bg-yellow-100'
                    : 'text-red-600 bg-red-100'
                }`}>
                  {product.quantity > 10 ? 'In Stock' : 
                   product.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {!isProductOwner(product) ? (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                    disabled={product.quantity === 0 || cartLoading[product._id]}
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    {cartLoading[product._id] ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <FaShoppingCart className="mr-2" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="w-full bg-gray-100 text-gray-600 font-medium py-2.5 rounded-lg text-center">
                    Your Product
                  </div>
                )}
                
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(product._id);
                  }}
                  variant="outline"
                  className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 font-medium py-2.5 rounded-lg transition-all duration-200"
                >
                  <FaEye className="mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProductsListing; 