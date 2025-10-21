import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/Navbar';
import { FaTrash, FaShoppingCart } from 'react-icons/fa';
import { toast } from '@/utils/toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Footer from '@/components/Footer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CartPage = () => {
  const [cart, setCart] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [total, setTotal] = useState(0);
  const [productDetails, setProductDetails] = useState({});

  const navigate = useNavigate();

  const fetchProductDetails = useCallback(async (productId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/products/view/${productId}`);
      if (response.data?.product) {
        setProductDetails(prev => ({
          ...prev,
          [productId]: response.data.product
        }));
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');
    
    const controller = new AbortController();
    
    const fetchCart = async () => {
      if (user && token) {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/cart`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
          });
          const cartItems = res.data.cart || [];
          setCart(cartItems);
          // Fetch product details for items to get variant information
          cartItems.forEach(item => fetchProductDetails(item._id));
          localStorage.setItem('cart', JSON.stringify(cartItems));
          // Select all items by default
          setSelectedItems(new Set(cartItems.map(item => item._id)));
        } catch (err) {
          if (err.name === 'CanceledError') return;
          console.error('Fetch cart error:', err);
          setCart([]);
        }
      } else {
        const stored = JSON.parse(localStorage.getItem('cart') || '[]');
        setCart(stored);
        // Select all items by default
        setSelectedItems(new Set(stored.map(item => item._id)));
      }
    };
    
    fetchCart();
    
    return () => controller.abort();
  }, []);

  useEffect(() => {
    // Calculate total only for selected items
    setTotal(cart.reduce((sum, item) => {
      if (!selectedItems.has(item._id)) return sum;
      const price = item.variant?.price || item.price;
      return sum + price * item.quantity;
    }, 0));
  }, [cart, selectedItems]);

  const updateCart = async (newCart, action, productId) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    localStorage.setItem('lastCartUpdate', Date.now().toString());
    window.dispatchEvent(new Event('cartUpdated'));
    
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');
    
    if (user && token) {
      try {
        if (action === 'update') {
          await axios.patch(`${import.meta.env.VITE_API_URL}/api/v1/cart/update`, {
            productId,
            quantity: newCart.find(i => i._id === productId)?.quantity || 1
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else if (action === 'remove') {
          await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/cart/remove/${productId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } catch (err) {
        console.error('Update cart error:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        }
      }
    }
  };

  const handleQuantity = (idx, val) => {
    const newCart = [...cart];
    newCart[idx].quantity = Math.max(1, val);
    updateCart(newCart, 'update', newCart[idx]._id);
  };

  const handleVariantChange = async (idx, variantIdx) => {
    const newCart = [...cart];
    const item = newCart[idx];
    const product = productDetails[item._id];
    
    if (product?.variants?.[variantIdx]) {
      const selectedVariant = product.variants[variantIdx];
      item.variant = {
        name: selectedVariant.name,
        price: parseFloat(selectedVariant.price),
        sku: selectedVariant.sku,
        attributes: selectedVariant.attributes || {}
      };
      item.selectedVariant = variantIdx;
      
      setCart(newCart);
      localStorage.setItem('cart', JSON.stringify(newCart));
      localStorage.setItem('lastCartUpdate', Date.now().toString());
      window.dispatchEvent(new Event('cartUpdated'));
      
      // Update on server
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const token = localStorage.getItem('token');
      
      if (user && token) {
        try {
          await axios.patch(`${import.meta.env.VITE_API_URL}/api/v1/cart/update`, {
            productId: item._id,
            quantity: item.quantity,
            variant: item.variant
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (err) {
          console.error('Update cart error:', err);
        }
      }
    }
  };

  const handleRemove = (idx) => {
    const productId = cart[idx]._id;
    const newCart = cart.filter((_, i) => i !== idx);
    // Remove from selected items
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
    updateCart(newCart, 'remove', productId);
    toast.info('Removed from cart');
  };

  const handleToggleItem = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === cart.length) {
      // Deselect all
      setSelectedItems(new Set());
    } else {
      // Select all
      setSelectedItems(new Set(cart.map(item => item._id)));
    }
  };

  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      toast.error('Please select at least one item to checkout');
      return;
    }
    
    // Filter only selected items
    const selectedCartItems = cart.filter(item => selectedItems.has(item._id));
    
    // Check if any selected product with variants doesn't have a variant selected
    const hasUnselectedVariants = selectedCartItems.some((item) => {
      const product = productDetails[item._id];
      return product?.variants?.length > 0 && !item.variant;
    });
    
    if (hasUnselectedVariants) {
      toast.error('Please select a variant for all selected products before checkout');
      return;
    }
    
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
      toast.error('Please login to checkout');
      navigate('/login');
      return;
    }
    
    // Save selected items to localStorage for checkout page
    localStorage.setItem('selectedCartItems', JSON.stringify(selectedCartItems));
    
    navigate('/checkout');
  };

  const selectedCount = selectedItems.size;
  const allSelected = cart.length > 0 && selectedItems.size === cart.length;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#f5fdfb] via-[#e7f7f4] to-[#daf2ef] py-14 sm:py-16 px-3 sm:px-4 pt-24">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-emerald-800 mb-6 sm:mb-10 flex items-center gap-2 sm:gap-3">
            <FaShoppingCart className="text-emerald-600 text-3xl" /> Your Cart
          </h1>
          {cart.length === 0 ? (
            <div className="text-center py-16 sm:py-24 text-gray-500 text-base sm:text-xl font-medium">🛒 Your cart is currently empty.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">
              {/* Cart Items */}
              <div className="md:col-span-2 space-y-4 sm:space-y-6">
                {/* Select All Header */}
                <div className="bg-white shadow-md rounded-2xl p-4 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="font-semibold text-gray-700">
                    Select All ({selectedCount} of {cart.length} selected)
                  </span>
                </div>

                {cart.map((item, idx) => (
                  <div
                    key={item._id}
                    className={`flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 bg-white shadow-md rounded-2xl p-4 sm:p-5 hover:shadow-lg transition-all ${
                      selectedItems.has(item._id) ? 'ring-2 ring-emerald-500' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item._id)}
                        onChange={() => handleToggleItem(item._id)}
                        className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer mt-1"
                      />
                    </div>

                    <img
                      src={item.images?.[0]}
                      alt={item.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-gray-200"
                    />
                    <div className="flex-1 w-full">
                      <h2 className="text-lg sm:text-xl font-semibold text-emerald-800 break-words">{item.name}</h2>
                      
                      {/* Show variant selector if product has variants and no variant selected yet */}
                      {productDetails[item._id]?.variants?.length > 0 && !item.variant ? (
                        <div className="mt-2 mb-3">
                          <Select
                            value={item.selectedVariant?.toString()}
                            onValueChange={(value) => handleVariantChange(idx, parseInt(value))}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Select variant" />
                            </SelectTrigger>
                            <SelectContent>
                              {productDetails[item._id].variants.map((variant, vidx) => (
                                <SelectItem key={vidx} value={vidx.toString()}>
                                  {variant.name} - ₱{parseFloat(variant.price).toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : item.variant ? (
                        /* Display selected variant info */
                        <div className="text-sm text-emerald-600 font-medium mt-1">
                          Variant: {item.variant.name}
                          {item.variant.attributes && Object.keys(item.variant.attributes).length > 0 && (
                            <span className="text-gray-500 ml-2">
                              ({Object.entries(item.variant.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')})
                            </span>
                          )}
                        </div>
                      ) : null}
                      
                      <div className="text-gray-500 text-sm mt-1">
                        ₱{(item.variant?.price || item.price).toFixed(2)} x
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleQuantity(idx, parseInt(e.target.value) || 1)}
                          className="w-20 border-gray-300 rounded-lg shadow-sm"
                        />
                        <span className="text-gray-800 font-semibold text-md">
                          = ₱{((item.variant?.price || item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-100 w-full sm:w-auto"
                      onClick={() => handleRemove(idx)}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-3xl shadow-xl p-6 sm:p-8 h-fit">
                <h2 className="text-xl sm:text-2xl font-bold text-emerald-700 mb-4 sm:mb-6">Order Summary</h2>
                <div className="flex justify-between text-base sm:text-lg text-gray-700 font-medium mb-2">
                  <span>Selected Items</span>
                  <span>{selectedCount}</span>
                </div>
                <div className="flex justify-between text-base sm:text-lg text-gray-700 font-medium mb-2">
                  <span>Subtotal</span>
                  <span>₱{total.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 my-4" />
                <div className="flex justify-between text-lg sm:text-xl font-bold text-emerald-800">
                  <span>Total</span>
                  <span>₱{total.toFixed(2)}</span>
                </div>
                <Button
                  className="w-full mt-4 sm:mt-6 bg-emerald-600 hover:bg-emerald-700 text-white text-base sm:text-lg font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleCheckout}
                  disabled={selectedCount === 0}
                >
                  Proceed to Checkout ({selectedCount})
                </Button>
                {selectedCount === 0 && (
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Please select at least one item
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CartPage;
