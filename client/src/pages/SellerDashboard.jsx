import React, { useEffect, useState, useCallback, useMemo } from 'react';
// Charts
import { Line, Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/utils/toast';
import { FaSpinner, FaPlus, FaEdit, FaTrash, FaImage, FaTimes, FaStore, FaBoxOpen, FaClock, FaCheck, FaChartLine, FaUsers, FaShoppingCart, FaHeart, FaStar, FaFilter, FaSearch, FaList, FaDownload, FaUserTie, FaChartBar, FaDollarSign, FaEye, FaShoppingBag, FaCalendarAlt, FaGlobe, FaTag, FaArrowDown, FaArrowUp } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CATEGORY_OPTIONS } from '@/constants/categories';
import { onSellerAnalyticsUpdated } from '@/lib/socket';

const SellerDashboard = () => {
  const [user, setUser] = useState(null);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [approvedProducts, setApprovedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('approved');
  const [showEditForm, setShowEditForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // Analytics state
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      averageRating: 0,
      monthlyGrowth: 0,
      conversionRate: 0
    },
    salesData: {
      daily: [],
      weekly: [],
      monthly: []
    },
    topProducts: [],
    categoryPerformance: [],
    customerInsights: {
      totalCustomers: 0,
      repeatCustomers: 0,
      averageOrderValue: 0,
      customerSatisfaction: 0
    },
    inventoryMetrics: {
      lowStockItems: 0,
      outOfStockItems: 0,
      totalInventoryValue: 0,
      inventoryTurnover: 0
    }
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('30d');
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
    origin: '',
    productionMethod: '',
    images: [],
    externalUrls: [{ platform: '', url: '' }]
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [gcashDetails, setGcashDetails] = useState(null);
  const [showGcashModal, setShowGcashModal] = useState(false);
  const [gcashNumberInput, setGcashNumberInput] = useState('');
  const formatGcash = (val) => {
    let digits = String(val || '').replace(/\D/g, '');
    if (digits.startsWith('63')) digits = digits.slice(2);
    if (digits.startsWith('0')) digits = digits.slice(1);
    const i = digits.indexOf('9');
    if (i !== -1) digits = digits.slice(i + 1); else digits = '';
    digits = digits.slice(0, 9);
    return '+639' + digits;
  };
  const [gcashQRFile, setGcashQRFile] = useState(null);

  const navigate = useNavigate();

  // Helper function to get empty analytics data
  const getEmptyAnalyticsData = () => ({
    overview: {
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: approvedProducts.length,
      averageRating: 0,
      monthlyGrowth: 0,
      conversionRate: 0
    },
    salesData: {
      daily: [],
      weekly: [],
      monthly: []
    },
    topProducts: [],
    categoryPerformance: [],
    customerInsights: {
      totalCustomers: 0,
      repeatCustomers: 0,
      averageOrderValue: 0,
      customerSatisfaction: 0
    },
    inventoryMetrics: {
      lowStockItems: 0,
      outOfStockItems: 0,
      totalInventoryValue: 0,
      inventoryTurnover: 0
    }
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (!storedUser || !storedUser.isSeller || storedUser.sellerStatus !== 'verified') {
      toast.error('You must be a verified seller to access this page.');
      navigate('/seller/application');
      return;
    }
    setUser(storedUser);
    fetchProducts();
    fetchAnalytics();
    fetchGcashDetails();

    // Listen for real-time analytics updates (e.g., when products are deleted or orders are completed)
    const cleanup = onSellerAnalyticsUpdated((data) => {
      console.log('Analytics update received:', data);
      if (data.reason === 'product_deleted') {
        console.log('Product deleted, refreshing analytics...');
        // Refresh analytics when a product is deleted
        // Add a small delay to ensure database is updated
        setTimeout(() => {
          fetchAnalytics(true);
        }, 500);
      } else if (data.reason === 'order_status_changed') {
        console.log('Order status changed, refreshing analytics...', data);
        // Refresh analytics when order is completed or ready
        // Add a small delay to ensure database is updated
        setTimeout(() => {
          fetchAnalytics(true);
          // Also refresh products to update inventory if needed
          fetchProducts();
        }, 500);
      }
    });

    return () => {
      if (cleanup && cleanup.off) {
        cleanup.off('seller_analytics_updated');
      }
    };
  }, []);

  const fetchGcashDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/seller/gcash/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setGcashDetails(res.data.gcash);
      }
    } catch (err) {
      console.error('Error fetching GCash details:', err);
      // silent
    }
  }, []);

  const openGcashModal = () => {
    setGcashNumberInput(gcashDetails?.number || '');
    setGcashQRFile(null);
    setShowGcashModal(true);
  };

  const handleUpdateGcash = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      if (gcashNumberInput) formData.append('gcashNumber', gcashNumberInput);
      if (gcashQRFile) formData.append('gcashQR', gcashQRFile);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/seller/gcash`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        setGcashDetails(res.data.gcash);
        toast.success('GCash details updated');
        setShowGcashModal(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update GCash details');
    } finally {
      setProcessing(false);
    }
  };

  // Update analytics data when products are fetched
  useEffect(() => {
    // Only update the total products count, let server provide real analytics data
    setAnalyticsData(prev => ({
      ...prev,
      overview: {
        ...prev.overview,
        totalProducts: approvedProducts.length + pendingProducts.length
      }
    }));
  }, [approvedProducts, pendingProducts]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching products with token:', token ? 'present' : 'missing');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/products/my-products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Products response:', response.data);
      const all = response.data.products || [];
      setPendingProducts(all.filter(p => p.status === 'pending'));
      setApprovedProducts(all.filter(p => p.status === 'approved'));
    } catch (error) {
      console.error('Error fetching products:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      
      toast.error('Failed to fetch your products.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchAnalytics = useCallback(async (forceRefresh = false) => {
    setAnalyticsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      
      console.log('Fetching analytics for user:', {
        hasToken: !!token,
        userId: user?._id,
        isSeller: user?.isSeller,
        sellerStatus: user?.sellerStatus,
        forceRefresh
      });

      // Check if user is verified seller before making request
      if (!user || !user.isSeller) {
        toast.error('You must be a seller to access analytics.');
        setAnalyticsData(getEmptyAnalyticsData());
        return;
      }

      if (user.sellerStatus !== 'verified') {
        toast.warning('Analytics are available only for verified sellers. Please complete your seller verification.');
        setAnalyticsData(getEmptyAnalyticsData());
        return;
      }
      
      // Add cache-busting parameter when force refreshing
      const cacheBuster = forceRefresh ? `&_t=${Date.now()}` : '';
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/seller/analytics?timeframe=${analyticsTimeframe}${cacheBuster}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Analytics response:', response.data);
      console.log('Category Performance:', response.data.categoryPerformance);
      console.log('Customer Insights:', response.data.customerInsights);
      console.log('Inventory Metrics:', response.data.inventoryMetrics);
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Analytics fetch error:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      
      if (error.response?.status === 403) {
        toast.error(`Access denied: ${error.response?.data?.message || 'You must be a verified seller to access analytics.'}`);
        return;
      }
      
      if (error.response?.status === 500) {
        toast.error('Analytics service is temporarily unavailable. Please try again later.');
        console.error('Server error details:', error.response?.data);
        return;
      }
      
      // For other errors, show detailed error message
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load analytics data';
      toast.error(`Analytics Error: ${errorMessage}`);
      
      // Set default/empty analytics data
      setAnalyticsData(getEmptyAnalyticsData());
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsTimeframe, navigate, approvedProducts.length]);

  // Debug function to check seller status
  const checkSellerStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/seller/debug-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Seller status check:', response.data);
      
      if (!response.data.canAccessAnalytics) {
        console.log('User cannot access analytics:', {
          isSeller: response.data.isSeller,
          sellerStatus: response.data.sellerStatus
        });
      }
    } catch (error) {
      console.error('Seller status check failed:', error);
    }
  }, []);

  // Fetch analytics when timeframe changes
  useEffect(() => {
    if (user && user.isSeller && user.sellerStatus === 'verified') {
      // Initial fetch
      fetchAnalytics();

      // Set up periodic refresh every 5 minutes
      const refreshInterval = setInterval(() => {
        console.log('Auto-refreshing analytics data...');
        fetchAnalytics(true); // Force refresh to bypass cache
      }, 5 * 60 * 1000);

      // Cleanup interval on unmount
      return () => clearInterval(refreshInterval);
    } else {
      console.log('User not eligible for analytics:', {
        hasUser: !!user,
        isSeller: user?.isSeller,
        sellerStatus: user?.sellerStatus
      });
      // Check actual server status
      checkSellerStatus();
    }
  }, [analyticsTimeframe, fetchAnalytics, user, checkSellerStatus]);

  // Note: Mock data generators removed - now using real data from server

  const handleInputChange = useCallback((e) => {
    const { name, value, files } = e.target;
    if (name === 'images') {
      const fileList = Array.from(files);
      setForm(f => ({ ...f, images: fileList }));
      setImagePreviews(fileList.map(file => URL.createObjectURL(file)));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  }, []);

  const handleEditClick = (product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      shippingFee: product.shippingFee || 0,
      quantity: product.quantity,
      category: product.category,
      origin: product.origin || '',
      productionMethod: product.productionMethod || '',
      images: product.images || [],
      editImages: [],
      externalUrls: product.externalUrls || [{ platform: '', url: '' }]
    });
    setImagePreviews([]);
    setShowEditForm(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    const keptImages = editProduct.images || [];
    const newImages = form.editImages || [];
    const totalImages = keptImages.length + newImages.length;
    if (totalImages < 3) {
      toast.error('You must have at least 3 images.');
      return;
    }
    if (totalImages > 10) {
      toast.error('You can have a maximum of 10 images.');
      return;
    }
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('shippingFee', form.shippingFee || 0);
      formData.append('quantity', form.quantity);
      formData.append('category', form.category);
      formData.append('origin', form.origin);
      formData.append('productionMethod', form.productionMethod);
      // Do not submit materialsUsed on edit to keep it immutable after creation
      // Do not update tags via edit modal (field removed)
      // External URLs
      const validUrls = (form.externalUrls || []).filter(u => u.platform?.trim() && u.url?.trim());
      if (validUrls.length > 0) {
        formData.append('externalUrls', JSON.stringify(validUrls));
      }
      keptImages.forEach(url => formData.append('existingImages', url));
      newImages.forEach(img => formData.append('images', img));
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/v1/products/update/${editProduct._id}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Product updated!');
      setShowEditForm(false);
      setEditProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update product.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/products/delete/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Product deleted successfully.');
      console.log('Product deleted, refreshing products and analytics...');
      fetchProducts();
      // Also refresh analytics immediately to ensure sync
      // Add a small delay to ensure database is updated
      setTimeout(() => {
        fetchAnalytics(true);
      }, 500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRestockProduct = (product) => {
    setRestockProduct(product);
    setRestockQuantity('');
    setShowRestockModal(true);
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockQuantity || parseInt(restockQuantity) <= 0) {
      toast.error('Please enter a valid quantity.');
      return;
    }
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/v1/products/update-quantity/${restockProduct._id}`, {
        quantity: parseInt(restockQuantity)
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      toast.success(`Product restocked with ${restockQuantity} units!`);
      setShowRestockModal(false);
      setRestockProduct(null);
      setRestockQuantity('');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to restock product.');
    } finally {
      setProcessing(false);
    }
  };

  const removeImage = (index, isNew = false) => {
    if (isNew) {
      setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
      setImagePreviews(p => p.filter((_, i) => i !== index));
    } else {
      setForm(f => ({ ...f, editImages: f.editImages.filter((_, i) => i !== index) }));
      setImagePreviews(p => p.filter((_, i) => i !== index));
    }
  };

  const clearAllImages = (isNew = false) => {
    if (isNew) {
      setForm(f => ({ ...f, images: [] }));
    } else {
      setForm(f => ({ ...f, editImages: [] }));
    }
    setImagePreviews([]);
  };

  const filteredProducts = (products) => {
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const sortedProducts = (products) => {
    const sorted = [...products];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sorted;
    }
  };

  const ProductCard = ({ product, status }) => {
    const isOutOfStock = product.quantity === 0;
    const isLowStock = product.quantity > 0 && product.quantity <= 10;
    
    return (
      <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-white border-0 shadow-lg ${
        status === 'pending' ? 'ring-2 ring-amber-200' : 
        isOutOfStock ? 'ring-2 ring-red-200' : 'ring-2 ring-emerald-200'
      }`}>
        <div className="absolute top-3 right-3 z-10">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
            status === 'pending' ? 'bg-amber-100/90 text-amber-800 border border-amber-200' : 
            isOutOfStock ? 'bg-red-100/90 text-red-800 border border-red-200' : 'bg-emerald-100/90 text-emerald-800 border border-emerald-200'
          }`}>
            {status === 'pending' ? <FaClock className="mr-1.5 h-3 w-3" /> : 
             isOutOfStock ? <FaTimes className="mr-1.5 h-3 w-3" /> : <FaCheck className="mr-1.5 h-3 w-3" />}
            {status === 'pending' ? 'Pending' : 
             isOutOfStock ? 'Inactive' : 'Active'}
          </span>
        </div>
      
      <CardContent className="p-0">
        {/* Product Images */}
        {product.images && product.images.length > 0 && (
          <div className="relative">
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            {product.images.length > 1 && (
              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                  {product.images.slice(1, 4).map((img, idx) => (
                    <div key={idx} className="flex-shrink-0">
                      <img
                        src={img}
                        alt={`${product.name}-${idx + 1}`}
                        className="w-12 h-12 object-cover rounded-lg border-2 border-white shadow-md opacity-80 hover:opacity-100 transition-opacity"
                      />
                    </div>
                  ))}
                  {product.images.length > 4 && (
                    <div className="flex-shrink-0 w-12 h-12 bg-black/60 rounded-lg border-2 border-white shadow-md flex items-center justify-center">
                      <span className="text-white text-xs font-medium">+{product.images.length - 4}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Product Info */}
        <div className="p-6 space-y-4">
          <div>
            <h3 className="font-bold text-xl mb-2 text-gray-800 line-clamp-1 group-hover:text-emerald-600 transition-colors">
              {product.name}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">{product.description}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-emerald-600">₱{product.price}</span>
              {isOutOfStock ? (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                  Low Stock
                </span>
              ) : null}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Stock</div>
              <div className={`font-semibold ${isOutOfStock ? 'text-red-600' : 'text-gray-800'}`}>
                {product.quantity} units
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Category:</span>
              <span className="font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full text-xs">
                {product.category}
              </span>
            </div>
            <div className="flex items-start justify-between text-sm">
              <span className="text-gray-500">Materials:</span>
              <span className="font-medium text-gray-700 text-xs text-right max-w-[60%]">
                {product.materialsUsed?.slice(0, 2).join(', ')}
                {product.materialsUsed?.length > 2 && '...'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          {status === 'approved' && (
            <div className="flex gap-2 pt-4 border-t border-gray-100">
              <Button
                size="sm"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 hover:shadow-lg"
                onClick={() => handleEditClick(product)}
                disabled={processing}
              >
                <FaEdit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              {isOutOfStock ? (
                <Button
                  size="sm"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:shadow-lg"
                  onClick={() => handleRestockProduct(product)}
                  disabled={processing}
                >
                  <FaPlus className="mr-2 h-4 w-4" />
                  Restock
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                  onClick={() => handleDeleteProduct(product._id)}
                  disabled={processing}
                >
                  <FaTrash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
  };

  const ProductListItem = ({ product, status }) => {
    const isOutOfStock = product.quantity === 0;
    const isLowStock = product.quantity > 0 && product.quantity <= 10;
    
    return (
      <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg bg-white border-0 shadow-sm ${
        status === 'pending' ? 'ring-1 ring-amber-200' : 
        isOutOfStock ? 'ring-1 ring-red-200' : 'ring-1 ring-emerald-200'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            {/* Product Image */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                {product.images && product.images.length > 0 && (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                )}
              </div>
              <div className="absolute -top-2 -right-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                  status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                  isOutOfStock ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {status === 'pending' ? <FaClock className="mr-1 h-3 w-3" /> : 
                   isOutOfStock ? <FaTimes className="mr-1 h-3 w-3" /> : <FaCheck className="mr-1 h-3 w-3" />}
                  {status === 'pending' ? 'Pending' : 
                   isOutOfStock ? 'Inactive' : 'Active'}
                </span>
              </div>
            </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800 truncate group-hover:text-emerald-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">{product.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded-full">{product.category}</span>
                  <span>Stock: {product.quantity}</span>
                  <span>Materials: {product.materialsUsed?.slice(0, 2).join(', ')}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3 ml-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-600">₱{product.price}</div>
                  {isOutOfStock ? (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                      Low Stock
                    </span>
                  ) : null}
                </div>
                {status === 'approved' && (
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4"
                      onClick={() => handleEditClick(product)}
                      disabled={processing}
                    >
                      <FaEdit className="h-4 w-4" />
                    </Button>
                    {isOutOfStock ? (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                        onClick={() => handleRestockProduct(product)}
                        disabled={processing}
                      >
                        <FaPlus className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 px-4"
                        onClick={() => handleDeleteProduct(product._id)}
                        disabled={processing}
                      >
                        <FaTrash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  };

  const ImageUploadSection = ({ images, previews, onImageChange, onRemove, onClearAll, isEdit = false, maxImages = 10 }) => {
    const isRequired = !isEdit && (!images || images.length === 0);
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Product Images {!isEdit && '*'} (min 3, max {maxImages})
          </Label>
          <div className="relative">
            <input
              name={isEdit ? 'editImages' : 'images'}
              type="file"
              accept="image/*"
              multiple
              onChange={onImageChange}
              required={isRequired}
              className="sr-only"
              id={isEdit ? 'editImages' : 'images'}
              tabIndex={isRequired ? 0 : -1}
              aria-required={isRequired}
            />
            <label
              htmlFor={isEdit ? 'editImages' : 'images'}
              className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 hover:from-emerald-50 hover:to-emerald-100 hover:border-emerald-300 transition-all duration-300"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <FaImage className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB each</p>
              </div>
            </label>
          </div>
        </div>
        {previews.length > 0 && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-medium text-gray-700">Preview ({previews.length} image{previews.length > 1 ? 's' : ''})</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClearAll}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <FaTimes className="mr-2 h-3 w-3" />
                Clear All
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {previews.map((src, idx) => (
                <div key={idx} className="relative group">
                  <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 group-hover:shadow-md transition-shadow">
                    <img
                      src={src}
                      alt={`preview-${idx}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                    onClick={() => onRemove(idx)}
                    aria-label="Remove image"
                  >
                    <FaTimes />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Redesigned Modal component
  const Modal = ({ isOpen, onClose, title, children, size = 'default' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
      default: 'max-w-3xl',
      large: 'max-w-5xl',
      small: 'max-w-md',
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className={`w-full ${sizeClasses[size]} bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeInUp`}>
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-8 py-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              {title === 'Create New Product' && <FaPlus className="h-6 w-6" />}
              {title === 'Edit Product' && <FaEdit className="h-6 w-6" />}
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-emerald-200 transition-colors p-2 hover:bg-emerald-700/30 rounded-full"
              disabled={processing}
              aria-label="Close modal"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
          {/* Modal Content */}
          <div className="flex flex-col md:flex-row gap-0 md:gap-8 p-8 bg-gradient-to-br from-gray-50 to-emerald-50 max-h-[80vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    );
  };

  const MemoImageUploadSection = React.memo(ImageUploadSection);

  // Analytics Components
  const AnalyticsOverview = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-8">
      <Card className="glass-card border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600 break-all">₱{analyticsData.overview.totalRevenue.toLocaleString()}</p>
              <div className="flex items-center mt-1 sm:mt-2">
                <FaArrowUp className="text-green-500 mr-1 text-xs sm:text-sm" />
                <span className="text-xs sm:text-sm text-green-600">+{analyticsData.overview.monthlyGrowth}%</span>
              </div>
            </div>
            <div className="bg-emerald-100 p-2 sm:p-3 rounded-full flex-shrink-0">
              <FaDollarSign className="text-emerald-600 text-xl sm:text-2xl" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{analyticsData.overview.totalOrders}</p>
              <div className="flex items-center mt-1 sm:mt-2">
                <FaArrowUp className="text-green-500 mr-1 text-xs sm:text-sm" />
                <span className="text-xs sm:text-sm text-green-600">+8.2%</span>
              </div>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-full flex-shrink-0">
              <FaShoppingBag className="text-blue-600 text-xl sm:text-2xl" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 sm:col-span-2 xl:col-span-1">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Average Rating</p>
              <p className="text-2xl sm:text-3xl font-bold text-amber-600">
                {analyticsData.overview.averageRating > 0 
                  ? analyticsData.overview.averageRating.toFixed(1)
                  : '0.0'
                }
              </p>
              <div className="flex items-center mt-1 sm:mt-2">
                <FaStar className="text-amber-500 mr-1 text-xs sm:text-sm" />
                <span className="text-xs sm:text-sm text-amber-600">
                  {analyticsData.overview.averageRating >= 4.5 ? 'Excellent' :
                   analyticsData.overview.averageRating >= 4.0 ? 'Very Good' :
                   analyticsData.overview.averageRating >= 3.5 ? 'Good' :
                   analyticsData.overview.averageRating >= 3.0 ? 'Fair' :
                   analyticsData.overview.averageRating > 0 ? 'Poor' : 'No Reviews'}
                </span>
              </div>
            </div>
            <div className="bg-amber-100 p-2 sm:p-3 rounded-full flex-shrink-0">
              <FaStar className="text-amber-600 text-xl sm:text-2xl" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Charts helpers
  const SalesLineChart = () => {
    const labels = (analyticsData.salesData?.daily || []).map(d => d.date?.slice(5));
    const revenue = (analyticsData.salesData?.daily || []).map(d => d.revenue || 0);
    const orders = (analyticsData.salesData?.daily || []).map(d => d.orders || 0);
    const data = {
      labels,
      datasets: [
        { label: 'Revenue', data: revenue, borderColor: 'rgba(16, 185, 129, 1)', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.3 },
        { label: 'Orders', data: orders, borderColor: 'rgba(59, 130, 246, 1)', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.3 }
      ]
    };
    const options = { 
      responsive: true, 
      maintainAspectRatio: false,
      plugins: { 
        legend: { 
          position: 'top',
          labels: {
            font: { size: 12 }
          }
        } 
      }, 
      scales: { 
        y: { beginAtZero: true },
        x: {
          ticks: {
            font: { size: 10 }
          }
        }
      } 
    };
    return (
      <Card className="bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base lg:text-lg">Sales Trend (Daily)</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-64 sm:h-80">
            <Line data={data} options={options} />
          </div>
        </CardContent>
      </Card>
    );
  };

  const CategoryBarChart = () => {
    const categories = (analyticsData.categoryPerformance || []).map(c => c.category);
    const products = (analyticsData.categoryPerformance || []).map(c => c.products || 0);
    const data = { labels: categories, datasets: [ { label: 'Products', data: products, backgroundColor: 'rgba(16, 185, 129, 0.6)' } ] };
    const options = { 
      responsive: true, 
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false } 
      }, 
      scales: { 
        y: { beginAtZero: true },
        x: {
          ticks: {
            font: { size: 10 }
          }
        }
      } 
    };
    return (
      <Card className="bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base lg:text-lg">Products by Category</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-64 sm:h-80">
            <Bar data={data} options={options} />
          </div>
        </CardContent>
      </Card>
    );
  };

  const MonthlySalesChart = () => {
    const labels = (analyticsData.salesData?.monthly || []).map((d, i) => `M${i + 1}`);
    const revenue = (analyticsData.salesData?.monthly || []).map(d => d.revenue || 0);
    const orders = (analyticsData.salesData?.monthly || []).map(d => d.orders || 0);
    const data = {
      labels,
      datasets: [
        { label: 'Revenue', data: revenue, backgroundColor: 'rgba(16,185,129,0.6)' },
        { label: 'Orders', data: orders, backgroundColor: 'rgba(59,130,246,0.6)' }
      ]
    };
    const options = { 
      responsive: true, 
      maintainAspectRatio: false,
      plugins: { 
        legend: { 
          position: 'top',
          labels: {
            font: { size: 12 }
          }
        } 
      }, 
      scales: { 
        y: { beginAtZero: true },
        x: {
          ticks: {
            font: { size: 10 }
          }
        }
      } 
    };
    return (
      <Card className="bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base lg:text-lg">Monthly Sales</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-64 sm:h-80">
            <Bar data={data} options={options} />
          </div>
        </CardContent>
      </Card>
    );
  };

  const YearlySalesChart = () => {
    const labels = (analyticsData.salesData?.yearly || []).map(d => d.date);
    const revenue = (analyticsData.salesData?.yearly || []).map(d => d.revenue || 0);
    const orders = (analyticsData.salesData?.yearly || []).map(d => d.orders || 0);
    
    const data = {
      labels,
      datasets: [
        {
          label: 'Revenue (₱)',
          data: revenue,
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          yAxisID: 'y'
        },
        {
          label: 'Orders',
          data: orders,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          tension: 0.3,
          fill: false,
          yAxisID: 'y1'
        }
      ]
    };
    
    const options = {
      responsive: true,
      plugins: {
        legend: { 
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              if (context.datasetIndex === 0) {
                return `Revenue: ₱${context.parsed.y.toLocaleString()}`;
              } else {
                return `Orders: ${context.parsed.y}`;
              }
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Month'
          },
          grid: {
            display: false
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Revenue (₱)'
          },
          ticks: {
            callback: function(value) {
              return '₱' + value.toLocaleString();
            }
          },
          grid: {
            color: 'rgba(16, 185, 129, 0.1)'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Orders'
          },
          grid: {
            drawOnChartArea: false,
            color: 'rgba(59, 130, 246, 0.1)'
          }
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      }
    };
    
    return (
      <Card className="bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center gap-2">
            <FaCalendarAlt className="text-emerald-600" />
            Yearly Sales Trend (Last 12 Months)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-64 sm:h-80 lg:h-96">
            <Line data={data} options={options} />
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="bg-emerald-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="font-medium text-emerald-700">Total Revenue</span>
              </div>
              <div className="text-emerald-900 font-bold text-sm sm:text-base lg:text-lg">
                ₱{revenue.reduce((sum, val) => sum + val, 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-blue-700">Total Orders</span>
              </div>
              <div className="text-blue-900 font-bold text-sm sm:text-base lg:text-lg">
                {orders.reduce((sum, val) => sum + val, 0)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const TopProductsChart = () => {
    const top = (analyticsData.topProducts || []).slice(0, 5);
    if (top.length === 0) return null;
    const labels = top.map(p => p.name);
    const orders = top.map(p => Number(p.orders || 0));
    const data = { labels, datasets: [ { label: 'Orders', data: orders, backgroundColor: 'rgba(99,102,241,0.7)' } ] };
    const options = { 
      indexAxis: 'y', 
      responsive: true, 
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false } 
      }, 
      scales: { 
        x: { beginAtZero: true },
        y: {
          ticks: {
            font: { size: 10 }
          }
        }
      } 
    };
    return (
      <Card className="bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base lg:text-lg">Top Products (by orders)</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-64 sm:h-80">
            <Bar data={data} options={options} />
          </div>
        </CardContent>
      </Card>
    );
  };


  const TopProductsSection = () => (
    <Card className="glass-card border-0 shadow-xl mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
          <FaChartBar className="text-emerald-600" />
          Top Performing Products
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {analyticsData.topProducts.map((product, index) => (
            <div key={product.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-3 sm:gap-0">
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-sm sm:text-base flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{product.name}</h4>
                  <p className="text-xs sm:text-sm text-gray-500">{product.orders} orders</p>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto">
                <p className="font-bold text-emerald-600 text-sm sm:text-base">₱{product.revenue.toLocaleString()}</p>
                <div className="flex items-center gap-1">
                  <FaStar className="text-amber-500 text-xs sm:text-sm" />
                  <span className="text-xs sm:text-sm text-gray-600">{product.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const CategoryPerformanceSection = () => (
    <Card className="glass-card border-0 shadow-xl mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
          <FaTag className="text-emerald-600" />
          Category Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {analyticsData.categoryPerformance?.map((category, index) => (
            <div key={category.category} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-3 sm:gap-0">
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{category.category}</h4>
                  <p className="text-xs sm:text-sm text-gray-500">{category.products} products</p>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto">
                <p className="font-bold text-emerald-600 text-sm sm:text-base">₱{category.revenue.toLocaleString()}</p>
                <div className="flex items-center gap-1">
                  {parseFloat(category.growth) > 0 ? (
                    <FaArrowUp className="text-green-500 text-xs sm:text-sm" />
                  ) : (
                    <FaArrowDown className="text-red-500 text-xs sm:text-sm" />
                  )}
                  <span className={`text-xs sm:text-sm ${parseFloat(category.growth) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {category.growth}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const CustomerInsightsSection = () => (
    <Card className="glass-card border-0 shadow-xl mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
          <FaUsers className="text-emerald-600" />
          Customer Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{analyticsData.customerInsights.totalCustomers}</p>
              </div>
              <FaUsers className="text-blue-500 text-xl sm:text-2xl flex-shrink-0" />
            </div>
            <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Repeat Customers</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{analyticsData.customerInsights.repeatCustomers}</p>
              </div>
              <FaHeart className="text-green-500 text-xl sm:text-2xl flex-shrink-0" />
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-amber-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-600">₱{analyticsData.customerInsights.averageOrderValue}</p>
              </div>
              <FaShoppingCart className="text-amber-500 text-xl sm:text-2xl flex-shrink-0" />
            </div>
            <div className="flex items-center justify-between p-3 sm:p-4 bg-purple-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Satisfaction</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">{analyticsData.customerInsights.customerSatisfaction}/5</p>
              </div>
              <FaStar className="text-purple-500 text-xl sm:text-2xl flex-shrink-0" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const MostFrequentBuyerSection = () => {
    const topFrequentBuyers = analyticsData.customerInsights?.topFrequentBuyers || [];
    
    if (topFrequentBuyers.length === 0) {
      return (
        <Card className="glass-card border-0 shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaUsers className="text-emerald-600" />
              Top Frequent Buyers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUsers className="text-gray-400 text-2xl" />
              </div>
              <p className="text-gray-500 text-lg">No customers yet</p>
              <p className="text-gray-400 text-sm">Start selling to see your most frequent buyers</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="glass-card border-0 shadow-xl mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
            <FaUsers className="text-emerald-600" />
            Top Frequent Buyers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {topFrequentBuyers.map((buyer, index) => (
              <div key={buyer.customer._id} className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  {/* Rank Badge */}
                  <div className="flex-shrink-0">
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-500' : 'bg-emerald-500'
                    }`}>
                      {index + 1}
                    </div>
                  </div>

                  {/* Customer Avatar */}
                  <div className="relative">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                      {buyer.customer.avatar ? (
                        <img
                          src={buyer.customer.avatar}
                          alt={`${buyer.customer.firstName} ${buyer.customer.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                          <span className="text-emerald-600 font-bold text-xs sm:text-sm">
                            {buyer.customer.firstName?.charAt(0)}{buyer.customer.lastName?.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Crown icon for #1 buyer */}
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                        <FaStar className="text-yellow-600 text-xs" />
                      </div>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-800 truncate">
                      {buyer.customer.firstName} {buyer.customer.lastName}
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm truncate">{buyer.customer.email}</p>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-2">
                      <div className="text-center">
                        <div className="text-sm sm:text-base lg:text-lg font-bold text-emerald-600">{buyer.orderCount}</div>
                        <div className="text-xs text-gray-500">Orders</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm sm:text-base lg:text-lg font-bold text-blue-600">{buyer.totalQuantities}</div>
                        <div className="text-xs text-gray-500">Items</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm sm:text-base lg:text-lg font-bold text-purple-600">₱{buyer.totalSpent.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Spent</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 w-full sm:w-auto"
                      onClick={() => navigate(`/profile/${buyer.customer._id}`)}
                    >
                      <FaEye className="mr-1 h-3 w-3" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const InventoryMetricsSection = () => (
    <Card className="glass-card border-0 shadow-xl mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
          <FaBoxOpen className="text-emerald-600" />
          Inventory Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-red-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">{analyticsData.inventoryMetrics.lowStockItems}</p>
              </div>
              <FaClock className="text-red-500 text-xl sm:text-2xl flex-shrink-0" />
            </div>
            <div className="flex items-center justify-between p-3 sm:p-4 bg-orange-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">{analyticsData.inventoryMetrics.outOfStockItems}</p>
              </div>
              <FaTimes className="text-orange-500 text-xl sm:text-2xl flex-shrink-0" />
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-emerald-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Inventory Value</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-600">₱{analyticsData.inventoryMetrics.totalInventoryValue.toLocaleString()}</p>
              </div>
              <FaDollarSign className="text-emerald-500 text-xl sm:text-2xl flex-shrink-0" />
            </div>
            <div className="flex items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Turnover Rate</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{analyticsData.inventoryMetrics.inventoryTurnover}x</p>
              </div>
              <FaChartLine className="text-blue-500 text-xl sm:text-2xl flex-shrink-0" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-50 py-6 sm:py-8 px-3 sm:px-4 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Header */}
          <div className="relative mb-8 sm:mb-10 rounded-3xl overflow-hidden shadow-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-600">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-20" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-6 sm:p-10 gap-6 sm:gap-8">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/30 border-4 border-emerald-200 flex items-center justify-center shadow-lg overflow-hidden">
                  {/* User avatar or fallback icon */}
                  {user?.avatar ? (
                    <img src={user.avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <FaUserTie className="text-emerald-700 text-5xl" />
                  )}
                </div>
                <div>
                  <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-1 sm:mb-2 drop-shadow-lg">Welcome, {user?.firstName}!</h1>
                  <p className="text-emerald-100 text-base sm:text-lg font-medium drop-shadow">Manage your products and grow your business</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3 sm:gap-4">
                <div className="text-right text-emerald-100">
                  <div className="text-sm">Total Products</div>
                  <div className="text-2xl sm:text-3xl font-bold">{approvedProducts.length + pendingProducts.length}</div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => navigate('/seller/orders')}
                    className="bg-white/90 text-emerald-700 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all duration-200 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-base sm:text-lg"
                    size="lg"
                  >
                    <FaShoppingBag className="mr-2 h-5 w-5" />
                    Orders
                  </Button>
                <Button
                  onClick={() => navigate('/seller/create-product')}
                  className="bg-white/90 text-emerald-700 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all duration-200 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-base sm:text-lg"
                  size="lg"
                >
                  <FaPlus className="mr-2 h-5 w-5" />
                  New Product
                </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-12 justify-center">
            <Card className="glass-card border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="bg-emerald-100 rounded-full p-4 mb-4 shadow">
                  <FaCheck className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="text-emerald-700 text-lg font-semibold">Approved Products</p>
                <p className="text-4xl font-extrabold text-emerald-900">{approvedProducts.length}</p>
                <p className="text-emerald-500 font-bold text-xs mt-2">Products that are live and available in the marketplace.</p>
              </CardContent>
            </Card>
            <Card className="glass-card border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="bg-amber-100 rounded-full p-4 mb-4 shadow">
                  <FaClock className="h-8 w-8 text-amber-600" />
                </div>
                <p className="text-amber-700 text-lg font-semibold">Pending Products</p>
                <p className="text-4xl font-extrabold text-amber-900">{pendingProducts.length}</p>
                <p className="text-amber-600 font-bold text-xs mt-2">Products awaiting approval from the admin.</p>
              </CardContent>
            </Card>
           
            <Card className="glass-card border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="bg-indigo-100 rounded-full p-4 mb-4 shadow">
                  <FaShoppingCart className="h-8 w-8 text-indigo-600" />
                </div>
                <p className="text-indigo-700 text-lg font-semibold">Total Sales</p>
                <p className="text-4xl font-extrabold text-indigo-900">₱0</p>
                <p className="text-indigo-400 font-bold text-xs mt-2">Total revenue generated from sold products.</p>
              </CardContent>
            </Card>
          </div>

          {/* GCash Information */}
          <Card className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <img 
                      src="https://assets-global.website-files.com/60f008ba9757da0940af288e/6374c97f7f9ca43ebec47c7e_gcash.png" 
                      alt="GCash Logo" 
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">GCash Payment Details</h3>
                    <p className="text-sm text-gray-600">Your customers can pay using these details</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                  onClick={openGcashModal}
                >
                  Update GCash Details
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-gray-700">GCash Number</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => {
                        if (gcashDetails?.number) {
                          navigator.clipboard.writeText(gcashDetails.number);
                          toast.success('GCash number copied to clipboard!');
                        }
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{gcashDetails?.number || 'Not set'}</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">GCash QR Code</Label>
                  {gcashDetails?.qrCode ? (
                    <div className="relative aspect-square w-full max-w-[200px] mx-auto">
                      <img
                        src={gcashDetails.qrCode}
                        alt="GCash QR Code"
                        className="w-full h-full object-contain border border-gray-200 rounded-lg"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                        onClick={() => window.open(gcashDetails.qrCode, '_blank')}
                      >
                        View
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No QR code uploaded
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          {/* GCash Update Modal */}
          <Modal isOpen={showGcashModal} onClose={() => setShowGcashModal(false)} title="Update GCash Details" size="small">
            <form onSubmit={handleUpdateGcash} className="w-full space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-2 w-full">
                <Label htmlFor="gcashNumberInput">GCash Number</Label>
                <Input id="gcashNumberInput" value={gcashNumberInput} onChange={(e) => setGcashNumberInput(formatGcash(e.target.value))} placeholder="+639XXXXXXXXX" inputMode="tel" />
                <p className="text-xs text-gray-500">Format: +639XXXXXXXXX (e.g., +639123456789)</p>
              </div>
              <div className="space-y-2 w-full">
                <Label htmlFor="gcashQRFile">GCash QR Code</Label>
                <Input id="gcashQRFile" type="file" accept="image/*" onChange={(e) => setGcashQRFile(e.target.files?.[0] || null)} />
                <p className="text-xs text-gray-500">Upload to replace your existing QR (optional)</p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowGcashModal(false)} disabled={processing} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={processing}>{processing ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </form>
          </Modal>

          {/* Quick Navigation */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-2xl font-bold text-emerald-800">Your Products</h2>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setActiveTab('analytics')}
                variant="outline"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200"
              >
                <FaChartBar className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
              <div className="flex items-center gap-2">
                <FaFilter className="text-emerald-400" />
                <span className="text-sm text-emerald-500">Filter, sort, and manage your listings</span>
              </div>
            </div>
          </div>

          {/* Products Section, Tabs, Product List, etc. */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6 sm:mb-8">
            <TabsList className="grid w-full grid-cols-3 bg-emerald-100 rounded-xl mb-3 sm:mb-4">
              <TabsTrigger value="approved" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-xl text-sm sm:text-lg font-semibold">
                Approved
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-xl text-sm sm:text-lg font-semibold">
                Pending
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-xl text-sm sm:text-lg font-semibold">
                Analytics
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="approved">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <div className="flex-1">
                  <Label htmlFor="search" className="text-sm font-medium text-gray-700">
                    Search Products
                  </Label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="search"
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="sort" className="text-sm font-medium text-gray-700">
                    Sort By:
                  </Label>
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="p-2 border border-gray-300 rounded-xl text-xs sm:text-sm"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredProducts(sortedProducts(activeTab === 'approved' ? approvedProducts : pendingProducts)).map(product => (
                  <ProductCard key={product._id} product={product} status={product.status} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="pending">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <div className="flex-1">
                  <Label htmlFor="search" className="text-sm font-medium text-gray-700">
                    Search Products
                  </Label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="search"
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="sort" className="text-sm font-medium text-gray-700">
                    Sort By:
                  </Label>
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="p-2 border border-gray-300 rounded-xl text-sm"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredProducts(sortedProducts(activeTab === 'approved' ? approvedProducts : pendingProducts)).map(product => (
                  <ProductCard key={product._id} product={product} status={product.status} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              {analyticsLoading ? (
                <div className="flex justify-center items-center py-24">
                  <div className="text-center">
                    <FaSpinner className="animate-spin h-12 w-12 text-emerald-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading analytics...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Analytics Header */}
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Business Analytics</h3>
                        <p className="text-sm text-gray-600">Track your performance and growth metrics</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Label htmlFor="timeframe" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                          Timeframe:
                        </Label>
                        <select
                          id="timeframe"
                          value={analyticsTimeframe}
                          onChange={(e) => setAnalyticsTimeframe(e.target.value)}
                          className="p-2 border-2 border-gray-300 rounded-lg text-sm w-full sm:w-auto min-w-[140px] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                        >
                          <option value="7d">Last 7 days</option>
                          <option value="30d">Last 30 days</option>
                          <option value="90d">Last 90 days</option>
                          <option value="1y">Last year</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Analytics Overview */}
                  <AnalyticsOverview />

                  {/* Charts */}
                  <div className="space-y-6 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                      <SalesLineChart />
                      <CategoryBarChart />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                      <MonthlySalesChart />
                      <TopProductsChart />
                    </div>

                    {/* Yearly Sales Chart - Full Width */}
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      <YearlySalesChart />
                    </div>
                  </div>

                  {/* Top Products */}
                  <TopProductsSection />

                  {/* Category Performance */}
                  <CategoryPerformanceSection />

                  {/* Customer Insights */}
                  <CustomerInsightsSection />

                  {/* Most Frequent Buyer */}
                  <MostFrequentBuyerSection />

                  {/* Inventory Metrics */}
                  <InventoryMetricsSection />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* Edit Product Modal */}
      {showEditForm && (
        <div 
          className="fixed inset-0 bg-gradient-to-br from-emerald-50/80 via-emerald-100/80 to-teal-50/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditForm(false)}
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
                  onClick={() => setShowEditForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Price (₱)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      value={form.quantity}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="shippingFee">Shipping Fee (₱)</Label>
                    <Input
                      id="shippingFee"
                      name="shippingFee"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.shippingFee}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">Shipping fee charged to buyers. Leave empty for free shipping.</p>
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      name="category"
                      value={form.category}
                      onChange={handleInputChange}
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
                      name="origin"
                      value={form.origin}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="productionMethod">Production Method</Label>
                    <Input
                      id="productionMethod"
                      name="productionMethod"
                      value={form.productionMethod}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    rows={4}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>


                

                {/* External URLs Section */}
                <div className="space-y-3">
                  <Label>External Product URLs</Label>
                  {form.externalUrls.map((url, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          placeholder="Platform (e.g., Shopee, Lazada)"
                          value={url.platform}
                          onChange={(e) => {
                            const newUrls = [...form.externalUrls];
                            newUrls[index].platform = e.target.value;
                            setForm(f => ({ ...f, externalUrls: newUrls }));
                          }}
                        />
                      </div>
                      <div className="flex-[2]">
                        <Input
                          placeholder="Product URL"
                          value={url.url}
                          onChange={(e) => {
                            const newUrls = [...form.externalUrls];
                            newUrls[index].url = e.target.value;
                            setForm(f => ({ ...f, externalUrls: newUrls }));
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
                            setForm(f => ({
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
                      setForm(f => ({
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
                        onClick={() => clearAllImages()}
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
                    onChange={handleInputChange}
                    className="hidden"
                  />
                  
                  <div className="text-sm text-gray-600">
                    {form.images.length} of 10 images • Minimum 3 required
                  </div>

                  {/* Existing Images */}
                  {form.images.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Product Images</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {form.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Product ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
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
                  {form.images.length === 0 && (
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
                    onClick={() => setShowEditForm(false)}
                    className="flex-1"
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    disabled={processing}
                  >
                    {processing ? (
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

      {/* Restock Modal */}
      {showRestockModal && (
        <div 
          className="fixed inset-0 bg-gradient-to-br from-emerald-50/80 via-emerald-100/80 to-teal-50/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowRestockModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Restock Product</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRestockModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes className="h-5 w-5" />
                </Button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  {restockProduct?.images && restockProduct.images.length > 0 && (
                    <img
                      src={restockProduct.images[0]}
                      alt={restockProduct.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{restockProduct?.name}</h3>
                    <p className="text-sm text-gray-600">Current stock: {restockProduct?.quantity} units</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleRestockSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="restockQuantity">New Quantity</Label>
                  <Input
                    id="restockQuantity"
                    type="number"
                    min="1"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(e.target.value)}
                    placeholder="Enter new quantity"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will replace the current quantity and make the product available again.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRestockModal(false)}
                    className="flex-1"
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                        Restocking...
                      </>
                    ) : (
                      'Restock Product'
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

export default SellerDashboard;