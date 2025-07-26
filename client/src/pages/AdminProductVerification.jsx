import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Eye, Package, User, Calendar, MapPin, Palette, Tag, DollarSign, Hash, Wrench, Filter, Clock, Star, ArrowLeft, ArrowRight, MoreHorizontal } from 'lucide-react';
import noProfile from '@/assets/no_profile.jpg';
import { AdminNavbar } from '@/components/Navbar';

const AdminProductVerification = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectionModal, setRejectionModal] = useState({ open: false, productId: null });
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sellerAvatars, setSellerAvatars] = useState({});
  const [statusFilter, setStatusFilter] = useState('pending');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts(page, statusFilter);
    // eslint-disable-next-line
  }, [page, statusFilter]);

  // Fetch seller avatars if missing
  useEffect(() => {
    const fetchAvatars = async () => {
      const missing = products.filter(p => p.seller && !p.seller.avatar && !sellerAvatars[p.seller._id]);
      for (const product of missing) {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users/profile/${product.seller._id}`);
          setSellerAvatars(prev => ({ ...prev, [product.seller._id]: res.data.profile.avatar }));
        } catch (e) {
          setSellerAvatars(prev => ({ ...prev, [product.seller._id]: null }));
        }
      }
    };
    if (products.length > 0) fetchAvatars();
    // eslint-disable-next-line
  }, [products]);

  const fetchProducts = async (pageNum = 1, status = 'pending') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      let endpoint = '/api/v1/admin/products/pending';
      if (status === 'approved') endpoint = '/api/v1/admin/products/approved';
      if (status === 'rejected') endpoint = '/api/v1/admin/products/rejected';
      const response = await axios.get(`${import.meta.env.VITE_API_URL}${endpoint}?page=${pageNum}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setProducts(response.data.products || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      toast.error('Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (productId) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/v1/admin/products/approve/${productId}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Product approved!');
      fetchProducts(page, statusFilter);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve product.');
    }
  };

  const handleReject = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/v1/admin/products/reject/${rejectionModal.productId}`, { message: rejectionMessage }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Product rejected!');
      setRejectionModal({ open: false, productId: null });
      setRejectionMessage('');
      fetchProducts(page, statusFilter);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject product.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
    
      {/* Floating Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20"></div>
                <div className="relative p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                  <Package className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Product Verification
                </h1>
                <p className="text-gray-500 text-sm font-medium">Review and manage pending submissions</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                <Badge 
                  variant="secondary" 
                  className="px-4 py-2 text-sm font-semibold bg-amber-50 text-amber-700 border-amber-200 rounded-full"
                >
                  {products.length} Pending Review
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 px-4 py-2 rounded-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit">
              {[{key:'pending',label:'Pending'},{key:'approved',label:'Approved'},{key:'rejected',label:'Rejected'}].map(tab => (
                <button key={tab.key} onClick={()=>{setStatusFilter(tab.key);setPage(1);}} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${statusFilter===tab.key?'bg-blue-600 text-white shadow-md':'text-gray-600 hover:bg-gray-50'}`}>{tab.label}</button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Products</h3>
                <p className="text-gray-500">Fetching pending submissions for review...</p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative mb-6">
                <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                  <Package className="w-16 h-16 text-gray-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">All Caught Up!</h3>
              <p className="text-gray-500 text-lg max-w-md mx-auto">
                No products pending review. All submissions have been processed and are ready to go live.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {products.map((product, index) => (
                <div 
                  key={product._id} 
                  className="group relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Card with enhanced shadow and hover effects */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                  
                  <Card className="relative overflow-hidden border-0 shadow-xl shadow-gray-200/50 bg-white/80 backdrop-blur-sm hover:shadow-2xl hover:shadow-gray-300/50 transition-all duration-500 rounded-3xl group-hover:scale-[1.02]">
                    <CardContent className="p-0">
                      <div className="grid lg:grid-cols-5 gap-0 min-h-[400px]">
                        {/* Enhanced Product Images Section */}
                        <div className="lg:col-span-2 bg-gradient-to-br from-gray-50 via-white to-gray-100 p-8 flex flex-col justify-center relative overflow-hidden">
                          <div className="absolute top-4 right-4 z-10">
                            <Badge className="bg-amber-100/90 backdrop-blur-sm text-amber-700 border-amber-200/50 rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          </div>
                          
                          {product.images && product.images.length > 0 ? (
                            <div className="w-full space-y-4">
                              <div className="aspect-square relative rounded-2xl overflow-hidden shadow-2xl group-hover:shadow-3xl transition-all duration-500">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent z-10"></div>
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                {product.images.length > 1 && (
                                  <div className="absolute bottom-3 right-3 z-20">
                                    <Badge className="bg-black/50 backdrop-blur-sm text-white border-0 rounded-full px-2 py-1 text-xs">
                                      +{product.images.length - 1} more
                                    </Badge>
                                  </div>
                                )}
                              </div>
                              
                              {product.images.length > 1 && (
                                <div className="grid grid-cols-4 gap-2">
                                  {product.images.slice(1, 5).map((img, idx) => (
                                    <div key={idx} className="aspect-square relative rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                                      <img
                                        src={img}
                                        alt={`Product view ${idx + 2}`}
                                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-inner">
                              <div className="text-center">
                                <Package className="w-20 h-20 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm font-medium">No Image Available</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Enhanced Content Section */}
                        <div className="lg:col-span-3 p-8 flex flex-col justify-between">
                          <div className="space-y-6">
                            {/* Product Header */}
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-4">
                                <h2 className="text-2xl font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors duration-300">
                                  {product.name}
                                </h2>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="shrink-0 w-10 h-10 rounded-full hover:bg-gray-100 p-0"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </div>
                              <p className="text-gray-600 leading-relaxed text-sm line-clamp-2">
                                {product.description}
                              </p>
                            </div>

                            {/* Enhanced Seller Section */}
                            <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all duration-300">
                              <div className="relative group/avatar">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur opacity-75 group-hover/avatar:opacity-100 transition-opacity"></div>
                                <img
                                  src={product.seller?.avatar || sellerAvatars[product.seller?._id] || noProfile}
                                  alt="Seller"
                                  className="relative w-14 h-14 rounded-full object-cover border-3 border-white shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300"
                                  onClick={() => navigate(`/profile/${product.seller?._id}`)}
                                  onError={e => { e.target.onerror = null; e.target.src = noProfile; }}
                                  title="View Profile"
                                />
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-sm">
                                  <div className="w-full h-full bg-emerald-400 rounded-full animate-pulse"></div>
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 text-base">
                                  {product.seller?.firstName} {product.seller?.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{product.seller?.email}</div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                  <span className="text-xs text-gray-600">Verified Seller</span>
                                </div>
                              </div>
                            </div>

                            {/* Enhanced Details Grid */}
                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors duration-200">
                                  <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                                    <Tag className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <span className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Category</span>
                                    <div className="font-medium text-gray-900">{product.category}</div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors duration-200">
                                  <div className="p-2 bg-emerald-500 rounded-lg shadow-sm">
                                    <DollarSign className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Price</span>
                                    <div className="font-bold text-xl text-gray-900">₱{product.price}</div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors duration-200">
                                  <div className="p-2 bg-purple-500 rounded-lg shadow-sm">
                                    <Hash className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <span className="text-xs text-purple-600 font-semibold uppercase tracking-wide">Stock</span>
                                    <div className="font-medium text-gray-900">{product.quantity} units</div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 hover:bg-rose-100 transition-colors duration-200">
                                  <div className="p-2 bg-rose-500 rounded-lg shadow-sm">
                                    <MapPin className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <span className="text-xs text-rose-600 font-semibold uppercase tracking-wide">Origin</span>
                                    <div className="font-medium text-gray-900">{product.origin}</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Additional Details */}
                            <div className="space-y-4 p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
                              <div className="flex items-start gap-3">
                                <Wrench className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Production Method</span>
                                  <p className="text-gray-900 font-medium">{product.productionMethod}</p>
                                </div>
                              </div>
                              
                              {product.materialsUsed && product.materialsUsed.length > 0 && (
                                <div className="flex items-start gap-3">
                                  <Palette className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                                  <div>
                                    <span className="text-sm font-medium text-gray-700 block mb-2">Materials Used</span>
                                    <div className="flex flex-wrap gap-2">
                                      {product.materialsUsed.map((material, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors">
                                          {material}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {product.tags && product.tags.length > 0 && (
                                <div className="flex items-start gap-3">
                                  <Tag className="w-5 h-5 text-pink-500 mt-0.5 shrink-0" />
                                  <div>
                                    <span className="text-sm font-medium text-gray-700 block mb-2">Tags</span>
                                    <div className="flex flex-wrap gap-2">
                                      {product.tags.map((tag, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs font-medium border-pink-200 text-pink-600 hover:bg-pink-50 transition-colors">
                                          #{tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Enhanced Action Buttons */}
                          <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                            {product.status === 'pending' && (
                              <>
                                <Button 
                                  onClick={() => handleApprove(product._id)}
                                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 gap-3 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                  Approve Product
                                </Button>
                                
                                <Button 
                                  onClick={() => setRejectionModal({ open: true, productId: product._id })}
                                  variant="outline"
                                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 gap-3 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105"
                                >
                                  <XCircle className="w-5 h-5" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {product.status !== 'pending' && (
                              <Badge 
                                variant={product.status === 'approved' ? 'success' : 'destructive'} 
                                className="px-4 py-2 rounded-full text-sm font-semibold"
                              >
                                {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                              </Badge>
                            )}
                            
                            <Button 
                              variant="outline"
                              className="px-4 py-3 rounded-2xl border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 hover:scale-105"
                            >
                              <Eye className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-16">
              <Button 
                variant="outline" 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)}
                className="gap-2 px-6 py-3 rounded-2xl border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, idx) => {
                  const pageNum = idx + 1;
                  if (pageNum === page) {
                    return (
                      <Button 
                        key={pageNum} 
                        size="sm" 
                        className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold shadow-lg shadow-blue-500/25"
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                  if (Math.abs(pageNum - page) <= 2 || pageNum === 1 || pageNum === totalPages) {
                    return (
                      <Button 
                        key={pageNum} 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setPage(pageNum)}
                        className="w-12 h-12 rounded-2xl border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                  if (Math.abs(pageNum - page) === 3) {
                    return (
                      <span key={pageNum} className="px-3 text-gray-400 font-medium">
                        ···
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
              
              <Button 
                variant="outline" 
                disabled={page === totalPages} 
                onClick={() => setPage(page + 1)}
                className="gap-2 px-6 py-3 rounded-2xl border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Rejection Modal */}
      {rejectionModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 rounded-2xl blur opacity-20"></div>
                  <div className="relative p-3 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl shadow-lg">
                    <XCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Reject Product</h2>
                  <p className="text-gray-500 text-sm">This action will notify the seller</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                  Rejection Reason
                </Label>
                <Input
                  value={rejectionMessage}
                  onChange={e => setRejectionMessage(e.target.value)}
                  placeholder="Please provide a clear reason for rejection..."
                  className="w-full p-4 rounded-2xl border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  This message will be sent to the seller to help them improve their submission
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 p-8 border-t border-gray-100">
              <Button 
                variant="outline" 
                onClick={() => setRejectionModal({ open: false, productId: null })}
                className="flex-1 py-3 rounded-2xl border-gray-200 hover:bg-gray-50 font-semibold transition-all duration-200"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleReject}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white py-3 rounded-2xl font-semibold shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300"
              >
                Reject Product
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductVerification;