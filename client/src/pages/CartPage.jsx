import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/Navbar';
import { FaTrash, FaShoppingCart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';

const CartPage = () => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchCart = async () => {
      if (user && token) {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/cart`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCart(res.data.cart || []);
          localStorage.setItem('cart', JSON.stringify(res.data.cart || []));
        } catch (err) {
          setCart([]);
        }
      } else {
        const stored = JSON.parse(localStorage.getItem('cart') || '[]');
        setCart(stored);
      }
    };
    fetchCart();
  }, []);

  useEffect(() => {
    setTotal(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));
  }, [cart]);

  const updateCart = async (newCart, action, productId) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
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
        // Optionally show error
      }
    }
  };

  const handleQuantity = (idx, val) => {
    const newCart = [...cart];
    newCart[idx].quantity = Math.max(1, val);
    updateCart(newCart, 'update', newCart[idx]._id);
  };

  const handleRemove = (idx) => {
    const productId = cart[idx]._id;
    const newCart = cart.filter((_, i) => i !== idx);
    updateCart(newCart, 'remove', productId);
    toast.info('Removed from cart');
  };

  const handleCheckout = () => {
    toast.success('Checkout not implemented');
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#f5fdfb] via-[#e7f7f4] to-[#daf2ef] py-16 px-4 pt-24">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-extrabold text-emerald-800 mb-10 flex items-center gap-3">
            <FaShoppingCart className="text-emerald-600 text-3xl" /> Your Cart
          </h1>
          {cart.length === 0 ? (
            <div className="text-center py-24 text-gray-500 text-xl font-medium">🛒 Your cart is currently empty.</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-10">
              {/* Cart Items */}
              <div className="md:col-span-2 space-y-6">
                {cart.map((item, idx) => (
                  <div
                    key={item._id}
                    className="flex items-center gap-6 bg-white shadow-md rounded-2xl p-5 hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={item.images?.[0]}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                    />
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-emerald-800">{item.name}</h2>
                      <div className="text-gray-500 text-sm">₱{item.price.toFixed(2)} x</div>
                      <div className="flex items-center gap-3 mt-2">
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleQuantity(idx, parseInt(e.target.value) || 1)}
                          className="w-20 border-gray-300 rounded-lg shadow-sm"
                        />
                        <span className="text-gray-800 font-semibold text-md">
                          = ₱{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-100"
                      onClick={() => handleRemove(idx)}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-3xl shadow-xl p-8 h-fit">
                <h2 className="text-2xl font-bold text-emerald-700 mb-6">Order Summary</h2>
                <div className="flex justify-between text-lg text-gray-700 font-medium mb-2">
                  <span>Subtotal</span>
                  <span>₱{total.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 my-4" />
                <div className="flex justify-between text-xl font-bold text-emerald-800">
                  <span>Total</span>
                  <span>₱{total.toFixed(2)}</span>
                </div>
                <Button
                  className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold py-3 rounded-xl shadow-lg"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartPage;
