import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api } from '@/utils/apiClient';
import { showErrorToast, parseApiError } from '@/utils/errorHandling';
import { toast } from '@/utils/toast';

const GoogleLogin = ({ onSuccess, onError }) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        // Load Google Identity Services
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        script.onload = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                    callback: handleCredentialResponse,
                    auto_select: false,
                    cancel_on_tap_outside: true,
                });

                window.google.accounts.id.renderButton(
                    document.getElementById('google-login-button'),
                    {
                        theme: 'outline',
                        size: 'large',
                        text: 'signin_with',
                        shape: 'rectangular',
                        logo_alignment: 'left',
                        width: '100%'
                    }
                );
            }
        };

        return () => {
            // Cleanup
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);

    const handleCredentialResponse = async (response) => {
        let appError = null;
        try {
            setIsLoading(true);
            console.log('Google login response:', response);
            
            if (!response.credential) {
                toast.error('Failed to get Google credentials. Please try again.');
                return;
            }
            
            // Send the token to backend using direct axios call to avoid interceptor issues
            const result = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/v1/users/google-login`,
                { token: response.credential },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000,
                    withCredentials: true
                }
            );

            console.log('Backend response:', result);

            // Store the JWT token
            localStorage.setItem('token', result.data.token);
            localStorage.setItem('user', JSON.stringify(result.data.user));

            // Show success message
            toast.success(result.data.message || 'Google login successful!');

            // Call the success callback only for successful login
            if (onSuccess) {
                onSuccess(result.data);
            }

        } catch (error) {
            console.error('Google login error:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            
            // Check for email verification FIRST before parsing error
            const responseData = error.response?.data;
            const isVerificationRequired = responseData?.isVerificationRequired;
            const isVerificationMessage = responseData?.message?.toLowerCase().includes('verify');
            const statusCode = error.response?.status;
            
            console.log('Debug info:', {
                statusCode,
                isVerificationRequired,
                isVerificationMessage,
                responseData
            });
            
            // Handle email verification case immediately
            if (statusCode === 403 && (isVerificationRequired || isVerificationMessage)) {
                console.log('Email verification required, redirecting...');
                // Show success message since email verification was sent successfully
                toast.success('Verification email sent! Please check your email and click the verification link.');
                navigate('/email-verification', {
                    state: {
                        email: responseData?.email || '',
                        firstName: responseData?.firstName || '',
                    }
                });
                setIsLoading(false);
                return;
            }
            
            // Check if there's a specific error message from the server
            const serverMessage = error.response?.data?.message;
            if (serverMessage) {
                toast.error(serverMessage);
            } else {
                // Parse the error using enhanced error handling for other cases
                const appError = parseApiError(error);
                console.error('Parsed app error:', appError);
                
                // Handle other error cases
                if (appError.type === 'NETWORK_ERROR') {
                    showErrorToast(appError, 'Unable to connect to the server. Please check your internet connection and try again.');
                } else if (appError.type === 'AUTHENTICATION_ERROR') {
                    showErrorToast(appError, 'Google authentication failed. Please try again or use a different sign-in method.');
                } else {
                    // Show error toast with enhanced error handling
                    showErrorToast(appError, 'Google login failed. Please try again.');
                }
            }
            
            if (onError) {
                onError(appError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            {isLoading ? (
                <div className="w-full py-3 px-4 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600 mr-3"></div>
                    <span className="text-gray-700 font-medium">Signing in with Google...</span>
                </div>
            ) : (
                <div 
                    id="google-login-button"
                    className="w-full flex justify-center"
                ></div>
            )}
        </div>
    );
};

export default GoogleLogin; 