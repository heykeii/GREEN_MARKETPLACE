import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  FaEye,
  FaSearch,
  FaTimes,
  FaFilter
} from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState({});
  const [wishlist, setWishlist] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reviewStats, setReviewStats] = useState({});

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  // Helper function to check if current user is the seller of a product
  const isProductOwner = (product) => {
    return user && product.seller === user._id;
  };

  useEffect(() => {
    const query = searchParams.get('q') || '';
    setSearchQuery(query);
    if (query.trim()) {
      fetchSearchResults(query, 1);
    } else {
      setLoading(false);
      setProducts([]);
    }
  }, [searchParams]);

  const fetchSearchResults = async (query, page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/products/search`, {
        params: {
          q: query,
          page: page,
          limit: 20
        }
      });
      
      const productsData = response.data.products || [];
      setProducts(productsData);
      setTotalResults(response.data.pagination?.totalItems || 0);
      setCurrentPage(response.data.pagination?.currentPage || 1);
      setTotalPages(response.data.pagination?.totalPages || 1);
      
      // Fetch review stats for search results
      await fetchReviewStats(productsData);
    } catch (error) {
      console.error('Error fetching search results:', error);
      toast.error('Failed to load search results');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewStats = async (productsData) => {
    try {
      const statsPromises = productsData.map(async (product) => {
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/reviews/product/${product._id}?page=1&limit=1`);
          return { productId: product._id, stats: response.data.stats };
        } catch (error) {
          console.error(`Error fetching review stats for product ${product._id}:`, error);
          return { productId: product._id, stats: { averageRating: 0, totalReviews: 0 } };
        }
      });
      
      const statsResults = await Promise.all(statsPromises);
      const statsMap = {};
      statsResults.forEach(({ productId, stats }) => {
        statsMap[productId] = stats;
      });
      setReviewStats(statsMap);
    } catch (error) {
      console.error('Error fetching review stats:', error);
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchSearchResults(searchQuery, page);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchParams({});
    navigate('/products');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-50 pt-24">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-center items-center py-24">
              <div className="text-center">
                <FaSpinner className="animate-spin h-12 w-12 text-emerald-600 mx-auto mb-4" />
                <p className="text-gray-600">Searching products...</p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Search Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FaSearch className="text-2xl text-emerald-600" />
                <h1 className="text-3xl font-bold text-gray-900">
                  Search Results
                </h1>
              </div>
              <Button
                onClick={clearSearch}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FaTimes className="h-4 w-4" />
                Clear Search
              </Button>
            </div>
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="max-w-2xl">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <Button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-emerald-600 hover:bg-emerald-700"
                >
                  Search
                </Button>
              </div>
            </form>
          </div>

          {/* Results Summary */}
          <div className="mb-6">
            <p className="text-gray-600">
              {totalResults > 0 
                ? `Found ${totalResults} result${totalResults === 1 ? '' : 's'} for "${searchParams.get('q')}"`
                : `No results found for "${searchParams.get('q')}"`
              }
            </p>
          </div>

          {/* No Results */}
          {products.length === 0 && !loading && (
            <div className="text-center py-24">
              <FaSearch className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search terms or browse our categories</p>
              <Button onClick={() => navigate('/products')} className="bg-emerald-600 hover:bg-emerald-700">
                Browse All Products
              </Button>
            </div>
          )}

          {/* Products Grid */}
          {products.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-8">
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
                            <span className="text-sm text-gray-600">
                              {reviewStats[product._id]?.averageRating > 0 
                                ? `${reviewStats[product._id].averageRating.toFixed(1)} (${reviewStats[product._id].totalReviews} ${reviewStats[product._id].totalReviews === 1 ? 'review' : 'reviews'})`
                                : 'No reviews yet'
                              }
                            </span>
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    className="px-4 py-2"
                  >
                    Previous
                  </Button>
                  
                  <span className="px-4 py-2 text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    className="px-4 py-2"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SearchResults; 