import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'react-toastify';
import { FaSpinner, FaPlus, FaEdit, FaTrash, FaImage, FaTimes, FaStore, FaBoxOpen, FaClock, FaCheck, FaEye, FaChartLine, FaUsers, FaShoppingCart, FaHeart, FaStar, FaFilter, FaSearch, FaList, FaDownload, FaUserTie } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const SellerDashboard = () => {
  const [user, setUser] = useState(null);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [approvedProducts, setApprovedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('approved');
  const [showEditForm, setShowEditForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
    origin: '',
    productionMethod: '',
    materialsUsed: '',
    tags: '',
    images: []
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [processing, setProcessing] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (!storedUser || !storedUser.isSeller || storedUser.sellerStatus !== 'verified') {
      toast.error('You must be a verified seller to access this page.');
      navigate('/seller/application');
      return;
    }
    setUser(storedUser);
    fetchProducts();
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/products/my-products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const all = response.data.products || [];
      setPendingProducts(all.filter(p => p.status === 'pending'));
      setApprovedProducts(all.filter(p => p.status === 'approved'));
    } catch (error) {
      toast.error('Failed to fetch your products.');
    } finally {
      setLoading(false);
    }
  }, []);

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
      quantity: product.quantity,
      category: product.category,
      origin: product.origin || '',
      productionMethod: product.productionMethod || '',
      materialsUsed: product.materialsUsed.join(', '),
      tags: product.tags ? product.tags.join(', ') : '',
      images: product.images || [],
      editImages: []
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
      formData.append('quantity', form.quantity);
      formData.append('category', form.category);
      formData.append('origin', form.origin);
      formData.append('productionMethod', form.productionMethod);
      form.materialsUsed.split(',').map(s => s.trim()).filter(Boolean).forEach(val => formData.append('materialsUsed', val));
      form.tags.split(',').map(s => s.trim()).filter(Boolean).forEach(val => formData.append('tags', val));
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
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product.');
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

  const ProductCard = ({ product, status }) => (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-white border-0 shadow-lg ${
      status === 'pending' ? 'ring-2 ring-amber-200' : 'ring-2 ring-emerald-200'
    }`}>
      <div className="absolute top-3 right-3 z-10">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
          status === 'pending' ? 'bg-amber-100/90 text-amber-800 border border-amber-200' : 'bg-emerald-100/90 text-emerald-800 border border-emerald-200'
        }`}>
          {status === 'pending' ? <FaClock className="mr-1.5 h-3 w-3" /> : <FaCheck className="mr-1.5 h-3 w-3" />}
          {status.charAt(0).toUpperCase() + status.slice(1)}
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
              {product.quantity < 10 && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                  Low Stock
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Stock</div>
              <div className="font-semibold text-gray-800">{product.quantity} units</div>
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const ProductListItem = ({ product, status }) => (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg bg-white border-0 shadow-sm ${
      status === 'pending' ? 'ring-1 ring-amber-200' : 'ring-1 ring-emerald-200'
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
                status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {status === 'pending' ? <FaClock className="mr-1 h-3 w-3" /> : <FaCheck className="mr-1 h-3 w-3" />}
                {status.charAt(0).toUpperCase() + status.slice(1)}
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
                  {product.quantity < 10 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                      Low Stock
                    </span>
                  )}
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 px-4"
                      onClick={() => handleDeleteProduct(product._id)}
                      disabled={processing}
                    >
                      <FaTrash className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-50 py-8 px-4 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Header */}
          <div className="relative mb-10 rounded-3xl overflow-hidden shadow-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-600">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-20" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-10 gap-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-white/30 border-4 border-emerald-200 flex items-center justify-center shadow-lg overflow-hidden">
                  {/* User avatar or fallback icon */}
                  {user?.avatar ? (
                    <img src={user.avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <FaUserTie className="text-emerald-700 text-5xl" />
                  )}
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-lg">Welcome, {user?.firstName}!</h1>
                  <p className="text-emerald-100 text-lg font-medium drop-shadow">Manage your products and grow your business</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-4">
                <div className="text-right text-emerald-100">
                  <div className="text-sm">Total Products</div>
                  <div className="text-3xl font-bold">{approvedProducts.length + pendingProducts.length}</div>
                </div>
                <Button
                  onClick={() => navigate('/seller/create-product')}
                  className="bg-white/90 text-emerald-700 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 rounded-xl font-semibold text-lg"
                  size="lg"
                >
                  <FaPlus className="mr-2 h-5 w-5" />
                  New Product
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 justify-center">
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

          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-emerald-800">Your Products</h2>
            <div className="flex items-center gap-2">
              <FaFilter className="text-emerald-400" />
              <span className="text-sm text-emerald-500">Filter, sort, and manage your listings</span>
            </div>
          </div>

          {/* Products Section, Tabs, Product List, etc. */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-2 bg-emerald-100 rounded-xl mb-4">
              <TabsTrigger value="approved" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-xl text-lg font-semibold">
                Approved
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-xl text-lg font-semibold">
                Pending
              </TabsTrigger>
            </TabsList>
            <TabsContent value="approved">
              <div className="flex justify-between items-center mb-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts(sortedProducts(activeTab === 'approved' ? approvedProducts : pendingProducts)).map(product => (
                  <ProductCard key={product._id} product={product} status={product.status} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="pending">
              <div className="flex justify-between items-center mb-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts(sortedProducts(activeTab === 'approved' ? approvedProducts : pendingProducts)).map(product => (
                  <ProductCard key={product._id} product={product} status={product.status} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* Modals and overlays here */}
      <Modal
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        title="Edit Product"
        size="default"
      >
        <div className="flex flex-col md:flex-row gap-8 w-full">
          {/* Left: Image Upload */}
          <div className="md:w-1/2 w-full">
            <MemoImageUploadSection
              images={form.images}
              previews={imagePreviews}
              onImageChange={handleInputChange}
              onRemove={removeImage}
              onClearAll={() => clearAllImages()}
              isEdit={true}
              maxImages={10}
            />
          </div>
          {/* Right: Product Details */}
          <form onSubmit={handleUpdateProduct} className="md:w-1/2 w-full space-y-6">
            <h3 className="text-lg font-semibold text-emerald-700 mb-2">Product Details</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  required
                  className="w-full border rounded p-2"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="price" className="text-sm font-medium text-gray-700">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={form.quantity}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category</Label>
                <Input
                  id="category"
                  name="category"
                  type="text"
                  value={form.category}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="origin" className="text-sm font-medium text-gray-700">Origin</Label>
                <Input
                  id="origin"
                  name="origin"
                  type="text"
                  value={form.origin}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="productionMethod" className="text-sm font-medium text-gray-700">Production Method</Label>
                <Input
                  id="productionMethod"
                  name="productionMethod"
                  type="text"
                  value={form.productionMethod}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="materialsUsed" className="text-sm font-medium text-gray-700">Materials Used</Label>
                <Input
                  id="materialsUsed"
                  name="materialsUsed"
                  type="text"
                  value={form.materialsUsed}
                  onChange={handleInputChange}
                  placeholder="e.g., Wood, Metal, Clay"
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="tags" className="text-sm font-medium text-gray-700">Tags</Label>
                <Input
                  id="tags"
                  name="tags"
                  type="text"
                  value={form.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., Handmade, Unique, Eco-Friendly"
                  className="w-full"
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 hover:shadow-lg" disabled={processing}>
              {processing ? <FaSpinner className="mr-2 h-4 w-4 animate-spin" /> : <FaEdit className="mr-2 h-4 w-4" />}
              Update Product
            </Button>
          </form>
        </div>
      </Modal>
      <Footer />
    </>
  );
};

export default SellerDashboard;