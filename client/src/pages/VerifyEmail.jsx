import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Message from '../components/Message';

const VerifyEmail = () => {
    const [verifying, setVerifying] = useState(true);
    const [status, setStatus] = useState(null);
    const { token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users/verify-email/${token}`);
                
                // Set success status
                setStatus({
                    type: 'success',
                    message: response.data.message
                });

                // Show success toast
                toast.success(response.data.message);

                // Store user data in localStorage if needed
                if (response.data.user) {
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                }

                // Redirect to login page after 3 seconds
                
            } catch (error) {
                const errorMessage = error.response?.data?.message || 'Verification failed. Please try again.';
                setStatus({
                    type: 'error',
                    message: errorMessage
                });
                toast.error(errorMessage);
            } finally {
                setVerifying(false);
            }
        };

        // Start verification immediately when component mounts
        verifyEmail();
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Email Verification
                    </h2>
                </div>
                <div className="mt-8 space-y-6">
                    {verifying ? (
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Verifying your email...</p>
                        </div>
                    ) : status && (
                        <div className="space-y-4">
                            <Message 
                                type={status.type} 
                                message={status.message}
                            />
                            {status.type === 'error' && (
                                <div className="text-center">
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                        Go to Login
                                    </button>
                                </div>
                            )}
                            {status.type === 'success' && (
                                <div className="text-center">
                                  
                                    <div className="mt-4">
                                       <button onClick={() => navigate('/login')}>
                                            Go to Login Now
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail; 