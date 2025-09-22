import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '@/utils/apiClient';
import { toast } from '@/utils/toast';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/api/v1/users/reset-password', { token, password });
      toast.success('Password reset successful. Please log in.');
      navigate('/login');
    } catch (e) {
      toast.error(e.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <section className="px-4 pt-28 pb-10">
        <div className="max-w-md mx-auto bg-white border rounded-2xl p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <form onSubmit={submit} className="space-y-4">
            <input type="password" placeholder="New password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full rounded-lg border-gray-300" />
            <input type="password" placeholder="Confirm new password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="w-full rounded-lg border-gray-300" />
            <button disabled={loading} className="w-full px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60">{loading ? 'Resetting…' : 'Reset password'}</button>
          </form>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ResetPassword;


