import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/utils/apiClient';
import { showErrorToast, parseApiError } from '@/utils/errorHandling';
import { toast } from '@/utils/toast';

const GoogleLogin = ({ onSuccess, onError }) => {
    const navigate = useNavigate();
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
        try {
            console.log('Google login response:', response);
            
            // Send the token to backend using enhanced API client
            const result = await api.post('/api/v1/users/google-login', {
                token: response.credential
            });

            console.log('Backend response:', result);

            // Store the JWT token
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));

            // Show success message
            toast.success(result.message || 'Google login successful!');

            // Call the success callback
            if (onSuccess) {
                onSuccess(result);
            }

        } catch (error) {
            console.error('Google login error:', error);
            
            // Parse the error using enhanced error handling
            const appError = parseApiError(error);
            
            // Check for email verification required
            if (appError.statusCode === 400 && appError.details?.isVerificationRequired) {
                navigate('/email-verification', {
                    state: {
                        email: appError.details.email || '',
                        firstName: appError.details.firstName || '',
                    }
                });
                return;
            }
            
            // Show error toast with enhanced error handling
            showErrorToast(appError, 'Google login failed. Please try again.');
            
            if (onError) {
                onError(appError);
            }
        }
    };

    return (
        <div className="w-full">
            <div 
                id="google-login-button"
                className="w-full flex justify-center"
            ></div>
        </div>
    );
};

export default GoogleLogin; 