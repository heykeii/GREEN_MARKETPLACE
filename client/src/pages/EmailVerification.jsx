import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from '@/utils/toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const EmailVerification = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    const { email, firstName } = location.state || {};

    const handleResendEmail = async () => {
        if (!email) {
            toast.error('Email address not found');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/v1/users/resend-verification`,
                { email }
            );
            toast.success(response.data.message);
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to resend verification email';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoToLogin = () => {
        navigate('/login');
    };

    return (
        <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white py-12 px-4 sm:px-6 lg:px-8 pt-24">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    {/* Success Icon */}
                    <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100">
                        <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Check your email
                    </h2>
                    
                    <p className="mt-4 text-lg text-gray-600">
                        Hi {firstName || 'there'}! We've sent a verification link to:
                    </p>
                    
                    <p className="mt-2 text-lg font-medium text-green-600">
                        {email || 'your email address'}
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
                    <div className="space-y-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-gray-700">
                                    Click the verification link in your email to activate your account
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-gray-700">
                                    The link will expire in 24 hours for security
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-gray-700">
                                    Check your spam folder if you don't see the email
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleResendEmail}
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-green-300 rounded-md shadow-sm bg-white text-sm font-medium text-green-700 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors duration-200"
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                                Sending...
                            </div>
                        ) : (
                            'Resend verification email'
                        )}
                    </button>

                    <button
                        onClick={handleGoToLogin}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                    >
                        Back to login
                    </button>
                </div>

                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        Already verified?{' '}
                        <button
                            onClick={handleGoToLogin}
                            className="font-medium text-green-600 hover:text-green-500"
                        >
                            Sign in here
                        </button>
                    </p>
                </div>
            </div>
        </div>
        <Footer />
        </>
    );
};

export default EmailVerification; 