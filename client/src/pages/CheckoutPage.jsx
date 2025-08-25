import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FaShoppingCart, FaCreditCard, FaMapMarkerAlt, FaMoneyBillWave, FaPhone } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CheckoutPage = () => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  
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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
      navigate('/login');
      return;
    }

    const fetchCart = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/cart`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCart(res.data.cart || []);
      } catch (err) {
        console.error('Failed to fetch cart:', err);
        toast.error('Failed to load cart');
        navigate('/cart');
      }
    };

    fetchCart();
  }, [navigate]);

  useEffect(() => {
    setTotal(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));
  }, [cart]);

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

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/orders/create`,
        {
          paymentMethod,
          notes,
          shippingAddress: address
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.success) {
        setOrderPlaced(true);
        toast.success('Order placed successfully!');
        
        // Clear local cart
        localStorage.removeItem('cart');
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
      <div className="min-h-screen bg-gradient-to-br from-[#f5fdfb] via-[#e7f7f4] to-[#daf2ef] py-16 px-4 pt-24">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-extrabold text-emerald-800 mb-10 flex items-center gap-3">
            <FaShoppingCart className="text-emerald-600 text-3xl" /> Checkout
          </h1>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Order Summary */}
            <div>
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-2xl text-emerald-800 flex items-center gap-2">
                    <FaShoppingCart className="text-emerald-600" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.map((item, idx) => (
                    <div key={item._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <img
                        src={item.images?.[0]}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-emerald-800">{item.name}</h3>
                        <p className="text-gray-600">₱{item.price.toFixed(2)} x {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-700">
                          ₱{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-lg">
                      <span>Subtotal</span>
                      <span>₱{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Shipping</span>
                      <span>Free</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xl font-bold text-emerald-800">
                      <span>Total</span>
                      <span>₱{total.toFixed(2)}</span>
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
                  <CardTitle className="text-xl text-emerald-800 flex items-center gap-2">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <CardTitle className="text-xl text-emerald-800 flex items-center gap-2">
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
                disabled={loading || cart.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold py-4 rounded-xl shadow-lg transition-all duration-200"
              >
                {loading ? 'Placing Order...' : `Place Order - ₱${total.toFixed(2)}`}
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
