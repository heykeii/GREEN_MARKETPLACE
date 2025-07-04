import React, { useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

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
            
            // Send the token to your backend
            const result = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/v1/users/google-login`,
                {
                    token: response.credential
                }
            );

            console.log('Backend response:', result.data);

            // Store the JWT token
            localStorage.setItem('token', result.data.token);
            localStorage.setItem('user', JSON.stringify(result.data.user));

            // Show success message
            toast.success(result.data.message || 'Google login successful!');

            // Call the success callback
            if (onSuccess) {
                onSuccess(result.data);
            }

        } catch (error) {
            // Check for email verification required
            if (error.response?.data?.isVerificationRequired) {
                navigate('/email-verification', {
                    state: {
                        email: error.response.data.email || '',
                        firstName: error.response.data.firstName || '',
                    }
                });
                return;
            }
            // Other errors
            const errorMessage = error.response?.data?.message || 'Google login failed. Please try again.';
            toast.error(errorMessage);
            if (onError) {
                onError(error);
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