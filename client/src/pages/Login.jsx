import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from '@/utils/toast';
import GoogleLogin from '../components/GoogleLogin';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
        <>
        <Navbar />
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 pt-24">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-green-200/30 to-emerald-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-gradient-to-br from-teal-300/20 to-emerald-300/20 rounded-full blur-2xl animate-bounce delay-2000"></div>
                <div className="absolute bottom-1/4 right-1/3 w-24 h-24 bg-gradient-to-br from-emerald-300/20 to-green-300/20 rounded-full blur-xl animate-bounce delay-3000"></div>
            </div>

            {/* Main Content */}
            <div className="relative flex items-center justify-center min-h-[80vh] sm:min-h-screen py-10 sm:py-12 px-3 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-6 sm:space-y-8">
                    {/* Glass Card Container */}
                    <div className="backdrop-blur-xl bg-white/20 rounded-3xl shadow-2xl border border-white/30 p-10 relative overflow-hidden">
                        {/* Inner glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl"></div>
                        
                        {/* Content */}
                        <div className="relative z-10">
                            {/* Logo/Icon */}
                            <div className="flex justify-center mb-8">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl blur-lg opacity-60 animate-pulse"></div>
                                    <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 shadow-xl">
                                        <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Header */}
                            <div className="text-center mb-6 sm:mb-8">
                                <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-green-700 bg-clip-text text-transparent mb-3">
                                    Welcome Back
                                </h2>
                                <p className="text-emerald-600/80 text-sm sm:text-base leading-relaxed px-2">
                                    Sign in to continue your journey or{' '}
                                    <button
                                        onClick={() => navigate('/register')}
                                        className="font-semibold text-emerald-700 hover:text-emerald-600 underline decoration-2 underline-offset-2 transition-colors duration-200"
                                    >
                                        create a new account
                                    </button>
                                </p>
                            </div>

                            {/* Form */}
                            <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
                                <div className="space-y-4 sm:space-y-5">
                                    <div className="group">
                                        <label htmlFor="email" className="block text-sm font-semibold text-emerald-800 mb-2 transition-colors group-focus-within:text-emerald-600">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                autoComplete="email"
                                                required
                                                placeholder="Enter your email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 backdrop-blur-sm bg-white/40 border-2 border-white/30 rounded-xl 
                                                         focus:bg-white/60 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/50 
                                                         transition-all duration-300 placeholder-emerald-400/70 text-emerald-800
                                                         shadow-lg hover:shadow-xl"
                                            />
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-teal-500/0 pointer-events-none"></div>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label htmlFor="password" className="block text-sm font-semibold text-emerald-800 mb-2 transition-colors group-focus-within:text-emerald-600">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                name="password"
                                                type="password"
                                                autoComplete="current-password"
                                                required
                                                placeholder="Enter your password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 backdrop-blur-sm bg-white/40 border-2 border-white/30 rounded-xl 
                                                         focus:bg-white/60 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/50 
                                                         transition-all duration-300 placeholder-emerald-400/70 text-emerald-800
                                                         shadow-lg hover:shadow-xl"
                                            />
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-teal-500/0 pointer-events-none"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Remember Me & Forgot Password */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center group">
                                        <input
                                            id="remember-me"
                                            name="remember-me"
                                            type="checkbox"
                                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500/50 border-emerald-300 rounded 
                                                     transition-all duration-200 shadow-sm"
                                        />
                                        <label htmlFor="remember-me" className="ml-3 block text-sm text-emerald-700 group-hover:text-emerald-600 transition-colors">
                                            Remember me
                                        </label>
                                    </div>
                                    <div className="text-sm">
                                        <Link
                                            to={`/forgot-password?email=${encodeURIComponent(formData.email || '')}`}
                                            className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors duration-200 hover:underline decoration-2 underline-offset-2"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full py-2.5 sm:py-3 px-4 border border-transparent text-base font-semibold rounded-xl 
                                             text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 
                                             hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-700 
                                             focus:outline-none focus:ring-4 focus:ring-emerald-200/50 
                                             disabled:opacity-50 disabled:cursor-not-allowed
                                             shadow-xl hover:shadow-2xl transform hover:scale-[1.02] 
                                             transition-all duration-300 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 
                                                  transform -skew-x-12 -translate-x-full group-hover:translate-x-full 
                                                  transition-transform duration-1000"></div>
                                    <div className="relative z-10">
                                        {loading ? (
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                                                Signing you in...
                                            </div>
                                        ) : (
                                            'Sign In'
                                        )}
                                    </div>
                                </Button>
                            </form>

                            {/* Divider */}
                            <div className="mt-6 sm:mt-8">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gradient-to-r from-transparent via-emerald-200 to-transparent" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-3 sm:px-4 backdrop-blur-sm bg-white/30 text-emerald-600 rounded-full font-medium text-xs sm:text-sm">
                                            Or continue with
                                        </span>
                                    </div>
                                </div>

                                {/* Google Login */}
                                <div className="transform hover:scale-[1.02] transition-transform duration-200">
                                    <GoogleLogin 
                                        onSuccess={handleGoogleSuccess}
                                        onError={handleGoogleError}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="flex justify-center space-x-2 mt-8">
                        <div className="w-2 h-2 bg-emerald-400/60 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-teal-400/60 rounded-full animate-pulse delay-100"></div>
                        <div className="w-2 h-2 bg-green-400/60 rounded-full animate-pulse delay-200"></div>
                    </div>
                </div>
            </div>

            
        </div>
        <Footer />
        </>
    );
};

export default Login;