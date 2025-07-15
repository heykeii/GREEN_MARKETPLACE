import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Eye, Package, User, Calendar, MapPin, Palette, Tag, DollarSign, Hash, Wrench, Filter } from 'lucide-react';
import noProfile from '@/assets/no_profile.jpg';

const AdminProductVerification = () => {
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectionModal, setRejectionModal] = useState({ open: false, productId: null });
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sellerAvatars, setSellerAvatars] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingProducts(page);
    // eslint-disable-next-line
  }, [page]);

  // Fetch seller avatars if missing
  useEffect(() => {
    const fetchAvatars = async () => {
      const missing = pendingProducts.filter(p => p.seller && !p.seller.avatar && !sellerAvatars[p.seller._id]);
      for (const product of missing) {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users/profile/${product.seller._id}`);
          setSellerAvatars(prev => ({ ...prev, [product.seller._id]: res.data.profile.avatar }));
        } catch (e) {
          setSellerAvatars(prev => ({ ...prev, [product.seller._id]: null }));
        }
      }
    };
    if (pendingProducts.length > 0) fetchAvatars();
    // eslint-disable-next-line
  }, [pendingProducts]);

  const fetchPendingProducts = async (pageNum = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/admin/products/pending?page=${pageNum}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setPendingProducts(response.data.products || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      toast.error('Failed to fetch pending products.');
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
      fetchPendingProducts(page);
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
      fetchPendingProducts(page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject product.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Product Verification</h1>
                <p className="text-slate-600 text-sm">Review and approve pending products</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1 text-sm">
                {pendingProducts.length} Pending
              </Badge>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading pending products...</p>
            </div>
          </div>
        ) : pendingProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Pending Products</h3>
            <p className="text-slate-600">All products have been reviewed and processed.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingProducts.map(product => (
              <Card key={product._id} className="overflow-hidden border-0 shadow-lg shadow-slate-200/50 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="grid lg:grid-cols-12 gap-0">
                    {/* Product Images */}
                    <div className="lg:col-span-4 bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
                      {product.images && product.images.length > 0 ? (
                        <div className="w-full">
                          <div className="aspect-square relative rounded-xl overflow-hidden mb-4 shadow-md">
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {product.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                              {product.images.slice(1, 5).map((img, idx) => (
                                <div key={idx} className="aspect-square relative rounded-md overflow-hidden">
                                  <img
                                    src={img}
                                    alt={`product-img-${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full aspect-square bg-slate-200 rounded-xl flex items-center justify-center">
                          <Package className="w-16 h-16 text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="lg:col-span-8 p-6">
                      <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h2 className="text-2xl font-bold text-slate-900">{product.name}</h2>
                              <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                Pending Review
                              </Badge>
                            </div>
                            <p className="text-slate-600 leading-relaxed">{product.description}</p>
                          </div>
                        </div>

                        {/* Seller Info */}
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                          <div className="relative">
                            <img
                              src={product.seller?.avatar || sellerAvatars[product.seller?._id] || noProfile}
                              alt="Seller"
                              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                              onClick={() => navigate(`/profile/${product.seller?._id}`)}
                              onError={e => { e.target.onerror = null; e.target.src = noProfile; }}
                              title="View Profile"
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {product.seller?.firstName} {product.seller?.lastName}
                            </div>
                            <div className="text-sm text-slate-600">{product.seller?.email}</div>
                          </div>
                        </div>

                        {/* Product Details Grid */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                              <Tag className="w-4 h-4 text-blue-500" />
                              <span className="text-slate-600">Category:</span>
                              <Badge variant="outline" className="text-xs">{product.category}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <DollarSign className="w-4 h-4 text-green-500" />
                              <span className="text-slate-600">Price:</span>
                              <span className="font-semibold text-slate-900">₱{product.price}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <Hash className="w-4 h-4 text-purple-500" />
                              <span className="text-slate-600">Quantity:</span>
                              <span className="font-semibold text-slate-900">{product.quantity}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <MapPin className="w-4 h-4 text-red-500" />
                              <span className="text-slate-600">Origin:</span>
                              <span className="font-semibold text-slate-900">{product.origin}</span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                              <Wrench className="w-4 h-4 text-orange-500" />
                              <span className="text-slate-600">Production:</span>
                              <span className="font-semibold text-slate-900">{product.productionMethod}</span>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                              <Palette className="w-4 h-4 text-indigo-500 mt-0.5" />
                              <span className="text-slate-600">Materials:</span>
                              <div className="flex flex-wrap gap-1">
                                {product.materialsUsed?.map((material, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {material}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                              <Tag className="w-4 h-4 text-pink-500 mt-0.5" />
                              <span className="text-slate-600">Tags:</span>
                              <div className="flex flex-wrap gap-1">
                                {product.tags?.map((tag, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                          <Button 
                            onClick={() => handleApprove(product._id)}
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/25 gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve Product
                          </Button>
                          <Button 
                            onClick={() => setRejectionModal({ open: true, productId: product._id })}
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                          <Button 
                            variant="outline"
                            className="gap-2 ml-auto"
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <Button 
              variant="outline" 
              disabled={page === 1} 
              onClick={() => setPage(page - 1)}
              className="gap-2"
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, idx) => {
                const pageNum = idx + 1;
                if (pageNum === page) {
                  return (
                    <Button key={pageNum} size="sm" className="bg-blue-500 hover:bg-blue-600">
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
                    >
                      {pageNum}
                    </Button>
                  );
                }
                if (Math.abs(pageNum - page) === 3) {
                  return <span key={pageNum} className="px-2 text-slate-400">...</span>;
                }
                return null;
              })}
            </div>
            <Button 
              variant="outline" 
              disabled={page === totalPages} 
              onClick={() => setPage(page + 1)}
              className="gap-2"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Enhanced Rejection Modal */}
      {rejectionModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in duration-200">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Reject Product</h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                  Rejection Message (Optional)
                </Label>
                <Input
                  value={rejectionMessage}
                  onChange={e => setRejectionMessage(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  className="resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">This message will be sent to the seller.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-slate-100">
              <Button 
                variant="outline" 
                onClick={() => setRejectionModal({ open: false, productId: null })}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleReject}
                className="bg-red-500 hover:bg-red-600 text-white"
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