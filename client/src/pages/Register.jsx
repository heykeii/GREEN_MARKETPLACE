import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import GoogleLogin from '../components/GoogleLogin';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';


const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
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

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            setLoading(false);
            return;
        }

        // Validate password length
        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/v1/users/register`,
                {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password
                }
            );

            toast.success(response.data.message);
            
            // Navigate to email verification page
            navigate('/email-verification', { 
                state: { 
                    email: formData.email,
                    firstName: formData.firstName 
                } 
            });
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = (data) => {
        // Redirect to dashboard after successful Google registration
        navigate('/');
    };

    const handleGoogleError = (error) => {
        console.error('Google registration error:', error);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-green-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="bg-white/90 rounded-2xl shadow-xl border border-green-200 p-8">
                    <div className="mx-auto h-14 w-14 flex items-center justify-center rounded-full bg-green-100 mb-4 shadow">
                        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <h2 className="text-center text-3xl font-extrabold text-green-800 mb-2">
                        Create your account
                    </h2>
                    <p className="text-center text-sm text-green-600 mb-6">
                        Or{' '}
                        <button
                            onClick={() => navigate('/login')}
                            className="font-semibold text-green-700 hover:text-green-500 underline"
                        >
                            sign in to your existing account
                        </button>
                    </p>
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-green-800 mb-1">
                                    First Name
                                </label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    autoComplete="given-name"
                                    required
                                    placeholder="First name"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="bg-green-50 border-green-200 focus:ring-green-600 focus:border-green-600"
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-green-800 mb-1">
                                    Last Name
                                </label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    autoComplete="family-name"
                                    required
                                    placeholder="Last name"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="bg-green-50 border-green-200 focus:ring-green-600 focus:border-green-600"
                                />
                            </div>
                        </div>
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
                                placeholder="Email address"
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
                                autoComplete="new-password"
                                required
                                placeholder="Password (min 6 characters)"
                                value={formData.password}
                                onChange={handleChange}
                                className="bg-green-50 border-green-200 focus:ring-green-600 focus:border-green-600"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-green-800 mb-1">
                                Confirm Password
                            </label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                placeholder="Confirm password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="bg-green-50 border-green-200 focus:ring-green-600 focus:border-green-600"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold shadow-md"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Creating account...
                                </div>
                            ) : (
                                'Create account'
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

export default Register; 