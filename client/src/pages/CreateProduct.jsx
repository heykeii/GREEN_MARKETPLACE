import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/utils/toast';
import { FaSpinner, FaPlus, FaImage, FaTimes, FaArrowLeft } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CATEGORY_OPTIONS } from '@/constants/categories';

const CreateProduct = () => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
    origin: '',
    productionMethod: '',
    materialsUsed: '',
    images: [],
    externalUrls: [{ platform: '', url: '' }],
    variants: []
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

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

  

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.price || !form.quantity || !form.category || !form.materialsUsed) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (!form.images || form.images.length < 3) {
      toast.error('Please upload at least 3 product images.');
      return;
    }
    if (form.images.length > 10) {
      toast.error('You can upload a maximum of 10 images.');
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
      form.images.forEach(img => formData.append('images', img));
      // Add external URLs
      const validUrls = form.externalUrls.filter(url => url.platform.trim() && url.url.trim());
      if (validUrls.length > 0) {
        formData.append('externalUrls', JSON.stringify(validUrls));
      }
      
      // Add variants
      const validVariants = form.variants.filter(variant => 
        variant.name.trim() && 
        variant.price
      );
      if (validVariants.length > 0) {
        formData.append('variants', JSON.stringify(validVariants));
      }
      await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/products/create/product`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Product submitted for review!');
      navigate('/seller/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create product.');
    } finally {
      setProcessing(false);
    }
  };

  const removeImage = (index) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
    setImagePreviews(p => p.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setForm(f => ({ ...f, images: [] }));
    setImagePreviews([]);
  };

  // Variant management functions
  const addVariant = () => {
    setForm(f => ({
      ...f,
      variants: [...f.variants, {
        name: '',
        price: '',
        sku: '',
        attributes: {},
        images: [],
        isActive: true
      }]
    }));
  };

  const removeVariant = (index) => {
    setForm(f => ({
      ...f,
      variants: f.variants.filter((_, i) => i !== index)
    }));
  };

  const updateVariant = (index, field, value) => {
    setForm(f => ({
      ...f,
      variants: f.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  const updateVariantAttribute = (variantIndex, attributeKey, attributeValue) => {
    setForm(f => ({
      ...f,
      variants: f.variants.map((variant, i) => 
        i === variantIndex 
          ? { 
              ...variant, 
              attributes: { 
                ...variant.attributes, 
                [attributeKey]: attributeValue 
              } 
            } 
          : variant
      )
    }));
  };

  const removeVariantAttribute = (variantIndex, attributeKey) => {
    setForm(f => ({
      ...f,
      variants: f.variants.map((variant, i) => 
        i === variantIndex 
          ? { 
              ...variant, 
              attributes: Object.fromEntries(
                Object.entries(variant.attributes).filter(([key]) => key !== attributeKey)
              )
            } 
          : variant
      )
    }));
  };

  const ImageUploadSection = () => {
    const isRequired = !form.images || form.images.length === 0;
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Product Images * (min 3, max 10)
          </Label>
          <div className="relative">
            <input
              name="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleInputChange}
              required={isRequired}
              className="sr-only"
              id="images"
              tabIndex={isRequired ? 0 : -1}
              aria-required={isRequired}
            />
            <label
              htmlFor="images"
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
        {imagePreviews.length > 0 && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-medium text-gray-700">Preview ({imagePreviews.length} image{imagePreviews.length > 1 ? 's' : ''})</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAllImages}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <FaTimes className="mr-2 h-3 w-3" />
                Clear All
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {imagePreviews.map((src, idx) => (
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
                    onClick={() => removeImage(idx)}
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

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-50 py-8 px-4 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              onClick={() => navigate('/seller/dashboard')}
              variant="outline"
              className="mb-4 bg-white/80 hover:bg-white border-emerald-200 text-emerald-700 hover:text-emerald-800"
            >
              <FaArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-emerald-800 mb-2">Create New Product</h1>
              <p className="text-emerald-600 text-lg">Add your sustainable product to the marketplace</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Image Upload */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-emerald-700 flex items-center gap-2">
                  <FaImage className="h-5 w-5" />
                  Product Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUploadSection />
              </CardContent>
            </Card>

            {/* Right: Product Details Form */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-emerald-700 flex items-center gap-2">
                  <FaPlus className="h-5 w-5" />
                  Product Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateProduct} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">Product Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description *</Label>
                      <textarea
                        id="description"
                        name="description"
                        value={form.description}
                        onChange={handleInputChange}
                        required
                        className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        rows={4}
                        placeholder="Describe your product..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price" className="text-sm font-medium text-gray-700">Price (₱) *</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          value={form.price}
                          onChange={handleInputChange}
                          required
                          className="w-full"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">Quantity *</Label>
                        <Input
                          id="quantity"
                          name="quantity"
                          type="number"
                          value={form.quantity}
                          onChange={handleInputChange}
                          required
                          className="w-full"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category *</Label>
                      <select
                        id="category"
                        name="category"
                        value={form.category}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Select a category</option>
                        {CATEGORY_OPTIONS.map((option, index) => (
                          <option key={index} value={option.name}>
                            {option.name}
                          </option>
                        ))}
                      </select>
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
                        placeholder="e.g., Batangas, PH"
                      />
                    </div>
                    <div>
                      <Label htmlFor="productionMethod" className="text-sm font-medium text-gray-700">Production Method</Label>
                      <select
                        id="productionMethod"
                        name="productionMethod"
                        value={form.productionMethod}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">How was your product made? (e.g., handmade, upcycled, machine-made)</option>
                        <option value="handmade">Handmade - Crafted by hand, lower energy use</option>
                        <option value="machine-made">Machine-made - Manufactured using machines</option>
                        <option value="upcycled">Upcycled - Repurposed from existing materials</option>
                        <option value="recycled">Recycled - Made from recycled materials</option>
                        <option value="organic">Organic - Produced using organic methods</option>
                        <option value="conventional">Conventional - Standard production methods</option>
                        <option value="artisan">Artisan - Handcrafted by skilled artisans</option>
                        <option value="industrial">Industrial - Large-scale industrial production</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="materialsUsed" className="text-sm font-medium text-gray-700">
                        Materials Used *
                        <span className="ml-2 text-xs text-gray-500">(optional: include weight per material, e.g., "4kg cotton")</span>
                      </Label>
                      <Input
                        id="materialsUsed"
                        name="materialsUsed"
                        type="text"
                        value={form.materialsUsed}
                        onChange={handleInputChange}
                        placeholder="e.g., 4kg cotton, 2kg recycled plastic, Bamboo"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">Adding weights improves sustainability scoring and eco assessment accuracy.</p>
                    </div>

                    {/* External URLs Section */}
                    <div className="col-span-full">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">External Product URLs</Label>
                      <div className="space-y-3">
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
                          className="mt-2"
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
                    </div>

                    {/* Product Variants Section */}
                    <div className="col-span-full">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-sm font-medium text-gray-700">Product Variants</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addVariant}
                          className="text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:border-emerald-300"
                        >
                          <FaPlus className="mr-2 h-4 w-4" />
                          Add Variant
                        </Button>
                      </div>
                      
                      {form.variants.length > 0 && (
                        <div className="space-y-4">
                          {form.variants.map((variant, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-medium text-gray-700">Variant {index + 1}</h4>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeVariant(index)}
                                  className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                >
                                  <FaTimes className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-xs font-medium text-gray-600">Variant Name *</Label>
                                  <Input
                                    placeholder="e.g., Small, Red, Cotton"
                                    value={variant.name}
                                    onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                                
                                <div>
                                  <Label className="text-xs font-medium text-gray-600">SKU</Label>
                                  <Input
                                    placeholder="e.g., PROD-SM-RED-001"
                                    value={variant.sku}
                                    onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                                
                                <div>
                                  <Label className="text-xs font-medium text-gray-600">Price (₱) *</Label>
                                  <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={variant.price}
                                    onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                    min="0"
                                    step="0.01"
                                    className="w-full"
                                  />
                                </div>
                                
                                
                              </div>
                              
                              {/* Variant Attributes */}
                              <div className="mt-4">
                                <Label className="text-xs font-medium text-gray-600 mb-2 block">Attributes (e.g., Color, Size, Material)</Label>
                                <div className="space-y-2">
                                  {Object.entries(variant.attributes).map(([key, value]) => (
                                    <div key={key} className="flex gap-2">
                                      <Input
                                        placeholder="Attribute (e.g., Color)"
                                        value={key}
                                        onChange={(e) => {
                                          const newKey = e.target.value;
                                          const newAttributes = { ...variant.attributes };
                                          delete newAttributes[key];
                                          newAttributes[newKey] = value;
                                          updateVariant(index, 'attributes', newAttributes);
                                        }}
                                        className="flex-1"
                                      />
                                      <Input
                                        placeholder="Value (e.g., Red)"
                                        value={value}
                                        onChange={(e) => updateVariantAttribute(index, key, e.target.value)}
                                        className="flex-1"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeVariantAttribute(index, key)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <FaTimes className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newKey = `attribute_${Date.now()}`;
                                      updateVariantAttribute(index, newKey, '');
                                    }}
                                    className="text-emerald-600 hover:text-emerald-700 border-emerald-200"
                                  >
                                    <FaPlus className="mr-1 h-3 w-3" />
                                    Add Attribute
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {form.variants.length === 0 && (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <p className="text-sm">No variants added yet</p>
                          <p className="text-xs text-gray-400 mt-1">Add variants to offer different options (sizes, colors, etc.)</p>
                        </div>
                      )}
                    </div>

                    
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 hover:shadow-lg py-3 text-lg font-semibold" 
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <FaSpinner className="mr-2 h-5 w-5 animate-spin" />
                        Submitting Product...
                      </>
                    ) : (
                      <>
                        <FaPlus className="mr-2 h-5 w-5" />
                        Submit Product for Review
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CreateProduct; 