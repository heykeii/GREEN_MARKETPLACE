import React, { useState, useEffect } from 'react';
import { ExternalLink, Store, Star, Calendar, User, Eye, MoreHorizontal, Verified, ShoppingBag, TrendingUp, Users, Trash } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import axios from 'axios';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { toast } from 'react-hot-toast';

const PromotionalCampaign = ({ campaign }) => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const canDelete = campaign?.createdBy && (window?.LOCAL_USER?.role === 'admin');

  useEffect(() => {
    if (campaign.featuredBusinesses?.length > 0) {
      fetchFeaturedProducts();
    }
  }, [campaign.featuredBusinesses]);

  const fetchFeaturedProducts = async () => {
    setLoading(true);
    try {
      // Fetch products from featured businesses
      const businessIds = campaign.featuredBusinesses.map(business => business._id);
      const response = await axios.get(`/api/v1/products/by-sellers?sellers=${businessIds.join(',')}&limit=6`);
      setFeaturedProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      toast.error('Failed to load featured products');
    } finally {
      setLoading(false);
    }
  };

  const handleVisitStore = (sellerId) => {
    window.open(`/seller/${sellerId}`, '_blank');
  };

  const handleViewProduct = (productId) => {
    window.open(`/product/${productId}`, '_blank');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white shadow-lg rounded-2xl overflow-hidden border-0">
      {/* Header with uploader info */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 ring-2 ring-blue-100">
              <AvatarImage 
                src={campaign.createdBy?.avatar} 
                alt={campaign.createdBy?.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-500 text-white font-semibold">
                {(campaign.createdBy?.name || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 text-base">
                  {campaign.createdBy?.firstName ? `${campaign.createdBy.firstName}${campaign.createdBy.lastName ? ' ' + campaign.createdBy.lastName : ''}` : (campaign.createdBy?.name || 'User')}
                </h3>
                {campaign.createdBy?.isVerified && (
                  <Verified className="h-4 w-4 text-blue-500" />
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(campaign.createdAt)}</span>
                <span>•</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                  <Store className="h-3 w-3 mr-1" />
                  Promotional
                </Badge>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded hover:bg-gray-100">
                <MoreHorizontal className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuItem onClick={async () => {
                if (!window.confirm('Delete this campaign? This cannot be undone.')) return;
                try {
                  await axios.delete(`/api/campaigns/${campaign._id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                  window.location.href = '/campaigns';
                } catch (e) {}
              }} className="text-red-600">
                <Trash className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Campaign Title and Description */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 leading-tight">{campaign.title}</h2>
          {campaign.description && (
            <p className="text-gray-700 leading-relaxed">{campaign.description}</p>
          )}
        </div>
      </CardHeader>

      {/* Campaign Image */}
      {campaign.image && (
        <div className="relative">
          <img
            src={campaign.image}
            alt={campaign.title}
            className="w-full h-80 object-cover"
          />
          <div className="absolute top-4 right-4">
            <Badge className="bg-blue-600 text-white">
              <ShoppingBag className="h-3 w-3 mr-1" />
              Featured Products
            </Badge>
          </div>
        </div>
      )}

      <CardContent className="pt-6">
        {/* Campaign Stats */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  {campaign.featuredBusinesses?.length || 0} Businesses Featured
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">
                  {featuredProducts.length} Products Available
                </span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Featured Businesses Section */}
        {campaign.featuredBusinesses?.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-6">
              <Store className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">Featured Eco-Businesses</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaign.featuredBusinesses.map((business) => (
                <div key={business._id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 hover:shadow-lg transition-all duration-200 border border-blue-100">
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar className="h-12 w-12 ring-2 ring-blue-200">
                      <AvatarImage src={business.avatar} alt={business.businessName || business.name} />
                      <AvatarFallback className="bg-blue-500 text-white font-semibold">
                        {(business.businessName || business.name || 'B').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {business.businessName || business.name}
                        </h4>
                        {business.isVerified && (
                          <Verified className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600">{business.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVisitStore(business._id)}
                    className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800"
                  >
                    <span>Visit Store</span>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Featured Products Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Featured Eco-Products</h3>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="border rounded-lg p-4 animate-pulse">
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredProducts.map((product) => (
                <div key={product._id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="w-full h-48 overflow-hidden">
                    <img
                      src={product.images?.[0] || '/api/placeholder/200/200'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                      {product.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-green-600">
                        {formatPrice(product.price)}
                      </span>
                      {product.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-gray-600">
                            {product.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewProduct(product._id)}
                        className="flex-1"
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVisitStore(product.seller._id)}
                        className="px-3"
                      >
                        <Store className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No featured products available at the moment.</p>
            </div>
          )}
        </div>

        {/* Campaign Duration */}
        {(campaign.startDate || campaign.endDate) && (
          <div className="mt-8 p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Campaign Duration</h4>
            <div className="text-sm text-green-700">
              {campaign.startDate && (
                <p>Starts: {formatDate(campaign.startDate)}</p>
              )}
              {campaign.endDate && (
                <p>Ends: {formatDate(campaign.endDate)}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PromotionalCampaign;
