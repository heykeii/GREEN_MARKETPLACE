import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import GoogleLogin from '../components/GoogleLogin';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/v1/users/login`,
                formData
            );

            // Store the JWT token
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            toast.success(response.data.message);
            
            // Redirect to dashboard or home page
            navigate('/');
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = (data) => {
        // Redirect to dashboard or home page after successful Google login
        navigate('/');
    };

    const handleGoogleError = (error) => {
        console.error('Google login error:', error);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-green-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="bg-white/90 rounded-2xl shadow-xl border border-green-200 p-8">
                    <div className="mx-auto h-14 w-14 flex items-center justify-center rounded-full bg-green-100 mb-4 shadow">
                        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                    </div>
                    <h2 className="text-center text-3xl font-extrabold text-green-800 mb-2">
                        Welcome back
                    </h2>
                    <p className="text-center text-sm text-green-600 mb-6">
                        Sign in to your account or{' '}
                        <button
                            onClick={() => navigate('/register')}
                            className="font-semibold text-green-700 hover:text-green-500 underline"
                        >
                            create a new account
                        </button>
                    </p>
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-green-800 mb-1">
                                Email address
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                className="bg-green-50 border-green-200 focus:ring-green-600 focus:border-green-600"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-green-800 mb-1">
                                Password
                            </label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                className="bg-green-50 border-green-200 focus:ring-green-600 focus:border-green-600"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-green-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-green-700">
                                    Remember me
                                </label>
                            </div>
                            <div className="text-sm">
                                <button
                                    type="button"
                                    className="font-medium text-green-600 hover:text-green-500"
                                >
                                    Forgot your password?
                                </button>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold shadow-md"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Signing in...
                                </div>
                            ) : (
                                'Sign in'
                            )}
                        </Button>
                    </form>
                    <div className="mt-8">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-green-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-green-400">Or continue with</span>
                            </div>
                        </div>
                        <GoogleLogin 
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
