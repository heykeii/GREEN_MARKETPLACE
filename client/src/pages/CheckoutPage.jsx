import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FaShoppingCart, FaCreditCard, FaMapMarkerAlt, FaMoneyBillWave, FaPhone, FaSpinner } from 'react-icons/fa';
import { toast } from '@/utils/toast';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const CheckoutPage = () => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [gcashReceipt, setGcashReceipt] = useState(null);
  const [sellerGcashDetails, setSellerGcashDetails] = useState(null);
  const [receiptVerification, setReceiptVerification] = useState(null);
  const [receiptExtracted, setReceiptExtracted] = useState(null);
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingDetails, setShippingDetails] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  
  // Address state
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    zipCode: ''
  });

  const navigate = useNavigate();
  const location = useLocation();
  const isDirect = new URLSearchParams(location.search).get('mode') === 'direct';

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
      navigate('/login');
      return;
    }

    const fetchCart = async () => {
      try {
        if (isDirect) {
          // Use locally stashed direct checkout items
          const direct = JSON.parse(localStorage.getItem('directCheckout') || 'null');
          if (!direct || !Array.isArray(direct.items) || direct.items.length === 0) {
            toast.error('No item to checkout');
            navigate('/cart');
            return;
          }
          // For UI purposes, fetch product details
          const items = await Promise.all(direct.items.map(async (i) => {
            const pr = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/products/view/${i.productId}`);
            const p = pr.data?.product;
            if (!p) return null;
            const chosenVariant = i?.variant
              || (Number.isInteger(i?.selectedVariant) && Array.isArray(p?.variants)
                    ? p.variants[i.selectedVariant] : null);
            const unitPrice = chosenVariant?.price != null ? Number(chosenVariant.price) : p.price;
            return {
              _id: p._id,
              name: p.name,
              price: unitPrice,
              quantity: i.quantity,
              images: p.images || [],
              image: p.image,
              variant: chosenVariant ? {
                name: chosenVariant.name,
                price: Number(chosenVariant.price),
                sku: chosenVariant.sku,
                attributes: chosenVariant.attributes || {}
              } : undefined
            };
          }));
          setCart(items.filter(Boolean));
        } else {
          // Check if there are selected cart items from the cart page
          const selectedCartItems = localStorage.getItem('selectedCartItems');
          
          if (selectedCartItems) {
            // Use only the selected items from cart page
            const selected = JSON.parse(selectedCartItems);
            if (!selected || selected.length === 0) {
              toast.error('No items selected for checkout');
              navigate('/cart');
              return;
            }
            setCart(selected);
            // Clear the selected items after loading
            localStorage.removeItem('selectedCartItems');
          } else {
            // Fallback: fetch all cart items (for backward compatibility)
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/cart`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const serverCart = res.data.cart || [];
            // Merge variant info from localStorage cart if server doesn't include it
            const localCart = (() => {
              try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
            })();
            const localVariantById = new Map(localCart.map(ci => [ci._id, ci.variant]));
            const merged = serverCart.map(item => ({
              ...item,
              variant: item.variant || localVariantById.get(item._id) || undefined,
              price: (item.variant?.price != null
                ? Number(item.variant.price)
                : (localVariantById.get(item._id)?.price != null
                  ? Number(localVariantById.get(item._id).price)
                  : item.price))
            }));
            setCart(merged);
          }
        }
      } catch (err) {
        console.error('Failed to fetch cart:', err);
        toast.error('Failed to load cart');
        navigate('/cart');
      }
    };

    fetchCart();
  }, [navigate, isDirect]);

  useEffect(() => {
    setTotal(cart.reduce((sum, item) => {
      // Use variant price if variant is selected, otherwise use item price
      const price = item.variant?.price || item.price;
      return sum + price * item.quantity;
    }, 0));
  }, [cart]);

  // Fetch seller's GCash details when GCash is selected
  useEffect(() => {
    const fetchSellerGcashDetails = async () => {
      if (paymentMethod === 'gcash' && cart.length > 0) {
        try {
          const token = localStorage.getItem('token');
          const sellerId = cart[0].seller; // Assuming all items are from the same seller
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/v1/seller/${sellerId}/gcash`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setSellerGcashDetails(response.data.gcash);
        } catch (error) {
          console.error('Failed to fetch seller GCash details:', error);
          toast.error('Failed to load seller GCash details');
        }
      }
    };

    fetchSellerGcashDetails();
  }, [paymentMethod, cart]);

  // Initialize address with user data
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user) {
      setAddress({
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        phone: user.contactNumber || '',
        address: user.location?.address || '',
        city: user.location?.city || '',
        province: user.location?.province || '',
        zipCode: user.location?.zipCode || ''
      });
    }
  }, []);

  // Calculate shipping when address changes
  useEffect(() => {
    const calculateShipping = async () => {
      if (!address.city || !address.province || cart.length === 0) {
        setShippingFee(0);
        setShippingDetails(null);
        return;
      }

      setLoadingShipping(true);
      try {
        const token = localStorage.getItem('token');
        const directCheckout = isDirect ? JSON.parse(localStorage.getItem('directCheckout') || 'null') : null;

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/v1/orders/calculate-shipping`,
          {
            shippingAddress: address,
            items: isDirect && directCheckout ? directCheckout.items : undefined
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          setShippingFee(response.data.shipping.shippingFee);
          setShippingDetails(response.data.shipping);
        }
      } catch (error) {
        console.error('Failed to calculate shipping:', error);
        setShippingFee(50); // Default fallback
      } finally {
        setLoadingShipping(false);
      }
    };

    // Debounce the calculation
    const timer = setTimeout(calculateShipping, 800);
    return () => clearTimeout(timer);
  }, [address.city, address.province, cart, isDirect]);

  const validateAddress = () => {
    const required = ['fullName', 'phone', 'address', 'city', 'province', 'zipCode'];
    for (const field of required) {
      if (!address[field]?.trim()) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    
    // Phone validation (basic Philippine format)
    const phoneRegex = /^(\+63|0)[0-9]{10}$/;
    if (!phoneRegex.test(address.phone.replace(/\s/g, ''))) {
      toast.error('Please enter a valid Philippine phone number');
      return false;
    }
    
    // Zip code validation (basic format)
    if (!/^\d{4}$/.test(address.zipCode)) {
      toast.error('Please enter a valid 4-digit zip code');
      return false;
    }
    
    return true;
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!validateAddress()) {
      return;
    }

    // Enforce receipt upload for GCash payments
    if (paymentMethod === 'gcash' && !gcashReceipt) {
      toast.error('Please upload your GCash payment receipt');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      // For GCash payments, verify receipt BEFORE creating order
    if (paymentMethod === 'gcash' && gcashReceipt) {
      // reset previous verification details
      setReceiptVerification(null);
      setReceiptExtracted(null);
        // First, create a temporary order to get seller details and validate against
        const tempPayload = isDirect ? {
          paymentMethod,
          notes,
          shippingAddress: address,
          items: JSON.parse(localStorage.getItem('directCheckout') || '{"items":[]}').items || []
        } : {
          paymentMethod,
          notes,
          shippingAddress: address
        };

        // Add a flag to indicate this is for receipt verification only
        tempPayload.verifyReceiptOnly = true;

        toast.info('Verifying payment receipt...');

        try {
          // Create order with verification flag
          const tempOrderRes = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/v1/orders/verify-receipt`,
            tempPayload,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );

          if (!tempOrderRes.data.success) {
            toast.error(tempOrderRes.data.message || 'Failed to validate order details');
            return;
          }

          const { orderData, sellerGcashDetails } = tempOrderRes.data;

          // Upload and verify receipt
          const formData = new FormData();
          formData.append('receipt', gcashReceipt);
          formData.append('orderData', JSON.stringify(orderData));
          formData.append('sellerGcashDetails', JSON.stringify(sellerGcashDetails));

          const uploadRes = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/v1/payment-receipts/verify-only`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              }
            }
          );

          if (!uploadRes.data?.success) {
            toast.error(uploadRes.data?.message || 'Receipt verification failed');
            setReceiptVerification(uploadRes.data?.verification || null);
            setReceiptExtracted(uploadRes.data?.extractedData || null);
            return;
          }

          const verification = uploadRes.data.verification;
          setReceiptVerification(verification);
          setReceiptExtracted(uploadRes.data.extractedData);
          if (verification.overallStatus !== 'verified') {
            const reasons = [];
            if (!verification.amountMatch) reasons.push('Amount mismatch');
            if (!verification.receiverMatch) reasons.push('Receiver account mismatch');
            if (!verification.referenceValid) reasons.push('Invalid reference number format');
            if (verification.isDuplicate) reasons.push('Duplicate reference number');
            
            toast.error(`Receipt verification failed: ${reasons.join(', ')}`);
            return;
          }

          toast.success('Receipt verified! Creating order...');
          
          // Store verification data for order creation
          tempPayload.verifiedReceiptData = uploadRes.data.extractedData;
          tempPayload.receiptImageUrl = uploadRes.data.receiptImageUrl;
          
        } catch (verifyError) {
          console.error('Receipt verification error:', verifyError);
          toast.error(verifyError.response?.data?.message || 'Receipt verification failed');
          return;
        }
      }

      // Create the actual order
      const endpoint = isDirect ? 'create-direct' : 'create';
      const payload = isDirect ? {
        paymentMethod,
        notes,
        shippingAddress: address,
        items: JSON.parse(localStorage.getItem('directCheckout') || '{"items":[]}').items || []
      } : {
        paymentMethod,
        notes,
        shippingAddress: address,
        // Send the cart items (which are already the selected ones from cart page)
        items: cart.map(item => ({
          productId: item._id,
          quantity: item.quantity,
          variant: item.variant
        }))
      };

      // Add verified receipt data if available
      if (paymentMethod === 'gcash' && gcashReceipt) {
        payload.verifiedReceiptData = tempPayload.verifiedReceiptData;
        payload.receiptImageUrl = tempPayload.receiptImageUrl;
      }
      
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/orders/${endpoint}`,
        payload,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (res.data.success) {
        setOrderPlaced(true);
        if (paymentMethod === 'gcash') {
          toast.success('Order placed successfully! Payment verified.');
        } else {
          toast.success('Order placed successfully!');
        }
        
        // Clear local cart or direct payload
        if (isDirect) {
          localStorage.removeItem('directCheckout');
        } else {
          localStorage.removeItem('cart');
        }
        localStorage.setItem('lastCartUpdate', Date.now().toString());
        window.dispatchEvent(new Event('cartUpdated'));
        
        // Redirect to order details after 3 seconds
        setTimeout(() => {
          navigate(`/orders/${res.data.order._id}`);
        }, 3000);
      }
    } catch (error) {
      console.error('Place order error:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to place order');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (field, value) => {
    setAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (orderPlaced) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-[#f5fdfb] via-[#e7f7f4] to-[#daf2ef] py-16 px-4 pt-24">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-3xl shadow-xl p-12">
              <div className="text-6xl mb-6">🎉</div>
              <h1 className="text-3xl font-bold text-emerald-800 mb-4">
                Order Placed Successfully!
              </h1>
              <p className="text-gray-600 text-lg mb-6">
                Thank you for your order. You will be redirected to your order details shortly.
              </p>
              <Button
                onClick={() => navigate('/orders')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                View My Orders
              </Button>
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
        <div className="min-h-screen bg-gradient-to-br from-[#f5fdfb] via-[#e7f7f4] to-[#daf2ef] py-14 sm:py-16 px-3 sm:px-4 pt-24">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-emerald-800 mb-6 sm:mb-10 flex items-center gap-2 sm:gap-3">
            <FaShoppingCart className="text-emerald-600 text-3xl" /> Checkout
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
            {/* Order Summary */}
            <div>
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl text-emerald-800 flex items-center gap-2">
                    <FaShoppingCart className="text-emerald-600" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.map((item, idx) => (
                    <div key={item._id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl">
                      <img
                        src={(item.images && item.images[0]) || item.image || '/placeholder-product.jpg'}
                        alt={item.name}
                        onError={(e)=>{ e.currentTarget.src='/placeholder-product.jpg'; }}
                        className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg border"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-emerald-800 text-sm sm:text-base break-words">{item.name}</h3>
                        <p className="text-gray-600">
                          ₱{(item.variant?.price || item.price).toFixed(2)} x {item.quantity}
                          {item.variant && (
                            <span className="ml-2 text-sm text-emerald-600">
                              ({item.variant.name})
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-700 text-sm sm:text-base">
                          ₱{((item.variant?.price || item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-base sm:text-lg">
                      <span>Subtotal</span>
                      <span>₱{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span className="flex items-center gap-2">
                        Shipping
                        {loadingShipping && <FaSpinner className="animate-spin text-xs" />}
                      </span>
                      <div className="text-right">
                        <span className={shippingFee > 0 ? 'text-emerald-700 font-medium' : ''}>
                          ₱{shippingFee.toFixed(2)}
                        </span>
                        {shippingDetails && (
                          <p className="text-xs text-gray-500">
                            {shippingDetails.estimatedDays} days · {shippingDetails.courierType}
                          </p>
                        )}
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg sm:text-xl font-bold text-emerald-800">
                      <span>Total</span>
                      <span>₱{(total + shippingFee).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment & Shipping Details */}
            <div className="space-y-6">
              {/* Shipping Address */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl text-emerald-800 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-emerald-600" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={address.fullName}
                      onChange={(e) => handleAddressChange('fullName', e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone Number *
                    </Label>
                    <div className="relative">
                      <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={address.phone}
                        onChange={(e) => handleAddressChange('phone', e.target.value)}
                        placeholder="09XX XXX XXXX or +63 9XX XXX XXXX"
                        className="pl-10 mt-1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                      Street Address *
                    </Label>
                    <Input
                      id="address"
                      type="text"
                      value={address.address}
                      onChange={(e) => handleAddressChange('address', e.target.value)}
                      placeholder="House/Unit number, Street name, Barangay"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                        City/Municipality *
                      </Label>
                      <Input
                        id="city"
                        type="text"
                        value={address.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        placeholder="Enter city"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="province" className="text-sm font-medium text-gray-700">
                        Province *
                      </Label>
                      <Input
                        id="province"
                        type="text"
                        value={address.province}
                        onChange={(e) => handleAddressChange('province', e.target.value)}
                        placeholder="Enter province"
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="zipCode" className="text-sm font-medium text-gray-700">
                      ZIP Code *
                    </Label>
                    <Input
                      id="zipCode"
                      type="text"
                      value={address.zipCode}
                      onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                      placeholder="4-digit ZIP code"
                      maxLength={4}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Email:</strong> {JSON.parse(localStorage.getItem('user') || '{}')?.email}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl text-emerald-800 flex items-center gap-2">
                    <FaCreditCard className="text-emerald-600" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="cod"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-emerald-600"
                      />
                      <label htmlFor="cod" className="flex items-center gap-2 cursor-pointer">
                        <FaMoneyBillWave className="text-green-600" />
                        Cash on Delivery
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="gcash"
                        name="paymentMethod"
                        value="gcash"
                        checked={paymentMethod === 'gcash'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-emerald-600"
                      />
                      <label htmlFor="gcash" className="flex items-center gap-2 cursor-pointer">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded text-xs flex items-center justify-center font-bold">
                          G
                        </div>
                        GCash
                      </label>
                    </div>

                    {/* GCash Details */}
                    {paymentMethod === 'gcash' && (
                      <div className="mt-2 sm:mt-4 space-y-3 sm:space-y-4">
                        {sellerGcashDetails ? (
                          <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-sm font-medium text-gray-700">GCash Number</Label>
                                <p className="text-lg font-semibold text-blue-700">{sellerGcashDetails.number}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                                onClick={() => {
                                  navigator.clipboard.writeText(sellerGcashDetails.number);
                                  toast.success('GCash number copied to clipboard!');
                                }}
                              >
                                Copy
                              </Button>
                            </div>

                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">GCash QR Code</Label>
                              <div className="relative aspect-square w-full max-w-[180px] sm:max-w-[200px] mx-auto">
                                <img
                                  src={sellerGcashDetails.qrCode}
                                  alt="GCash QR Code"
                                  className="w-full h-full object-contain border border-gray-200 rounded-lg"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                                  onClick={() => window.open(sellerGcashDetails.qrCode, '_blank')}
                                >
                                  View
                                </Button>
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="gcashReceipt" className="text-sm font-medium text-gray-700">
                                Upload Payment Receipt *
                              </Label>
                              <Input
                                id="gcashReceipt"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                                  setGcashReceipt(file);
                                  setReceiptVerification(null);
                                  setReceiptExtracted(null);
                                }}
                                className="mt-1"
                                required
                              />
                              <p className="text-sm text-gray-500 mt-1">
                                Please upload a clear screenshot of your GCash payment receipt (max 10MB)
                              </p>

                              {receiptVerification && receiptVerification.overallStatus !== 'verified' && (
                                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                                  <p className="text-sm font-medium text-red-800">Receipt Verification Failed</p>
                                  <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
                                    {!receiptVerification.amountMatch && (
                                      <li>
                                        Amount mismatch: expected ₱{(total + shippingFee).toFixed(2)}{receiptExtracted?.amount ? `, found ₱${Number(receiptExtracted.amount).toFixed(2)}` : ''}
                                      </li>
                                    )}
                                    {!receiptVerification.receiverMatch && (
                                      <li>
                                        Receiver mismatch: seller {sellerGcashDetails?.number || 'N/A'} vs receipt {(receiptExtracted?.receiver?.number || receiptExtracted?.sender?.number || 'N/A')}
                                      </li>
                                    )}
                                    {!receiptVerification.referenceValid && (
                                      <li>
                                        Invalid reference number format{receiptExtracted?.referenceNumber ? `: ${receiptExtracted.referenceNumber}` : ''}
                                      </li>
                                    )}
                                    {receiptVerification.isDuplicate && (
                                      <li>
                                        Duplicate reference number{receiptExtracted?.referenceNumber ? `: ${receiptExtracted.referenceNumber}` : ''}
                                      </li>
                                    )}
                                  </ul>
                                  {receiptExtracted && (
                                    <div className="mt-3 text-xs text-gray-700 bg-white rounded p-2 border">
                                      <div className="font-medium mb-1">Extracted Details</div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-4">
                                        <div>
                                          <span className="text-gray-600">Reference:</span> {receiptExtracted.referenceNumber || 'N/A'}
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Amount:</span> {receiptExtracted.amount != null ? `₱${Number(receiptExtracted.amount).toFixed(2)}` : 'N/A'}
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Receiver:</span> {(receiptExtracted.receiver?.name || 'N/A')} {(receiptExtracted.receiver?.number || receiptExtracted.sender?.number) ? `(${receiptExtracted.receiver?.number || receiptExtracted.sender?.number})` : ''}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <FaSpinner className="animate-spin h-8 w-8 text-blue-600 mx-auto" />
                            <p className="text-gray-600 mt-2">Loading GCash details...</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Notes */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-xl text-emerald-800">Order Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="notes" className="text-sm text-gray-600">
                    Special instructions for your order (optional)
                  </Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Please handle with care, preferred delivery time, etc."
                    className="w-full mt-2 p-3 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    maxLength={500}
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {notes.length}/500 characters
                  </div>
                </CardContent>
              </Card>

              {/* Place Order Button */}
              <Button
                onClick={handlePlaceOrder}
                disabled={loading || cart.length === 0 || (paymentMethod === 'gcash' && !gcashReceipt)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-base sm:text-lg font-bold py-3 sm:py-4 rounded-xl shadow-lg transition-all duration-200"
              >
                {loading ? 'Placing Order...' : `Place Order - ₱${(total + shippingFee).toFixed(2)}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CheckoutPage;
