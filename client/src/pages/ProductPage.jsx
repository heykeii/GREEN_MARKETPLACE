import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Loader2, ChevronLeft, ChevronRight, Leaf, ShoppingCart, Zap, Heart, Star } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cartLoading, setCartLoading] = useState({});
  const [wishlist, setWishlist] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const productsGridRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProducts(page);
    // eslint-disable-next-line
  }, [page]);

  useEffect(() => {
    const handleProductSearch = (e) => {
      setSearchTerm(e.detail);
      setTimeout(() => {
        productsGridRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      setTimeout(() => setSearchTerm(''), 5000); // Optionally clear after 5s
    };
    window.addEventListener('productSearch', handleProductSearch);
    return () => window.removeEventListener('productSearch', handleProductSearch);
  }, []);

  const fetchProducts = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/products/?page=${pageNum}&limit=12`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (e) {
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    if (user && token) {
      // Logged in: use backend
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/cart/add`, {
          productId: product._id,
          quantity: 1
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success('Added to cart!');
      } catch (err) {
        toast.error('Failed to add to cart');
      }
    } else {
      // Guest: use localStorage
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');
      if (cart.some(item => item._id === product._id)) {
        toast.info('Product already in cart');
        return;
      }
      cart.push({ ...product, quantity: 1 });
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success('Added to cart!');
    }
  };

  const handleBuyNow = async (productId) => {
    setCartLoading(prev => ({ ...prev, [productId]: 'buy' }));
    try {
      // Add your buy now API call here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      console.log('Buy now:', productId);
    } catch (error) {
      console.error('Error with buy now:', error);
    } finally {
      setCartLoading(prev => ({ ...prev, [productId]: null }));
    }
  };

  const toggleWishlist = (productId) => {
    setWishlist(prev => {
      const newWishlist = new Set(prev);
      if (newWishlist.has(productId)) {
        newWishlist.delete(productId);
      } else {
        newWishlist.add(productId);
      }
      return newWishlist;
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-green-800 mb-4 flex items-center justify-center gap-3">
            <Leaf className="text-emerald-500" /> 
            Marketplace Products
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Discover eco-conscious products from trusted sellers in Green Marketplace
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="text-center">
              <Loader2 className="animate-spin h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading products...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Package className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
            <p className="text-gray-500">There are no approved products available at the moment.</p>
          </div>
        ) : (
          <div ref={productsGridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.filter(product =>
              !searchTerm ||
              product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.category.toLowerCase().includes(searchTerm.toLowerCase())
            ).map(product => (
              <Card key={product._id} className="group relative overflow-hidden shadow-lg border-emerald-100 bg-white/95 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 backdrop-blur-sm">
                {/* Wishlist Button */}
                <button
                  onClick={() => toggleWishlist(product._id)}
                  className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-all duration-200"
                >
                  <Heart className={`w-4 h-4 ${wishlist.has(product._id) ? 'text-red-500' : 'text-gray-400'}`} />
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
                      <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                        {product.description}
                      </p>
                      
                     

                      {/* Price */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-green-700 font-bold text-xl">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          In Stock
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleBuyNow(product._id)}
                        disabled={cartLoading[product._id]}
                        className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        {cartLoading[product._id] === 'buy' ? (
                          <Loader2 className="animate-spin mr-2" />
                        ) : (
                          <Zap className="mr-2" />
                        )}
                        Buy Now
                      </Button>
                      
                      <Button
                        onClick={() => handleAddToCart(product)}
                        disabled={cartLoading[product._id]}
                        variant="outline"
                        className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 font-medium py-2.5 rounded-lg transition-all duration-200"
                      >
                        {cartLoading[product._id] === 'cart' ? (
                          <Loader2 className="animate-spin mr-2" />
                        ) : (
                          <ShoppingCart className="mr-2" />
                        )}
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-16 gap-4">
            <Button 
              size="sm" 
              variant="outline" 
              disabled={page === 1} 
              onClick={() => setPage(page - 1)}
              className="px-6 py-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <ChevronLeft className="mr-2" /> Previous
            </Button>
            
            <div className="flex items-center gap-2">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={page === pageNum ? "default" : "outline"}
                    onClick={() => setPage(pageNum)}
                    className={page === pageNum ? 
                      "bg-emerald-600 text-white" : 
                      "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button 
              size="sm" 
              variant="outline" 
              disabled={page === totalPages} 
              onClick={() => setPage(page + 1)}
              className="px-6 py-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              Next <ChevronRight className="ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;