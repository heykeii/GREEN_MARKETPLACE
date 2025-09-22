import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '@/utils/apiClient';
import { toast } from '@/utils/toast';
import { useLocation } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Pre-fill with email from query or logged-in user
    const params = new URLSearchParams(location.search);
    const fromQuery = params.get('email');
    const fromUser = JSON.parse(localStorage.getItem('user') || 'null')?.email;
    if (fromQuery) setEmail(fromQuery);
    else if (fromUser) setEmail(fromUser);
  }, [location.search]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/v1/users/forgot-password', { email });
      toast.success('If your email exists, a reset link was sent.');
      setEmail('');
    } catch (e) {
      toast.error(e.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <section className="px-4 pt-28 pb-10">
        <div className="max-w-md mx-auto bg-white border rounded-2xl p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password</h1>
          <p className="text-gray-600 mb-4">Enter your email to receive a password reset link.</p>
          <form onSubmit={submit} className="space-y-4">
            <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-lg border-gray-300" />
            <button disabled={loading} className="w-full px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60">{loading ? 'Sending…' : 'Send reset link'}</button>
          </form>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ForgotPassword;


